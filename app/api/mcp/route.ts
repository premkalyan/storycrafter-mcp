/**
 * StoryCrafter MCP Server
 * AI-powered backlog generator for VISHKAR consensus discussions
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// StoryCrafter service URL (deployed separately)
const STORYCRAFTER_SERVICE_URL = process.env.STORYCRAFTER_SERVICE_URL || 'https://storycrafter-service.vercel.app';

// ============================================================
// TYPES
// ============================================================

interface ConsensusMessage {
  role: string;
  content: string;
}

interface ProjectMetadata {
  project_name?: string;
  project_description?: string;
  target_users?: string;
  platform?: string;
  timeline?: string;
  team_size?: string;
}

interface MCPRequest {
  method: string;
  params?: {
    tool?: string;
    arguments?: Record<string, any>;
  };
}

// ============================================================
// MCP TOOLS
// ============================================================

const MCP_TOOLS = [
  {
    name: 'generate_epics',
    description: '⚡ FAST (15-20 seconds): Generate 5-8 high-level Epics from VISHKAR project context using Claude Sonnet 4.5. Returns epic structure with titles, descriptions, and acceptance criteria. Use this first to get quick epic overview.',
    inputSchema: {
      type: 'object',
      properties: {
        project_context: {
          type: 'object',
          description: 'Complete VISHKAR project context including project_summary, final_decisions, and discussion data',
          properties: {
            project_summary: { type: 'object' },
            final_decisions: { type: 'object' },
            questions_and_answers: { type: 'array' }
          },
          required: ['project_summary', 'final_decisions']
        }
      },
      required: ['project_context']
    }
  },
  {
    name: 'generate_stories',
    description: '🔄 DETAILED (3-5 minutes): Generate detailed User Stories for specific epics using GPT-5 (128K output). Takes epic data + context and returns comprehensive stories with acceptance criteria, technical tasks, and estimates. Call this after generate_epics for full backlog.',
    inputSchema: {
      type: 'object',
      properties: {
        project_context: {
          type: 'object',
          description: 'Original VISHKAR project context',
          properties: {
            project_summary: { type: 'object' },
            final_decisions: { type: 'object' }
          },
          required: ['project_summary', 'final_decisions']
        },
        epics: {
          type: 'array',
          description: 'Array of epic objects from generate_epics output',
          items: { type: 'object' }
        }
      },
      required: ['project_context', 'epics']
    }
  },
  {
    name: 'regenerate_epic',
    description: '🔄 REGENERATE EPIC (20-30 seconds): Regenerate a single epic based on user feedback using Claude Sonnet 4.5. When user is unhappy with an epic, use this to create an improved version incorporating their comments.',
    inputSchema: {
      type: 'object',
      properties: {
        project_context: {
          type: 'object',
          description: 'Original VISHKAR project context',
          properties: {
            project_summary: { type: 'object' },
            final_decisions: { type: 'object' }
          },
          required: ['project_summary', 'final_decisions']
        },
        epic: {
          type: 'object',
          description: 'The epic object to regenerate (must include id, title, description)',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
            category: { type: 'string' }
          },
          required: ['id', 'title', 'description']
        },
        user_feedback: {
          type: 'string',
          description: 'User comments/feedback on what needs to be changed or improved in the epic'
        }
      },
      required: ['project_context', 'epic', 'user_feedback']
    }
  },
  {
    name: 'regenerate_story',
    description: '🔄 REGENERATE STORY (1-2 minutes): Regenerate a single user story based on user feedback using GPT-5. When user is unhappy with a story, use this to create an improved version with better acceptance criteria and technical tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        project_context: {
          type: 'object',
          description: 'Original VISHKAR project context',
          properties: {
            project_summary: { type: 'object' },
            final_decisions: { type: 'object' }
          },
          required: ['project_summary', 'final_decisions']
        },
        epic: {
          type: 'object',
          description: 'The parent epic object (for context)',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['id', 'title', 'description']
        },
        story: {
          type: 'object',
          description: 'The story object to regenerate (must include id, title, description)',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
            estimate_hours: { type: 'number' }
          },
          required: ['id', 'title', 'description']
        },
        user_feedback: {
          type: 'string',
          description: 'User comments/feedback on what needs to be changed or improved in the story'
        }
      },
      required: ['project_context', 'epic', 'story', 'user_feedback']
    }
  }
];

// ============================================================
// TRANSFORMATION HELPER
// ============================================================

/**
 * Transform VISHKAR project_context format into StoryCrafter service format
 * Input: { project_summary, final_decisions }
 * Output: { consensus_messages[], project_metadata }
 */
function transformProjectContext(projectContext: any): { consensus_messages: ConsensusMessage[], project_metadata: ProjectMetadata } {
  const messages: ConsensusMessage[] = [];

  // Add system message with project summary
  const projectSummary = projectContext.project_summary || projectContext.projectSummary;
  if (projectSummary) {
    const systemContent = `Project: ${projectSummary.project_name || projectSummary.projectName || 'Untitled Project'}

${projectSummary.project_description || projectSummary.projectDescription || ''}

Target Users: ${projectSummary.target_users || projectSummary.targetUsers || 'Not specified'}
Platform: ${projectSummary.platform || 'Not specified'}
Timeline: ${projectSummary.timeline || 'Not specified'}
Team Size: ${projectSummary.team_size || projectSummary.teamSize || 'Not specified'}`;

    messages.push({ role: 'system', content: systemContent });
  }

  // Extract final decisions
  const finalDecisions = projectContext.final_decisions || projectContext.finalDecisions;

  if (finalDecisions) {
    // Alex (Product Manager)
    if (finalDecisions.product) {
      const product = finalDecisions.product;
      let alexContent = 'Product Manager Perspective - MVP Requirements:\n\n';

      if (product.mvp_features || product.mvpFeatures) {
        alexContent += 'MVP Features:\n';
        const features = product.mvp_features || product.mvpFeatures;
        features.forEach((feature: string) => alexContent += `- ${feature}\n`);
      }

      if (product.target_users || product.targetUsers) {
        alexContent += `\nTarget Users: ${product.target_users || product.targetUsers}`;
      }

      if (product.development_approach || product.developmentApproach) {
        alexContent += `\nDevelopment Approach: ${product.development_approach || product.developmentApproach}`;
      }

      messages.push({ role: 'alex', content: alexContent.trim() });
    }

    // Blake (Technical Architect)
    if (finalDecisions.technical) {
      const tech = finalDecisions.technical;
      let blakeContent = 'Technical Architect Perspective - Architecture & Stack:\n\n';

      Object.keys(tech).forEach(key => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        blakeContent += `${label}: ${tech[key]}\n`;
      });

      messages.push({ role: 'blake', content: blakeContent.trim() });
    }

    // Casey (Project Manager)
    if (finalDecisions.project) {
      const project = finalDecisions.project;
      let caseyContent = 'Project Manager Perspective - Timeline & Execution:\n\n';

      if (project.timeline) {
        caseyContent += `Timeline: ${project.timeline}\n`;
      }

      if (project.team) {
        caseyContent += `Team Composition: ${project.team}\n`;
      }

      if (project.milestones) {
        caseyContent += '\nMilestones:\n';
        Object.keys(project.milestones).forEach(key => {
          const label = key.replace(/_/g, ' ').toUpperCase();
          caseyContent += `- ${label}: ${project.milestones[key]}\n`;
        });
      }

      if (project.testing) {
        caseyContent += `\nTesting Strategy: ${project.testing}`;
      }

      messages.push({ role: 'casey', content: caseyContent.trim() });
    }
  }

  // Extract project metadata
  const metadata: ProjectMetadata = {};
  if (projectSummary) {
    metadata.project_name = projectSummary.project_name || projectSummary.projectName;
    metadata.project_description = projectSummary.project_description || projectSummary.projectDescription;
    metadata.target_users = projectSummary.target_users || projectSummary.targetUsers;
    metadata.platform = projectSummary.platform;
    metadata.timeline = projectSummary.timeline;
    metadata.team_size = projectSummary.team_size || projectSummary.teamSize;
  }

  return { consensus_messages: messages, project_metadata: metadata };
}

// ============================================================
// TOOL HANDLERS
// ============================================================

async function handleGenerateEpics(args: Record<string, any>) {
  const { project_context } = args;

  if (!project_context || typeof project_context !== 'object') {
    throw new Error('project_context is required and must be an object');
  }

  if (!project_context.project_summary || !project_context.final_decisions) {
    throw new Error('project_context must include project_summary and final_decisions');
  }

  // Transform VISHKAR format to service format
  const { consensus_messages, project_metadata } = transformProjectContext(project_context);

  // Call StoryCrafter service with transformed format
  try {
    const response = await axios.post(
      `${STORYCRAFTER_SERVICE_URL}/generate-epics`,
      {
        consensus_messages,
        project_metadata
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 1 minute
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Epic generation failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            epics: response.data.epics,
            metadata: response.data.metadata
          }, null, 2)
        }
      ]
    };
  } catch (error: any) {
    if (error.response) {
      throw new Error(`StoryCrafter service error: ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`StoryCrafter service unavailable: ${STORYCRAFTER_SERVICE_URL}`);
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

async function handleGenerateStories(args: Record<string, any>) {
  const { project_context, epics } = args;

  if (!project_context || typeof project_context !== 'object') {
    throw new Error('project_context is required and must be an object');
  }

  if (!epics || !Array.isArray(epics)) {
    throw new Error('epics is required and must be an array');
  }

  // Transform VISHKAR format to service format
  const { consensus_messages, project_metadata } = transformProjectContext(project_context);

  // Call StoryCrafter service with transformed format
  try {
    // Note: Service expects to receive epic objects and expand them with stories
    const response = await axios.post(
      `${STORYCRAFTER_SERVICE_URL}/generate-stories`,
      {
        epic: epics[0], // Service generates stories for one epic at a time
        consensus_messages,
        project_metadata
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600000 // 10 minutes
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Story generation failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            stories: response.data.stories,
            metadata: response.data.metadata
          }, null, 2)
        }
      ]
    };
  } catch (error: any) {
    if (error.response) {
      throw new Error(`StoryCrafter service error: ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`StoryCrafter service unavailable: ${STORYCRAFTER_SERVICE_URL}`);
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

async function handleRegenerateEpic(args: Record<string, any>) {
  const { project_context, epic, user_feedback } = args;

  if (!project_context || typeof project_context !== 'object') {
    throw new Error('project_context is required and must be an object');
  }

  if (!epic || typeof epic !== 'object') {
    throw new Error('epic is required and must be an object');
  }

  if (!user_feedback || typeof user_feedback !== 'string') {
    throw new Error('user_feedback is required and must be a string');
  }

  // Transform VISHKAR format to service format
  const { consensus_messages, project_metadata } = transformProjectContext(project_context);

  // Call StoryCrafter service with transformed format
  try {
    const response = await axios.post(
      `${STORYCRAFTER_SERVICE_URL}/regenerate-epic`,
      {
        epic,
        user_feedback,
        consensus_messages,
        project_metadata
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 1 minute
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Epic regeneration failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            epic: response.data.epic,
            metadata: response.data.metadata
          }, null, 2)
        }
      ]
    };
  } catch (error: any) {
    if (error.response) {
      throw new Error(`StoryCrafter service error: ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`StoryCrafter service unavailable: ${STORYCRAFTER_SERVICE_URL}`);
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

async function handleRegenerateStory(args: Record<string, any>) {
  const { project_context, epic, story, user_feedback } = args;

  if (!project_context || typeof project_context !== 'object') {
    throw new Error('project_context is required and must be an object');
  }

  if (!epic || typeof epic !== 'object') {
    throw new Error('epic is required and must be an object');
  }

  if (!story || typeof story !== 'object') {
    throw new Error('story is required and must be an object');
  }

  if (!user_feedback || typeof user_feedback !== 'string') {
    throw new Error('user_feedback is required and must be a string');
  }

  // Transform VISHKAR format to service format
  const { consensus_messages, project_metadata } = transformProjectContext(project_context);

  // Call StoryCrafter service with transformed format
  try {
    const response = await axios.post(
      `${STORYCRAFTER_SERVICE_URL}/regenerate-story`,
      {
        epic,
        story,
        user_feedback,
        consensus_messages,
        project_metadata
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000 // 3 minutes
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Story regeneration failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            story: response.data.story,
            metadata: response.data.metadata
          }, null, 2)
        }
      ]
    };
  } catch (error: any) {
    if (error.response) {
      throw new Error(`StoryCrafter service error: ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`StoryCrafter service unavailable: ${STORYCRAFTER_SERVICE_URL}`);
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

// ============================================================
// MCP REQUEST HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json();

    // Handle MCP protocol methods
    switch (body.method) {
      case 'tools/list':
        return NextResponse.json({
          tools: MCP_TOOLS
        });

      case 'tools/call':
        const toolName = body.params?.tool;
        const args = body.params?.arguments || {};

        let result;
        switch (toolName) {
          case 'generate_epics':
            result = await handleGenerateEpics(args);
            break;

          case 'generate_stories':
            result = await handleGenerateStories(args);
            break;

          case 'regenerate_epic':
            result = await handleRegenerateEpic(args);
            break;

          case 'regenerate_story':
            result = await handleRegenerateStory(args);
            break;

          default:
            return NextResponse.json(
              {
                error: {
                  code: -32601,
                  message: `Unknown tool: ${toolName}`
                }
              },
              { status: 400 }
            );
        }

        return NextResponse.json(result);

      default:
        return NextResponse.json(
          {
            error: {
              code: -32601,
              message: `Method not found: ${body.method}`
            }
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('MCP Error:', error);
    return NextResponse.json(
      {
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    name: 'StoryCrafter MCP',
    version: '1.0.0',
    description: 'AI-powered backlog generator for VISHKAR consensus',
    tools: MCP_TOOLS.map(t => t.name),
    service_url: STORYCRAFTER_SERVICE_URL,
    status: 'healthy'
  });
}
