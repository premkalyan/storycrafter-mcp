#!/usr/bin/env node

/**
 * StoryCrafter MCP Test Runner
 *
 * Tests the VISHKAR format transformation and MCP tool execution
 *
 * Usage:
 *   node tests/run-tests.js [test_number] [--local|--prod]
 *
 * Examples:
 *   node tests/run-tests.js 1 --local    # Test 1 against local dev server
 *   node tests/run-tests.js 1 --prod     # Test 1 against production
 *   node tests/run-tests.js all --prod   # All tests against production
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const LOCAL_URL = 'http://localhost:3000/api/mcp';
const PROD_URL = 'https://storycrafter-mcp.vercel.app/api/mcp';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

async function runTest(testFile, mcpUrl) {
  const testPath = path.join(__dirname, testFile);

  if (!fs.existsSync(testPath)) {
    throw new Error(`Test file not found: ${testFile}`);
  }

  const testData = JSON.parse(fs.readFileSync(testPath, 'utf8'));

  log('\n' + '='.repeat(80), 'bright');
  log(`TEST: ${testData.test_name}`, 'cyan');
  log('='.repeat(80), 'bright');

  log(`\nDescription: ${testData.description}`, 'gray');

  if (testData.prerequisite) {
    log(`Prerequisite: ${testData.prerequisite}`, 'yellow');
  }

  log(`\nMCP Endpoint: ${mcpUrl}`, 'blue');
  log(`Tool: ${testData.mcp_request.params.tool}`, 'blue');

  // Show input (VISHKAR format)
  log('\n📥 INPUT (VISHKAR Format):', 'bright');
  log('─'.repeat(80), 'gray');
  const args = testData.mcp_request.params.arguments;

  if (args.project_context) {
    log('\nproject_context.project_summary:', 'yellow');
    log(formatJSON(args.project_context.project_summary), 'gray');

    log('\nproject_context.final_decisions:', 'yellow');
    log(formatJSON(args.project_context.final_decisions), 'gray');
  }

  if (args.epics) {
    log('\nepics:', 'yellow');
    log(formatJSON(args.epics), 'gray');
  }

  if (args.epic) {
    log('\nepic:', 'yellow');
    log(formatJSON(args.epic), 'gray');
  }

  if (args.story) {
    log('\nstory:', 'yellow');
    log(formatJSON(args.story), 'gray');
  }

  if (args.user_feedback) {
    log('\nuser_feedback:', 'yellow');
    log(`"${args.user_feedback}"`, 'gray');
  }

  // Show expected transformation
  if (testData.expected_transformation) {
    log('\n🔄 EXPECTED TRANSFORMATION (to Service Format):', 'bright');
    log('─'.repeat(80), 'gray');
    log(formatJSON(testData.expected_transformation), 'gray');
  }

  // Call MCP
  log('\n⚡ CALLING MCP...', 'bright');
  log('─'.repeat(80), 'gray');

  const startTime = Date.now();

  try {
    const response = await axios.post(mcpUrl, testData.mcp_request, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 600000 // 10 minutes for story generation
    });

    const duration = Date.now() - startTime;

    log(`\n✅ SUCCESS (${(duration / 1000).toFixed(1)}s)`, 'green');
    log('─'.repeat(80), 'gray');

    // Parse response
    const mcpResponse = response.data;

    if (mcpResponse.content && mcpResponse.content[0]) {
      const resultText = mcpResponse.content[0].text;
      let result;

      try {
        result = JSON.parse(resultText);
      } catch (e) {
        result = resultText;
      }

      log('\n📤 OUTPUT:', 'bright');
      log('─'.repeat(80), 'gray');

      if (typeof result === 'object') {
        // Show summary first
        if (result.success) {
          log(`\n✓ success: ${result.success}`, 'green');
        }

        if (result.epics) {
          log(`✓ epics generated: ${result.epics.length}`, 'green');
          result.epics.forEach((epic, idx) => {
            log(`  ${idx + 1}. ${epic.id}: ${epic.title}`, 'gray');
          });
        }

        if (result.stories) {
          log(`✓ stories generated: ${result.stories.length}`, 'green');
          result.stories.forEach((story, idx) => {
            log(`  ${idx + 1}. ${story.id}: ${story.title} (${story.story_points}pts, ${story.estimated_hours}h)`, 'gray');
          });
        }

        if (result.epic) {
          log(`✓ epic regenerated: ${result.epic.id}: ${result.epic.title}`, 'green');
          if (result.epic.regeneration_notes) {
            log(`  Notes: ${result.epic.regeneration_notes}`, 'gray');
          }
        }

        if (result.story) {
          log(`✓ story regenerated: ${result.story.id}: ${result.story.title}`, 'green');
          if (result.story.regeneration_notes) {
            log(`  Notes: ${result.story.regeneration_notes}`, 'gray');
          }
        }

        if (result.metadata) {
          log(`\nMetadata:`, 'cyan');
          log(formatJSON(result.metadata), 'gray');
        }

        // Full response
        log(`\n📋 Full Response:`, 'cyan');
        log(formatJSON(result), 'gray');

      } else {
        log(result, 'gray');
      }
    } else {
      log(formatJSON(mcpResponse), 'gray');
    }

    return { success: true, duration };

  } catch (error) {
    const duration = Date.now() - startTime;

    log(`\n❌ FAILED (${(duration / 1000).toFixed(1)}s)`, 'red');
    log('─'.repeat(80), 'gray');

    if (error.response) {
      log(`Status: ${error.response.status} ${error.response.statusText}`, 'red');
      log(`\nError Response:`, 'red');
      log(formatJSON(error.response.data), 'gray');
    } else if (error.request) {
      log('No response received from server', 'red');
      log(`Error: ${error.message}`, 'gray');
    } else {
      log(`Error: ${error.message}`, 'red');
    }

    return { success: false, duration, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const testNumber = args[0] || '1';
  const env = args[1] || '--local';

  const mcpUrl = env === '--prod' ? PROD_URL : LOCAL_URL;

  log('\n' + '█'.repeat(80), 'bright');
  log('  StoryCrafter MCP Test Runner', 'bright');
  log('█'.repeat(80), 'bright');
  log(`\nEnvironment: ${env === '--prod' ? 'Production' : 'Local Development'}`, 'cyan');
  log(`MCP URL: ${mcpUrl}`, 'cyan');

  const tests = [];

  if (testNumber === 'all') {
    tests.push('test_1_generate_epics.json');
    tests.push('test_2_generate_stories.json');
    tests.push('test_3_regenerate_epic.json');
    tests.push('test_4_regenerate_story.json');
  } else {
    tests.push(`test_${testNumber}_*.json`);
  }

  const results = [];

  for (let testPattern of tests) {
    let testFile;

    if (testPattern.includes('*')) {
      // Find matching file
      const files = fs.readdirSync(__dirname);
      const match = files.find(f => f.startsWith(`test_${testNumber}_`) && f.endsWith('.json'));
      if (!match) {
        log(`\n❌ Test file not found for test ${testNumber}`, 'red');
        continue;
      }
      testFile = match;
    } else {
      testFile = testPattern;
    }

    try {
      const result = await runTest(testFile, mcpUrl);
      results.push({ test: testFile, ...result });
    } catch (error) {
      log(`\n❌ Error running test: ${error.message}`, 'red');
      results.push({ test: testFile, success: false, error: error.message });
    }

    // Wait between tests if running all
    if (tests.length > 1 && testFile !== tests[tests.length - 1]) {
      log('\n⏳ Waiting 2 seconds before next test...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  log('\n' + '█'.repeat(80), 'bright');
  log('  TEST SUMMARY', 'bright');
  log('█'.repeat(80), 'bright');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? `(${(result.duration / 1000).toFixed(1)}s)` : '';
    const color = result.success ? 'green' : 'red';
    log(`\n${status} ${result.test} ${duration}`, color);
    if (result.error) {
      log(`   Error: ${result.error}`, 'gray');
    }
  });

  log(`\n${'─'.repeat(80)}`, 'gray');
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`,
      failed > 0 ? 'yellow' : 'green');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
