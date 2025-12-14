'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function DocsPage() {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'StoryCrafter MCP Server API',
      version: '1.0.0',
      description:
        'AI-Powered Backlog Generator for VISHKAR Project Context. Two-phase workflow: Fast epic generation (Claude Sonnet) + Detailed story generation with iterative refinement.',
      contact: {
        name: 'StoryCrafter MCP',
        url: 'https://storycrafter-mcp.vercel.app',
      },
    },
    servers: [
      {
        url: 'https://storycrafter-mcp.vercel.app',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local Development',
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      '/api/mcp': {
        get: {
          summary: 'Health Check',
          description: 'Check if the API is running and get available tools',
          operationId: 'healthCheck',
          tags: ['System'],
          security: [],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'StoryCrafter MCP' },
                      version: { type: 'string', example: '1.0.0' },
                      tools: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['generate_epics', 'generate_stories', 'regenerate_epic', 'regenerate_story'],
                      },
                      status: { type: 'string', example: 'healthy' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Execute MCP Tool',
          description: 'Execute a StoryCrafter tool for backlog generation',
          operationId: 'executeTool',
          tags: ['MCP Tools'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MCPRequest',
                },
                examples: {
                  generate_epics: {
                    summary: 'Generate Epics (Fast - 15-20s)',
                    value: {
                      method: 'tools/call',
                      params: {
                        tool: 'generate_epics',
                        arguments: {
                          project_context: {
                            project_summary: {
                              name: 'TaskMaster',
                              description: 'Task Management App with offline support',
                              target_users: 'Remote teams',
                            },
                            final_decisions: {
                              technical_stack: 'React Native, IndexedDB',
                              timeline: '4 weeks',
                              priorities: ['Offline support', 'Task CRUD'],
                            },
                          },
                        },
                      },
                    },
                  },
                  generate_stories: {
                    summary: 'Generate Stories (Detailed - 3-5min)',
                    value: {
                      method: 'tools/call',
                      params: {
                        tool: 'generate_stories',
                        arguments: {
                          project_context: {
                            project_summary: { name: 'TaskMaster' },
                            final_decisions: { technical_stack: 'React Native' },
                          },
                          epics: [
                            {
                              id: 'EPIC-1',
                              title: 'User Authentication',
                              description: 'Secure user auth system',
                              priority: 'high',
                            },
                          ],
                        },
                      },
                    },
                  },
                  regenerate_epic: {
                    summary: 'Regenerate Epic with Feedback',
                    value: {
                      method: 'tools/call',
                      params: {
                        tool: 'regenerate_epic',
                        arguments: {
                          project_context: { project_summary: {}, final_decisions: {} },
                          epic: { id: 'EPIC-1', title: 'User Auth', description: '...' },
                          user_feedback: 'Focus more on OAuth integration',
                        },
                      },
                    },
                  },
                  regenerate_story: {
                    summary: 'Regenerate Story with Feedback',
                    value: {
                      method: 'tools/call',
                      params: {
                        tool: 'regenerate_story',
                        arguments: {
                          project_context: { project_summary: {}, final_decisions: {} },
                          epic: { id: 'EPIC-1', title: 'User Auth', description: '...' },
                          story: { id: 'STORY-1', title: 'Login', description: '...' },
                          user_feedback: 'Add biometric authentication option',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Tool executed successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MCPResponse' },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key from Project Registry',
        },
      },
      schemas: {
        MCPRequest: {
          type: 'object',
          required: ['method', 'params'],
          properties: {
            method: {
              type: 'string',
              example: 'tools/call',
            },
            params: {
              type: 'object',
              properties: {
                tool: {
                  type: 'string',
                  enum: ['generate_epics', 'generate_stories', 'regenerate_epic', 'regenerate_story'],
                },
                arguments: { type: 'object' },
              },
            },
          },
        },
        MCPResponse: {
          type: 'object',
          properties: {
            content: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'text' },
                  text: { type: 'object' },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'System', description: 'Health check and service info' },
      { name: 'MCP Tools', description: 'StoryCrafter tools - 4 tools for backlog generation' },
    ],
  };

  return (
    <div className="min-h-screen">
      <div className="bg-purple-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">StoryCrafter MCP Server</h1>
            <p className="text-purple-100">v1.0.0 - AI-Powered Backlog Generation</p>
          </div>
          <div className="space-x-4">
            <a href="/" className="text-purple-100 hover:text-white">Home</a>
            <a href="https://project-registry-henna.vercel.app/docs" className="text-purple-100 hover:text-white">All MCPs</a>
          </div>
        </div>
      </div>
      <SwaggerUI spec={spec} />
    </div>
  );
}
