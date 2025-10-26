# AI Provider Configuration - Complete Integration Guide

## Overview

This document explains how **VISHKAR** should save AI provider configurations to **Project Registry** and how **StoryCrafter MCP** extracts and uses them.

## Architecture

```
VISHKAR Settings
    │
    ├─> Saves config to Project Registry
    │   POST /api/projects/register
    │   {
    │     projectId: "proj_123",
    │     projectName: "My Project",
    │     configs: {
    │       aiProvider: { ... },  // ← Your AI config here
    │       jira: { ... },
    │       github: { ... }
    │     }
    │   }
    │
    ├─> Receives prometheusApiKey (Bearer token)
    │   Response: { apiKey: "prom_abc123xyz" }
    │
    └─> Passes Bearer token to MCPs
        Authorization: Bearer prom_abc123xyz

MCP (StoryCrafter)
    │
    ├─> Extracts Bearer token from header
    │
    ├─> Fetches full config from Project Registry
    │   GET /api/projects/{bearerToken}
    │   Returns: { projectId, projectName, configs: {...} }
    │
    ├─> Extracts AI provider for specific task
    │   getAIProviderForTask(config, 'epicGeneration')
    │   Returns: { provider, model, apiKey }
    │
    └─> Uses credentials to call AI service
        axios.post(STORYCRAFTER_SERVICE, {
          consensus_messages: [...],
          ai_provider: { provider, model, api_key }
        })
```

## 1. VISHKAR: Save Configuration to Project Registry

### Request Format

```typescript
POST https://project-registry-henna.vercel.app/api/projects/register

{
  "projectId": "task-manager-app",
  "projectName": "Task Manager App",
  "configs": {
    "aiProvider": {
      // API Keys (auto-encrypted by Project Registry)
      "anthropicApiKey": "sk-ant-api03-...",
      "openaiApiKey": "sk-proj-...",
      "openrouterApiKey": "sk-or-v1-...",

      // Task-specific preferences
      "preferences": {
        "epicGeneration": {
          "provider": "anthropic",
          "model": "claude-sonnet-4.5"
        },
        "storyGeneration": {
          "provider": "openai",
          "model": "gpt-4o"
        },
        "agentConversations": {
          "provider": "anthropic",
          "model": "claude-sonnet-4"
        },
        "projectDescription": {
          "provider": "openrouter",
          "model": "anthropic/claude-3.5-sonnet"
        },
        "contextLoading": {
          "provider": "anthropic",
          "model": "claude-sonnet-4"
        }
      }
    },
    "jira": {
      "jiraUrl": "https://your-domain.atlassian.net",
      "jiraEmail": "user@example.com",
      "jiraApiToken": "ATATT3xFfGF0..."
    },
    "github": {
      "githubToken": "ghp_...",
      "githubRepo": "owner/repo"
    }
  }
}
```

### Response

```json
{
  "success": true,
  "apiKey": "prom_abc123xyz456",
  "message": "Project registered successfully"
}
```

**Important**: Save this `apiKey` (prometheusApiKey) - this is the Bearer token VISHKAR will use for all MCP calls.

---

## 2. Project Registry: Storage & Encryption

### How Project Registry Handles Data

**Project Registry is a GENERIC key-value store:**
- Accepts ANY JSON structure in the `configs` field
- No schema validation
- No knowledge of aiProvider, jira, or other config structures

**Automatic Encryption:**
Project Registry automatically encrypts fields that match these patterns:
- `*ApiKey` (e.g., `anthropicApiKey`, `openaiApiKey`)
- `*Token` (e.g., `githubToken`, `jiraApiToken`)
- `*Secret`
- `*Password`

**Storage Example:**
```json
{
  "projectId": "task-manager-app",
  "projectName": "Task Manager App",
  "configs": {
    "aiProvider": {
      "anthropicApiKey": "ENCRYPTED:aHj8k3m...",  // ← Encrypted
      "openaiApiKey": "ENCRYPTED:9sKp2n...",      // ← Encrypted
      "preferences": {
        "epicGeneration": {
          "provider": "anthropic",  // ← Not encrypted (doesn't match pattern)
          "model": "claude-sonnet-4.5"
        }
      }
    }
  }
}
```

**Automatic Decryption:**
When MCPs fetch config using `GET /api/projects/{apiKey}`, Project Registry:
1. Looks up the project by API key
2. Decrypts all encrypted fields
3. Returns full config with plain-text credentials

---

## 3. StoryCrafter MCP: Extract & Use Configuration

### Step 1: Extract Bearer Token

```typescript
// In POST /api/mcp handler
const authHeader = request.headers.get('Authorization') || '';
const bearerToken = authHeader.replace('Bearer ', '').trim();

if (!bearerToken) {
  return NextResponse.json(
    { error: { message: 'Missing Authorization header' } },
    { status: 401 }
  );
}
```

### Step 2: Fetch Project Config

```typescript
async function getProjectConfig(bearerToken: string): Promise<ProjectConfig> {
  const response = await axios.get(
    `https://project-registry-henna.vercel.app/api/projects/${bearerToken}`,
    { timeout: 10000 }
  );

  if (!response.data) {
    throw new Error('No configuration found for API key');
  }

  return response.data;
  // Returns:
  // {
  //   projectId: "task-manager-app",
  //   projectName: "Task Manager App",
  //   configs: {
  //     aiProvider: { anthropicApiKey: "sk-ant-...", preferences: {...} }
  //   }
  // }
}
```

### Step 3: Extract AI Provider for Specific Task

```typescript
function getAIProviderForTask(
  config: ProjectConfig,
  task: 'epicGeneration' | 'storyGeneration' | 'agentConversations' | 'projectDescription' | 'contextLoading'
): { provider: string; model: string; apiKey: string } {

  const aiConfig = config.configs.aiProvider;

  if (!aiConfig) {
    throw new Error('AI provider configuration not found in project config');
  }

  // Get preference for this task (with fallback)
  const preference = aiConfig.preferences[task] || {
    provider: 'anthropic',
    model: 'claude-sonnet-4.5'
  };

  // Get API key for the provider
  let apiKey: string | undefined;
  switch (preference.provider) {
    case 'anthropic':
      apiKey = aiConfig.anthropicApiKey;
      break;
    case 'openai':
      apiKey = aiConfig.openaiApiKey;
      break;
    case 'openrouter':
      apiKey = aiConfig.openrouterApiKey;
      break;
  }

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${preference.provider}`);
  }

  return {
    provider: preference.provider,
    model: preference.model,
    apiKey  // ← Decrypted by Project Registry
  };
}
```

### Step 4: Use in Handler

```typescript
async function handleGenerateEpics(args: Record<string, any>, bearerToken: string) {
  // Fetch config
  const projectConfig = await getProjectConfig(bearerToken);

  // Extract AI provider for epic generation
  const aiConfig = getAIProviderForTask(projectConfig, 'epicGeneration');
  // Returns: { provider: 'anthropic', model: 'claude-sonnet-4.5', apiKey: 'sk-ant-...' }

  console.log(`Using ${aiConfig.provider} ${aiConfig.model} for project ${projectConfig.projectId}`);

  // Transform VISHKAR format to service format
  const { consensus_messages, project_metadata } = transformProjectContext(args.project_context);

  // Call StoryCrafter service with AI config
  const response = await axios.post(
    `${STORYCRAFTER_SERVICE_URL}/generate-epics`,
    {
      consensus_messages,
      project_metadata,
      ai_provider: {
        provider: aiConfig.provider,
        model: aiConfig.model,
        api_key: aiConfig.apiKey
      }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
  );

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        epics: response.data.epics,
        metadata: {
          ...response.data.metadata,
          ai_provider_used: `${aiConfig.provider}/${aiConfig.model}`
        }
      }, null, 2)
    }]
  };
}
```

---

## 4. VISHKAR: Call MCP with Bearer Token

### Example: Generate Epics

```typescript
// In VISHKAR code
const prometheusApiKey = 'prom_abc123xyz456';  // From registration response

const response = await fetch('https://storycrafter-mcp.vercel.app/api/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${prometheusApiKey}`  // ← Bearer token here
  },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      tool: 'generate_epics',
      arguments: {
        project_context: {
          project_summary: {
            project_name: 'Task Manager App',
            project_description: '...',
            target_users: 'College students',
            platform: 'Web (React + Node.js)',
            timeline: '8 weeks',
            team_size: '2 developers'
          },
          final_decisions: {
            product: {
              mvp_features: ['...'],
              target_users: 'College students'
            },
            technical: {
              frontend: 'React with TypeScript',
              backend: 'Node.js with Express',
              authentication: 'JWT-based'
            },
            project: {
              timeline: '8 weeks',
              team: '2 developers'
            }
          }
        }
      }
    }
  })
});

const result = await response.json();
// {
//   content: [{
//     type: 'text',
//     text: JSON.stringify({
//       success: true,
//       epics: [...],
//       metadata: {
//         total_epics: 8,
//         generated_at: '2025-10-26T...',
//         ai_provider_used: 'anthropic/claude-sonnet-4.5'
//       }
//     })
//   }]
// }
```

---

## 5. Task-Specific AI Provider Mapping

StoryCrafter MCP supports different AI providers for different task types:

| Task Type | MCP Tool | Typical Provider | Typical Duration |
|-----------|----------|------------------|------------------|
| **epicGeneration** | `generate_epics`, `regenerate_epic` | Claude Sonnet 4.5 | ⚡ 15-20s |
| **storyGeneration** | `generate_stories`, `regenerate_story` | GPT-4o | 🔄 3-5min |

You can configure any provider/model combination per task in the `preferences` object.

---

## 6. Error Handling

### Missing Bearer Token
```json
{
  "error": {
    "code": -32600,
    "message": "Missing Authorization header. Please provide Bearer token (Prometheus API Key)."
  }
}
```
**Status**: 401 Unauthorized

### Invalid Bearer Token
```json
{
  "error": {
    "code": -32602,
    "message": "Project not found for this API key. Please register the project in VISHKAR settings."
  }
}
```
**Status**: 200 (MCP protocol error response)

### Missing AI Provider Config
```json
{
  "error": {
    "code": -32602,
    "message": "AI provider configuration not found in project config"
  }
}
```
**Status**: 200 (MCP protocol error response)

### Missing API Key for Provider
```json
{
  "error": {
    "code": -32602,
    "message": "API key not found for provider: anthropic"
  }
}
```
**Status**: 200 (MCP protocol error response)

---

## 7. Complete Example: Full Flow

### Step 1: VISHKAR Registers Project
```bash
curl -X POST https://project-registry-henna.vercel.app/api/projects/register \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "task-manager-app",
    "projectName": "Task Manager App",
    "configs": {
      "aiProvider": {
        "anthropicApiKey": "sk-ant-api03-xxx",
        "openaiApiKey": "sk-proj-xxx",
        "preferences": {
          "epicGeneration": { "provider": "anthropic", "model": "claude-sonnet-4.5" },
          "storyGeneration": { "provider": "openai", "model": "gpt-4o" }
        }
      }
    }
  }'

# Response: { "apiKey": "prom_abc123xyz" }
```

### Step 2: VISHKAR Calls StoryCrafter MCP
```bash
curl -X POST https://storycrafter-mcp.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer prom_abc123xyz" \
  -d '{
    "method": "tools/call",
    "params": {
      "tool": "generate_epics",
      "arguments": {
        "project_context": {
          "project_summary": {...},
          "final_decisions": {...}
        }
      }
    }
  }'
```

### Step 3: StoryCrafter MCP Processes
1. Extracts Bearer token: `prom_abc123xyz`
2. Fetches config: `GET /api/projects/prom_abc123xyz`
3. Extracts AI provider for `epicGeneration`:
   - provider: `anthropic`
   - model: `claude-sonnet-4.5`
   - apiKey: `sk-ant-api03-xxx` (decrypted)
4. Transforms VISHKAR format → Service format
5. Calls StoryCrafter Service with AI credentials
6. Returns generated epics with metadata

### Step 4: Response to VISHKAR
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\":true,\"epics\":[...],\"metadata\":{\"ai_provider_used\":\"anthropic/claude-sonnet-4.5\"}}"
  }]
}
```

---

## 8. Benefits of This Architecture

1. **Single Source of Truth**: All config in Project Registry
2. **Automatic Encryption**: Sensitive fields encrypted at rest
3. **Flexible Provider Choice**: Different providers for different tasks
4. **No Config in MCP Code**: MCPs are stateless, config-agnostic
5. **Easy Updates**: VISHKAR can update config without redeploying MCPs
6. **Security**: API keys never exposed in MCP code or logs

---

## 9. Testing

### Test with StoryCrafter MCP Test Suite

```bash
cd /Users/premkalyan/code/mcp/storycrafter-mcp

# Run against production
node tests/run-tests.js 1 --prod

# Run all tests
node tests/run-tests.js all --prod
```

Test files demonstrate exact format VISHKAR should use:
- `tests/test_1_generate_epics.json` - Epic generation
- `tests/test_2_generate_stories.json` - Story generation
- `tests/test_3_regenerate_epic.json` - Epic regeneration
- `tests/test_4_regenerate_story.json` - Story regeneration

---

## 10. Summary

**VISHKAR's Responsibilities:**
1. Collect AI provider preferences and API keys from user
2. Save to Project Registry in `configs.aiProvider` format
3. Store returned `prometheusApiKey`
4. Pass `prometheusApiKey` as Bearer token to all MCP calls

**Project Registry's Responsibilities:**
1. Store arbitrary JSON configs (generic key-value store)
2. Auto-encrypt fields ending in "ApiKey", "Token", "Secret", "Password"
3. Return full config with decrypted values when fetched by API key

**StoryCrafter MCP's Responsibilities:**
1. Extract Bearer token from Authorization header
2. Fetch full config from Project Registry
3. Extract appropriate AI provider/model/key for task type
4. Transform VISHKAR format → Service format
5. Call StoryCrafter Service with AI credentials
6. Return results to VISHKAR

**Result:** Clean separation of concerns, secure credential handling, flexible configuration.
