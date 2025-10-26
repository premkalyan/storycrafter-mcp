# StoryCrafter MCP Tests

Test suite for verifying VISHKAR format transformation and MCP tool execution.

## Test Files

### Test Data (VISHKAR Format)
- `test_1_generate_epics.json` - Generate 5-8 high-level epics from project context
- `test_2_generate_stories.json` - Generate detailed stories for an epic (requires epic from test 1)
- `test_3_regenerate_epic.json` - Regenerate an epic based on user feedback
- `test_4_regenerate_story.json` - Regenerate a story based on user feedback

### Shared Data
- `vishkar_format_test_data.json` - Sample VISHKAR project_context format

## Running Tests

### Prerequisites
```bash
cd /Users/premkalyan/code/mcp/storycrafter-mcp
npm install  # Ensure dependencies installed
```

### Run Individual Test

**Local Development Server:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run test
node tests/run-tests.js 1 --local
```

**Production (Vercel):**
```bash
node tests/run-tests.js 1 --prod
```

### Run All Tests
```bash
# Against local
node tests/run-tests.js all --local

# Against production
node tests/run-tests.js all --prod
```

## Test Flow

### Test 1: Generate Epics (⚡ Fast - 15-20s)

**Input (VISHKAR Format):**
```json
{
  "project_context": {
    "project_summary": {...},
    "final_decisions": {
      "product": {...},
      "technical": {...},
      "project": {...}
    }
  }
}
```

**Transformation:**
MCP transforms to:
```json
{
  "consensus_messages": [
    {"role": "system", "content": "Project: ..."},
    {"role": "alex", "content": "Product Manager..."},
    {"role": "blake", "content": "Technical Architect..."},
    {"role": "casey", "content": "Project Manager..."}
  ],
  "project_metadata": {...}
}
```

**Output:**
```json
{
  "success": true,
  "epics": [
    {
      "id": "EPIC-1",
      "title": "User Authentication & Account Management",
      "description": "...",
      "priority": "High",
      "category": "MVP",
      "story_count_target": 4
    }
  ],
  "metadata": {
    "total_epics": 8,
    "generated_at": "2025-10-26T..."
  }
}
```

### Test 2: Generate Stories (🔄 Detailed - 3-5min)

Takes epics from Test 1 and generates detailed user stories with acceptance criteria, technical tasks, and estimates.

### Test 3: Regenerate Epic (🔄 20-30s)

Regenerates a single epic incorporating user feedback:
```json
{
  "epic": {...},
  "user_feedback": "Focus on OAuth instead of email/password"
}
```

### Test 4: Regenerate Story (🔄 1-2min)

Regenerates a single story incorporating user feedback:
```json
{
  "epic": {...},
  "story": {...},
  "user_feedback": "Add email verification requirement"
}
```

## Test Output

The test runner shows:
1. **📥 INPUT** - VISHKAR format data sent to MCP
2. **🔄 EXPECTED TRANSFORMATION** - How data should be transformed
3. **⚡ CALLING MCP** - Making the request
4. **📤 OUTPUT** - Response from service with generated artifacts
5. **📋 Full Response** - Complete JSON response

## Debugging

### Check Transformation
The test runner displays:
- Original VISHKAR format input
- Expected transformation to service format
- Actual response from service

### Check Service Logs
If tests fail, check the StoryCrafter service logs:
```bash
# For the Python service
vercel logs --follow --project=storycrafter-service
```

### Common Issues

**1. "Field required" Error (422)**
- Service didn't receive consensus_messages
- Check that transformation is happening in MCP

**2. Connection Refused**
- Local: Make sure `npm run dev` is running
- Prod: Check that storycrafter-mcp.vercel.app is deployed

**3. Timeout (10 minutes)**
- Story generation can take 3-5 minutes
- Check service logs for actual errors

## Example Session

```bash
$ node tests/run-tests.js 1 --local

████████████████████████████████████████████████████████████████████████████████
  StoryCrafter MCP Test Runner
████████████████████████████████████████████████████████████████████████████████

Environment: Local Development
MCP URL: http://localhost:3000/api/mcp

================================================================================
TEST: Test 1: Generate Epics
================================================================================

Description: Generate 5-8 high-level epics from VISHKAR project context

MCP Endpoint: http://localhost:3000/api/mcp
Tool: generate_epics

📥 INPUT (VISHKAR Format):
────────────────────────────────────────────────────────────────────────────────

project_context.project_summary:
{
  "project_name": "Task Manager App",
  "project_description": "A simple task management application...",
  ...
}

project_context.final_decisions:
{
  "product": {...},
  "technical": {...},
  "project": {...}
}

🔄 EXPECTED TRANSFORMATION (to Service Format):
────────────────────────────────────────────────────────────────────────────────
{
  "consensus_messages": [
    {"role": "system", "content": "..."},
    {"role": "alex", "content": "..."},
    {"role": "blake", "content": "..."},
    {"role": "casey", "content": "..."}
  ],
  "project_metadata": {...}
}

⚡ CALLING MCP...
────────────────────────────────────────────────────────────────────────────────

✅ SUCCESS (18.3s)
────────────────────────────────────────────────────────────────────────────────

📤 OUTPUT:

✓ success: true
✓ epics generated: 8
  1. EPIC-1: User Authentication & Account Management
  2. EPIC-2: Task Management Core Functionality
  3. EPIC-3: Dashboard & Task Overview
  ...

Metadata:
{
  "total_epics": 8,
  "generated_at": "2025-10-26T15:30:00Z"
}

████████████████████████████████████████████████████████████████████████████████
  TEST SUMMARY
████████████████████████████████████████████████████████████████████████████████

✅ test_1_generate_epics.json (18.3s)

────────────────────────────────────────────────────────────────────────────────
Total: 1 | Passed: 1 | Failed: 0
```

## Integration with VISHKAR

These tests demonstrate exactly how VISHKAR should call the MCP:

1. **Format**: Use VISHKAR's `project_context` format
2. **Endpoint**: POST to `/api/mcp` with MCP protocol
3. **Transformation**: MCP handles transformation automatically
4. **Response**: Receive artifacts in standardized format

No need for VISHKAR to know about consensus_messages format - the MCP adapter handles it!
