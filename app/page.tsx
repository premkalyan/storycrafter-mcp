export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-black">
      <h1 className="text-4xl font-bold mb-4 text-black">StoryCrafter MCP Server</h1>
      <p className="mb-4 text-gray-700">Version 1.0.0 - AI-Powered Backlog Generator for VISHKAR Consensus</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Available Endpoints</h2>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li><code className="bg-gray-100 px-2 py-1 rounded text-black">/api/mcp</code> - Main MCP endpoint (GET for health, POST for tools)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mt-8 mb-4 text-black">Available Tools (2 total)</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Backlog Generation</h3>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li>
            <strong className="text-black">generate_backlog</strong> - Generate complete project backlog from VISHKAR 3-agent consensus discussion
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Generates 6-8 epics with 20-40 detailed user stories</li>
              <li>Includes acceptance criteria, technical tasks, story points, and time estimates</li>
              <li>Uses Claude Sonnet 4.5 for epic structure and GPT-5 for story details</li>
              <li>Takes 30-60 seconds per backlog (~$0.44 cost)</li>
            </ul>
          </li>
          <li>
            <strong className="text-black">get_backlog_summary</strong> - Get summary statistics from a generated backlog
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Extracts total epics, stories, and estimated hours</li>
              <li>Provides per-epic breakdown</li>
              <li>Instant processing, no AI costs</li>
            </ul>
          </li>
        </ul>
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
  "tools": ["generate_backlog", "get_backlog_summary"],
  "service_url": "https://storycrafter-service.vercel.app",
  "status": "healthy"
}`}
        </pre>

        <h3 className="text-xl font-semibold mt-6 mb-3 text-black">Generate Backlog</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black text-sm">
{`POST /api/mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "tool": "generate_backlog",
    "arguments": {
      "consensus_messages": [
        {
          "role": "system",
          "content": "Project: Task Management App with offline support"
        },
        {
          "role": "alex",
          "content": "As a product manager, I want users to create tasks, set priorities, and track completion offline"
        },
        {
          "role": "blake",
          "content": "As technical architect, I recommend IndexedDB for offline storage and service workers for sync"
        },
        {
          "role": "casey",
          "content": "As project manager, we have 4 weeks and 2 developers. Focus on core features first"
        }
      ],
      "project_metadata": {
        "project_name": "TaskMaster",
        "timeline": "4 weeks",
        "team_size": "2 developers"
      },
      "use_full_context": true
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
        <p className="mb-4 text-black">StoryCrafter is designed to work seamlessly with the VISHKAR 3-agent consensus system:</p>
        <ol className="list-decimal pl-6 space-y-2 text-black">
          <li><strong className="text-black">System</strong> - Provides project context and requirements</li>
          <li><strong className="text-black">Alex (Product Manager)</strong> - Defines user needs and product vision</li>
          <li><strong className="text-black">Blake (Technical Architect)</strong> - Contributes technical approach and architecture decisions</li>
          <li><strong className="text-black">Casey (Project Manager)</strong> - Adds constraints, timeline, and resource considerations</li>
          <li><strong className="text-black">StoryCrafter</strong> - Synthesizes all inputs into a comprehensive, actionable backlog</li>
        </ol>
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
