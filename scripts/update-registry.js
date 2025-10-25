#!/usr/bin/env node

/**
 * StoryCrafter MCP - Registry Update Script
 *
 * Updates the central MCP registry after successful deployment.
 * Called automatically after Vercel deployment completes.
 *
 * Environment Variables:
 *   REGISTRY_UPDATE_TOKEN - Required: Token for registry updates
 *   VERCEL_URL - Optional: Vercel deployment URL (auto-set by Vercel)
 */

const https = require('https');

// ============================================================================
// StoryCrafter Service Configuration
// ============================================================================

const SERVICE_CONFIG = {
  serviceKey: 'storycrafter',
  serviceName: 'StoryCrafter MCP',
  description: 'AI-powered backlog generator for VISHKAR 3-agent consensus discussions. Generates 6-8 comprehensive epics with 20-40 detailed user stories, complete with acceptance criteria, technical tasks, story points, and time estimates. Use this AFTER Enhanced Context MCP when you have consensus messages and need to create a complete project backlog.',
  transport: 'http',
  authentication: {
    type: 'none',
    note: 'No authentication required (service handles its own API keys)'
  },
  tools: [
    {
      name: 'generate_backlog',
      description: 'Generate complete project backlog from VISHKAR 3-agent consensus discussion (system, alex, blake, casey messages). Returns structured backlog with 6-8 epics, 20-40 stories, acceptance criteria in Given/When/Then format, technical implementation tasks, story points (Fibonacci scale), estimated hours, dependencies, tags, and MVP prioritization. Takes 30-60 seconds to generate.',
      endpoint: '/api/mcp',
      method: 'POST'
    },
    {
      name: 'get_backlog_summary',
      description: 'Extract summary statistics from a generated backlog: total epics, total stories, total hours, and breakdown by epic',
      endpoint: '/api/mcp',
      method: 'POST'
    }
  ]
};

// ============================================================================
// Registry Update Logic
// ============================================================================

const REGISTRY_API_URL = 'https://enhanced-context-mcp.vercel.app';
const REGISTRY_UPDATE_TOKEN = process.env.REGISTRY_UPDATE_TOKEN;

// Determine service URL - use Vercel URL if available, otherwise default
const SERVICE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://storycrafter-mcp.vercel.app';

// Validate configuration
if (!REGISTRY_UPDATE_TOKEN) {
  console.error('❌ Error: REGISTRY_UPDATE_TOKEN environment variable is required');
  console.error('Set it in your Vercel project settings: Settings → Environment Variables');
  process.exit(1);
}

// Build payload
const payload = {
  serviceKey: SERVICE_CONFIG.serviceKey,
  serviceName: SERVICE_CONFIG.serviceName,
  url: SERVICE_URL,
  description: SERVICE_CONFIG.description,
  transport: SERVICE_CONFIG.transport,
  authentication: SERVICE_CONFIG.authentication,
  tools: SERVICE_CONFIG.tools
};

console.log('📝 Updating MCP Registry for StoryCrafter');
console.log('━'.repeat(50));
console.log(`Service: ${SERVICE_CONFIG.serviceName}`);
console.log(`URL: ${SERVICE_URL}`);
console.log(`Tools: ${SERVICE_CONFIG.tools.length}`);
console.log('  - generate_backlog');
console.log('  - get_backlog_summary');
console.log('');

// Make POST request to registry update API
const url = new URL('/api/registry/update', REGISTRY_API_URL);
const postData = JSON.stringify(payload);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${REGISTRY_UPDATE_TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200 && response.success) {
        console.log('✅ Registry updated successfully!');
        console.log('');
        console.log(`📊 Tools registered: ${response.toolsCount}`);
        console.log(`🕐 Timestamp: ${response.timestamp}`);
        if (response.commitUrl) {
          console.log(`🔗 Commit: ${response.commitUrl}`);
        }
        console.log('');
        console.log('🎉 StoryCrafter is now discoverable in the MCP registry!');
      } else {
        console.error('❌ Registry update failed');
        console.error(`Status: ${res.statusCode}`);
        console.error(`Error: ${response.error || 'Unknown error'}`);
        console.error(`Message: ${response.message || 'No message'}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
