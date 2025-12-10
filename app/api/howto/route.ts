/**
 * Story Crafter MCP - How To Guide Endpoint
 * Returns JSON documentation about tools, workflow, and usage
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const howto = {
    service: "Story Crafter MCP",
    version: "1.0.0",
    endpoint: "https://storycrafter-mcp.vercel.app/api/mcp",

    authentication: {
      method: "X-API-Key Header",
      header: "X-API-Key: {api_key}",
      how_to_get_key: [
        "1. Go to Project Registry: https://project-registry-henna.vercel.app/dashboard",
        "2. Register your project with AI provider config (OpenAI or Anthropic API key)",
        "3. Copy your API key (pk_xxx...)",
        "4. Use in X-API-Key header when calling Story Crafter"
      ],
      registration_endpoint: "POST https://project-registry-henna.vercel.app/api/projects/register",
      registration_body: {
        projectId: "your-project-id",
        projectName: "Your Project Name",
        configs: {
          ai_provider: {
            provider: "openai",
            api_key: "sk-your-openai-key"
          }
        }
      },
      supported_ai_providers: ["openai", "anthropic"]
    },

    overview: {
      description: "AI-powered backlog generator that transforms VISHKAR consensus into structured Epics and User Stories",
      purpose: "Takes project decisions from VISHKAR discussions and generates well-structured Agile artifacts",
      key_features: [
        "Generate 5-8 high-level Epics from project context",
        "Create detailed User Stories with acceptance criteria",
        "Regenerate individual epics or stories based on feedback",
        "Auto-estimates story points",
        "Creates technical tasks for each story"
      ]
    },

    workflow: {
      description: "Recommended workflow for generating a complete backlog",
      steps: [
        {
          step: 1,
          tool: "generate_epics",
          description: "Start here - Generate high-level epics from VISHKAR context",
          timing: "15-20 seconds",
          output: "5-8 Epics with titles, descriptions, acceptance criteria"
        },
        {
          step: 2,
          action: "Review epics with stakeholders",
          description: "If any epic needs improvement, use regenerate_epic"
        },
        {
          step: 3,
          tool: "generate_stories",
          description: "Generate detailed stories for approved epics",
          timing: "3-5 minutes",
          output: "Comprehensive stories with AC, technical tasks, estimates"
        },
        {
          step: 4,
          action: "Review stories",
          description: "If any story needs improvement, use regenerate_story"
        },
        {
          step: 5,
          action: "Import to Jira",
          description: "Use JIRA MCP to create the epics and stories in Jira"
        }
      ]
    },

    tools: {
      backlog_generation: [
        {
          name: "generate_epics",
          description: "Generate 5-8 high-level Epics from VISHKAR project context",
          timing: "15-20 seconds",
          parameters: {
            vishkar_context: {
              type: "object",
              required: true,
              description: "Complete VISHKAR project context",
              structure: {
                project_summary: "Summary of the project goals and scope",
                final_decisions: "Array of decisions made during VISHKAR consensus",
                discussion_data: "Optional: Full discussion context"
              }
            }
          },
          returns: {
            epics: "Array of epic objects with id, title, description, acceptance_criteria"
          }
        },
        {
          name: "generate_stories",
          description: "Generate detailed User Stories for specific epics",
          timing: "3-5 minutes",
          parameters: {
            vishkar_context: {
              type: "object",
              required: true,
              description: "Original VISHKAR project context"
            },
            epics: {
              type: "array",
              required: true,
              description: "Array of epic objects from generate_epics output"
            }
          },
          returns: {
            stories: "Array of story objects with full details",
            story_structure: {
              id: "Unique story identifier",
              epic_id: "Parent epic ID",
              title: "User story title (As a... I want... So that...)",
              description: "Detailed description",
              acceptance_criteria: "Array of testable criteria",
              technical_tasks: "Array of implementation tasks",
              story_points: "Estimated effort (1, 2, 3, 5, 8, 13)",
              priority: "High, Medium, Low"
            }
          }
        }
      ],
      refinement: [
        {
          name: "regenerate_epic",
          description: "Regenerate a single epic based on user feedback",
          timing: "20-30 seconds",
          parameters: {
            vishkar_context: "Original VISHKAR context",
            epic: {
              type: "object",
              required: true,
              description: "The epic to regenerate (must include id, title, description)"
            },
            feedback: {
              type: "string",
              required: true,
              description: "User comments on what needs to be changed or improved"
            }
          },
          use_case: "When stakeholder feedback indicates an epic needs refinement"
        },
        {
          name: "regenerate_story",
          description: "Regenerate a single user story based on feedback",
          timing: "1-2 minutes",
          parameters: {
            vishkar_context: "Original VISHKAR context",
            epic: "The parent epic object (for context)",
            story: {
              type: "object",
              required: true,
              description: "The story to regenerate"
            },
            feedback: {
              type: "string",
              required: true,
              description: "User comments on what needs improvement"
            }
          },
          use_case: "When a story's acceptance criteria or tasks need refinement"
        }
      ]
    },

    vishkar_context_format: {
      description: "Structure of VISHKAR context expected by Story Crafter",
      example: {
        project_summary: "Building a customer feedback management system that allows users to submit, track, and analyze product feedback",
        final_decisions: [
          {
            topic: "Authentication",
            decision: "Use OAuth 2.0 with Google and GitHub providers",
            rationale: "Simplifies user onboarding and leverages existing accounts"
          },
          {
            topic: "Database",
            decision: "PostgreSQL with Prisma ORM",
            rationale: "Strong relational support for feedback relationships"
          }
        ],
        discussion_data: {
          participants: ["Product Owner", "Tech Lead", "UX Designer"],
          key_requirements: [
            "Real-time feedback submission",
            "Dashboard for feedback analytics",
            "Export to CSV/PDF"
          ]
        }
      }
    },

    request_format: {
      protocol: "JSON-RPC 2.0",
      example_generate_epics: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "generate_epics",
          arguments: {
            vishkar_context: {
              project_summary: "Customer feedback management system",
              final_decisions: [
                { topic: "Auth", decision: "OAuth 2.0" }
              ]
            }
          }
        }
      },
      example_regenerate_epic: {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "regenerate_epic",
          arguments: {
            vishkar_context: { /* ... */ },
            epic: {
              id: "epic-1",
              title: "User Authentication",
              description: "..."
            },
            feedback: "Please add support for SSO integration and make acceptance criteria more specific"
          }
        }
      }
    },

    tips: [
      "Always start with generate_epics before generate_stories",
      "Review epics with stakeholders before generating detailed stories",
      "Use regenerate_epic/regenerate_story for iterative refinement",
      "The AI provider (OpenAI/Anthropic) is fetched from your Project Registry config",
      "Story points follow Fibonacci sequence: 1, 2, 3, 5, 8, 13",
      "Each story includes technical tasks that can be used as subtasks in Jira"
    ],

    integration_with_jira: {
      description: "After generating stories, use JIRA MCP to create them in Jira",
      workflow: [
        "1. Generate epics and stories with Story Crafter",
        "2. Review and approve the backlog",
        "3. Use JIRA MCP create_issue to create each epic",
        "4. Use JIRA MCP create_issue with parentKey to create stories under epics",
        "5. Story's acceptance_criteria maps to Jira's acceptance criteria field",
        "6. Story's technical_tasks can become subtasks"
      ],
      jira_field_mapping: {
        "epic.title": "summary",
        "epic.description": "description (ADF format)",
        "story.title": "summary",
        "story.description": "description (ADF format)",
        "story.acceptance_criteria": "Custom field or description section",
        "story.story_points": "customfield_XXXXX (Story Points)",
        "story.priority": "priority"
      }
    },

    links: {
      documentation: "https://storycrafter-mcp.vercel.app/api/mcp",
      project_registry: "https://project-registry-henna.vercel.app",
      jira_mcp: "https://jira-mcp-pi.vercel.app/api/howto",
      enhanced_context: "https://enhanced-context-mcp.vercel.app/api/howto"
    }
  };

  return NextResponse.json(howto);
}
