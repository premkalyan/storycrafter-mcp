export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-black">
      <h1 className="text-4xl font-bold mb-4 text-black">StoryCrafter MCP Server</h1>
      <p className="mb-4 text-gray-700">Version 1.0.0 - AI-Powered Backlog Generator for VISHKAR Project Context</p>
      <p className="mb-4 text-gray-600">Two-phase workflow: Fast epic generation (Claude Sonnet 4.5) + Detailed story generation (GPT-5) with iterative refinement</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Available Endpoints</h2>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li><code className="bg-gray-100 px-2 py-1 rounded text-black">/api/mcp</code> - Main MCP endpoint (GET for health, POST for tools)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Available Tools (4 total)</h2>
        <p className="mb-4 text-gray-600">Two-phase workflow: Fast epics first, then detailed stories. Iterative refinement supported.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Phase 1: Epic Generation ⚡</h3>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li>
            <strong className="text-black">generate_epics</strong> - ⚡ FAST (15-20 seconds) epic generation
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Generates 5-8 high-level epics from VISHKAR project context</li>
              <li>Uses Claude Sonnet 4.5 for fast, intelligent epic structure</li>
              <li>Returns titles, descriptions, priorities, categories, acceptance criteria</li>
              <li>~$0.15 per generation, 15-20 seconds</li>
              <li><strong>Use this FIRST</strong> to get quick epic overview before detailed stories</li>
            </ul>
          </li>
          <li>
            <strong className="text-black">regenerate_epic</strong> - 🔄 Iterative epic refinement (20-30 seconds)
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Regenerate single epic based on user feedback</li>
              <li>Uses Claude Sonnet 4.5 with feedback incorporation</li>
              <li>Returns updated epic with same structure</li>
              <li>Use when user wants to improve specific epic</li>
            </ul>
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Phase 2: Story Generation 🔄</h3>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li>
            <strong className="text-black">generate_stories</strong> - 🔄 DETAILED (3-5 minutes) story generation
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Generates comprehensive user stories for epics</li>
              <li>Uses GPT-5 (128K output) for detailed story expansion</li>
              <li>Includes Given/When/Then acceptance criteria, technical tasks, story points (Fibonacci), estimated hours</li>
              <li>~$0.29 per generation, 3-5 minutes</li>
              <li><strong>Call AFTER generate_epics</strong> to create full backlog</li>
            </ul>
          </li>
          <li>
            <strong className="text-black">regenerate_story</strong> - 🔄 Iterative story refinement (1-2 minutes)
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Regenerate single story based on user feedback</li>
              <li>Uses GPT-5 with feedback incorporation</li>
              <li>Returns updated story with better criteria and tasks</li>
              <li>Use when user wants to improve specific story</li>
            </ul>
          </li>
        </ul>

        <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded">
          <h4 className="font-semibold text-black mb-2">Recommended Workflow:</h4>
          <ol className="list-decimal pl-6 space-y-1 text-black">
            <li>Call <strong>generate_epics</strong> with VISHKAR project context (15-20s)</li>
            <li>Review epics, use <strong>regenerate_epic</strong> for any that need refinement</li>
            <li>Call <strong>generate_stories</strong> with approved epics (3-5min)</li>
            <li>Use <strong>regenerate_story</strong> for any stories needing improvement</li>
          </ol>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Usage</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Health Check</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black">
{`GET /api/mcp

Response:
{
  "name": "StoryCrafter MCP",
  "version": "1.0.0",
  "tools": ["generate_epics", "generate_stories", "regenerate_epic", "regenerate_story"],
  "service_url": "https://storycrafter-service.vercel.app",
  "status": "healthy"
}`}
        </pre>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Example: Generate Epics</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black text-sm">
{`POST /api/mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "tool": "generate_epics",
    "arguments": {
      "project_context": {
        "project_summary": {
          "name": "TaskMaster",
          "description": "Task Management App with offline support",
          "target_users": "Remote teams needing offline task management"
        },
        "final_decisions": {
          "technical_stack": "React Native, IndexedDB, Service Workers",
          "timeline": "4 weeks",
          "team_size": "2 developers",
          "priorities": ["Offline support", "Task CRUD", "Sync"]
        }
      }
    }
  }
}`}
        </pre>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Example: Generate Stories</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black text-sm">
{`POST /api/mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "tool": "generate_stories",
    "arguments": {
      "project_context": { /* same as above */ },
      "epics": [
        {
          "id": "EPIC-1",
          "title": "User Authentication & Profile",
          "description": "Secure user authentication system",
          "priority": "high",
          "category": "security"
        }
        /* ... more epics from generate_epics output */
      ]
    }
  }
}`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Example Response</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black text-sm">
{`{
  "content": [
    {
      "type": "text",
      "text": {
        "success": true,
        "backlog": {
          "project": {
            "name": "TaskMaster",
            "description": "Task Management App with offline support"
          },
          "epics": [
            {
              "id": "EPIC-1",
              "title": "User Authentication & Profile Management",
              "description": "Core user authentication with secure profile management",
              "stories": [
                {
                  "id": "STORY-1",
                  "title": "User Registration with Email Verification",
                  "description": "As a new user, I want to register...",
                  "acceptance_criteria": [...],
                  "technical_tasks": [...],
                  "story_points": 5,
                  "estimated_hours": 12
                }
              ]
            }
          ]
        },
        "summary": {
          "total_epics": 8,
          "total_stories": 36,
          "total_estimated_hours": 458,
          "generated_at": "2025-10-25T15:30:00Z"
        }
      }
    }
  ]
}`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">VISHKAR Integration</h2>
        <p className="mb-4 text-black">StoryCrafter works with VISHKAR project context (project_summary + final_decisions):</p>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h4 className="font-semibold text-black mb-2">VISHKAR Provides:</h4>
          <ul className="list-disc pl-6 space-y-1 text-black">
            <li><strong>project_summary</strong> - Project name, description, target users, goals</li>
            <li><strong>final_decisions</strong> - Technical stack, timeline, team size, priorities, constraints</li>
            <li><strong>questions_and_answers</strong> (optional) - Clarifications from consensus discussion</li>
          </ul>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h4 className="font-semibold text-black mb-2">StoryCrafter Generates:</h4>
          <ol className="list-decimal pl-6 space-y-1 text-black">
            <li><strong>generate_epics</strong> - 5-8 high-level epics (15-20s)</li>
            <li><strong>User reviews epics</strong> - Feedback loop with regenerate_epic</li>
            <li><strong>generate_stories</strong> - Comprehensive user stories for epics (3-5min)</li>
            <li><strong>User reviews stories</strong> - Feedback loop with regenerate_story</li>
            <li><strong>Final Output</strong> - Complete, validated backlog ready for JIRA</li>
          </ol>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Architecture</h2>
        <div className="bg-gray-100 p-4 rounded text-black">
          <pre className="text-sm">
{`┌──────────────────┐
│  Vishkar Agent   │
│  (User Request)  │
└────────┬─────────┘
         │ MCP Protocol
┌────────▼─────────────┐
│ StoryCrafter MCP     │ (Next.js - This Service)
│ /api/mcp             │
└────────┬─────────────┘
         │ HTTP
┌────────▼─────────────┐
│ StoryCrafter Service │ (Python/FastAPI)
│ - Claude Sonnet 4.5  │ (Epic Structure)
│ - GPT-5              │ (Story Details)
└──────────────────────┘`}
          </pre>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Costs & Performance</h2>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <h4 className="font-semibold text-black mb-2">Per Backlog Generation:</h4>
          <ul className="list-disc pl-6 space-y-1 text-black">
            <li>Claude Sonnet 4.5: ~$0.15 (epic structure)</li>
            <li>GPT-5: ~$0.29 (story expansion)</li>
            <li><strong>Total: ~$0.44</strong></li>
            <li>Duration: 30-60 seconds</li>
          </ul>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-700">
        <p>StoryCrafter MCP Server v1.0.0 - Part of the Prometheus MCP Ecosystem</p>
        <p className="mt-2">
          <a href="https://storycrafter-service.vercel.app" className="text-blue-600 hover:underline">Backend Service</a>
          {" | "}
          <a href="https://github.com/premkalyan/storycrafter-mcp" className="text-blue-600 hover:underline">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
