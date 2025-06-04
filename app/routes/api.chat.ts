import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createDataStream, generateId } from 'ai';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS, type FileMap } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { getFilePaths, selectContext } from '~/lib/.server/llm/select-context';
import type { ContextAnnotation, DataStreamError, ProgressAnnotation, SegmentsGroupAnnotation } from '~/types/context';


import { WORK_DIR } from '~/utils/constants';
import { createSummary } from '~/lib/.server/llm/create-summary';
import { extractPropertiesFromMessage } from '~/lib/.server/llm/utils';
import type { DesignScheme } from '~/types/design-scheme';
export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

const logger = createScopedLogger('api.chat');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages, files, promptId, contextOptimization, supabase, chatMode, designScheme } = await request.json<{
    messages: Messages;
    files: any;
    promptId?: string;
    contextOptimization: boolean;
    chatMode: 'discuss' | 'build';
    designScheme?: DesignScheme;
    supabase?: {
      isConnected: boolean;
      hasSelectedProject: boolean;
      credentials?: {
        anonKey?: string;
        supabaseUrl?: string;
      };
    };
  }>();

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

  const stream = new SwitchableStream();
  const segmentsGroupId = generateId();

  let responseSegments = 0;

  const cumulativeUsage = {
    completionTokens: 0,
    promptTokens: 0,
    totalTokens: 0,
  };
  const encoder: TextEncoder = new TextEncoder();
  let progressCounter: number = 1;

  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Longueur totale du message : ${totalMessageContent.split(' ').length} mots`);

    let lastChunk: string | undefined = undefined;

    const dataStream = createDataStream({
      async execute(dataStream) {
        const filePaths = getFilePaths(files || {});
        let filteredFiles: FileMap | undefined = undefined;
        let summary: string | undefined = undefined;
        let messageSliceId = 0;

        if (messages.length > 3) {
          messageSliceId = messages.length - 3;
        }
// Enhanced Project planning instruction injection
const isBuildMode = chatMode === 'build';
const isDiscussMode = chatMode === 'discuss';

// Analyze conversation context for better planning decisions
const userMessages = messages.filter(msg => msg.role === 'user');
const assistantMessages = messages.filter(msg => msg.role === 'assistant');
const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

// Enhanced planning detection logic
const hasProjectKeywords = /\b(create|build|develop|make|generate|implement|design|setup|start)\b/i.test(lastUserMessage);
const hasComplexityIndicators = /\b(app|application|website|system|platform|dashboard|api|backend|frontend|full.?stack)\b/i.test(lastUserMessage);
const isEarlyConversation = messages.length < 5;
const hasNoPreviousPlan = !assistantMessages.some(msg => msg.content.includes('PROJECT_PLAN.md') || msg.content.includes('## Project Goals'));

// Determine if planning is required
const requiresPlanning = isBuildMode && isEarlyConversation && hasProjectKeywords && hasComplexityIndicators && hasNoPreviousPlan;

// Enhanced planning for discussion mode when appropriate
const requiresDiscussionPlanning = isDiscussMode && hasProjectKeywords && hasComplexityIndicators && isEarlyConversation && hasNoPreviousPlan;

if (requiresPlanning || requiresDiscussionPlanning) {
    // Add progress message for project planning start
    dataStream.writeData({
      type: 'progress',
      label: 'project-planning',
      status: 'in-progress',
      order: progressCounter++,
      message: '🔍 Analyse du projet et génération du plan stratégique...',
    } satisfies ProgressAnnotation);

    // Analyze project complexity and type
    const projectType = detectProjectType(lastUserMessage);
    const complexityLevel = assessComplexity(lastUserMessage);
    
    // Update progress with analysis results
    dataStream.writeData({
      type: 'progress',
      label: 'project-analysis',
      status: 'in-progress',
      order: progressCounter++,
      message: `📊 Analyse terminée • Type: ${projectType} • Complexité: ${complexityLevel}`,
    } satisfies ProgressAnnotation);
    
    const planningInstructionContent = `Before ${requiresPlanning ? 'generating any code' : 'providing detailed guidance'} for the main task, please first create a comprehensive project plan in Markdown format.
This plan should be saved to a file named \`PROJECT_PLAN.md\` using a file artifact.

Based on the request analysis:
- **Project Type:** ${projectType}
- **Complexity Level:** ${complexityLevel}
- **Mode:** ${chatMode}

The plan should clearly outline:

## 📋 Project Overview
- **Project Goals:** What the project aims to achieve
- **Target Audience:** Who will use this project
- **Success Criteria:** How to measure project success

## 🚀 Key Features
- **Core Features:** Essential functionalities (MVP)
- **Advanced Features:** Nice-to-have functionalities
- **Future Enhancements:** Potential future additions

## 🏗️ Technical Architecture
- **Technology Stack:** Recommended technologies and frameworks
- **Database Design:** Data structure and relationships (if applicable)
- **API Design:** Endpoints and data flow (if applicable)
- **Security Considerations:** Authentication, authorization, data protection

## 📁 Project Structure
\`\`\`
project-root/
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── services/
│   └── types/
├── public/
├── tests/
└── docs/
\`\`\`

## 🔄 Implementation Roadmap
### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] Basic structure and core components
- [ ] Development environment setup

### Phase 2: Core Features (Week 2-3)
- [ ] Implement main functionalities
- [ ] User interface development
- [ ] Basic testing

### Phase 3: Enhancement (Week 4)
- [ ] Advanced features
- [ ] Performance optimization
- [ ] Comprehensive testing

### Phase 4: Deployment (Week 5)
- [ ] Production setup
- [ ] Documentation
- [ ] Launch preparation

## 🛠️ Development Guidelines
- **Code Standards:** Coding conventions and best practices
- **Testing Strategy:** Unit, integration, and e2e testing approach
- **Documentation:** Code documentation and user guides
- **Version Control:** Git workflow and branching strategy

## 📊 Risk Assessment
- **Technical Risks:** Potential technical challenges
- **Timeline Risks:** Factors that might affect delivery
- **Mitigation Strategies:** How to address identified risks

## 📚 Resources & Dependencies
- **External APIs:** Third-party services required
- **Libraries & Frameworks:** Key dependencies
- **Learning Resources:** Documentation and tutorials

After outputting the \`PROJECT_PLAN.md\` artifact, ${requiresPlanning ? 'you MUST immediately proceed with creating the initial project structure and core files as outlined in Phase 1 of your implementation roadmap. This includes:\n\n1. **Project Setup Files:**\n   - Create package.json with necessary dependencies\n   - Set up configuration files (tsconfig.json, .env.example, etc.)\n   - Initialize basic folder structure\n\n2. **Core Application Files:**\n   - Create main entry point files\n   - Set up basic routing structure\n   - Initialize core components\n   - Add essential utility files\n\n3. **Development Environment:**\n   - Create README.md with setup instructions\n   - Add basic scripts for development\n   - Set up initial styling structure\n\nDo NOT wait for additional user input - implement the foundation immediately after the plan. Your code generation should create a working, runnable project structure that the user can immediately start developing with.' : 'provide detailed guidance and create initial project structure based on this structured approach'}.
Your subsequent ${requiresPlanning ? 'code generation' : 'recommendations'} should align with this plan and create tangible, functional project files.
`;

    // Add system message at the beginning of the conversation
    messages.unshift({ 
        role: 'system', 
        content: planningInstructionContent, 
        id: generateId() 
    });
    
    // Complete project planning progress
    dataStream.writeData({
      type: 'progress',
      label: 'project-planning',
      status: 'complete',
      order: progressCounter++,
      message: '✅ Plan de projet stratégique préparé avec succès',
    } satisfies ProgressAnnotation);
    
    logger.info(`Enhanced project planning instruction injected for ${chatMode} mode. Project type: ${projectType}, Complexity: ${complexityLevel}`);
    
    // Add progress for PROJECT_PLAN.md generation
    dataStream.writeData({
      type: 'progress',
      label: 'plan-generation',
      status: 'in-progress',
      order: progressCounter++,
      message: '📝 Génération du plan du projet avec une architecture détaillée et une feuille de route de mise en œuvre...',
    } satisfies ProgressAnnotation);
}

// Helper functions for project analysis
function detectProjectType(message: string): string {
    const types = {
        'web application': /\b(web.?app|website|web.?application|spa|single.?page)\b/i,
        'mobile application': /\b(mobile.?app|android|ios|react.?native|flutter)\b/i,
        'desktop application': /\b(desktop.?app|electron|tauri|native.?app)\b/i,
        'api/backend': /\b(api|backend|server|microservice|rest|graphql)\b/i,
        'dashboard/admin': /\b(dashboard|admin.?panel|cms|management.?system)\b/i,
        'e-commerce': /\b(e.?commerce|shop|store|marketplace|cart)\b/i,
        'data analysis': /\b(data.?analysis|analytics|visualization|dashboard|reporting)\b/i,
        'game': /\b(game|gaming|interactive|simulation)\b/i,
        'ai/ml application': /\b(ai|machine.?learning|ml|neural.?network|chatbot)\b/i
    };
    
    for (const [type, regex] of Object.entries(types)) {
        if (regex.test(message)) return type;
    }
    return 'general application';
}

function assessComplexity(message: string): string {
    let score = 0;
    
    // Complexity indicators with proper typing
    const indicators: Record<string, [RegExp, number]> = {
        high: [/\b(full.?stack|microservice|distributed|scalable|enterprise|complex|advanced)\b/i, 3],
        medium: [/\b(database|authentication|api|integration|responsive|real.?time)\b/i, 2],
        basic: [/\b(simple|basic|minimal|prototype|mvp|quick)\b/i, -1]
    };
    
    for (const [level, [regex, points]] of Object.entries(indicators)) {
        if (regex.test(message)) score += points;
    }
    
    if (score >= 4) return 'High (Enterprise-level)';
    if (score >= 2) return 'Medium (Production-ready)';
    if (score >= 0) return 'Low-Medium (Standard)';
    return 'Low (Simple/Prototype)';
}
        if (filePaths.length > 0 && contextOptimization) {
          logger.debug('Génération du résumé de conversation');
          dataStream.writeData({
            type: 'progress',
            label: 'summary',
            status: 'in-progress',
            order: progressCounter++,
            message: '🧠 Analyse intelligente de la conversation en cours...',
          } satisfies ProgressAnnotation);

          // Créer un résumé de la conversation
          console.log(`Messages count: ${messages.length}`);

          summary = await createSummary({
            messages: [...messages],
            env: context.cloudflare?.env,
            apiKeys,
            providerSettings,
            promptId,
            contextOptimization,
            onFinish(resp) {
              if (resp.usage) {
                logger.debug('utilisation de tokens pour createSummary', JSON.stringify(resp.usage));
                cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
                cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
                cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
              }
            },
          });
          dataStream.writeData({
            type: 'progress',
            label: 'summary',
            status: 'complete',
            order: progressCounter++,
            message: '✅ Analyse de conversation terminée avec succès',
          } satisfies ProgressAnnotation);

          dataStream.writeMessageAnnotation({
            type: 'chatSummary',
            summary,
            chatId: messages.slice(-1)?.[0]?.id,
          } as ContextAnnotation);

          // Update context buffer
          logger.debug('Mise à jour du tampon de contexte');
          dataStream.writeData({
            type: 'progress',
            label: 'context',
            status: 'in-progress',
            order: progressCounter++,
            message: '📁 Sélection intelligente des fichiers pertinents...',
          } satisfies ProgressAnnotation);

          // Sélectionner les fichiers de contexte
          console.log(`Messages count: ${messages.length}`);
          filteredFiles = await selectContext({
            messages: [...messages],
            env: context.cloudflare?.env,
            apiKeys,
            files,
            providerSettings,
            promptId,
            contextOptimization,
            summary,
            onFinish(resp) {
              if (resp.usage) {
                logger.debug('utilisation de tokens pour selectContext', JSON.stringify(resp.usage));
                cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
                cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
                cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
              }
            },
          });

          if (filteredFiles) {
            logger.debug(`fichiers dans le contexte : ${JSON.stringify(Object.keys(filteredFiles))}`);
          }

          dataStream.writeMessageAnnotation({
            type: 'codeContext',
            files: Object.keys(filteredFiles).map((key) => {
              let path = key;

              if (path.startsWith(WORK_DIR)) {
                path = path.replace(WORK_DIR, '');
              }

              return path;
            }),
          } as ContextAnnotation);

          const fileCount = filteredFiles ? Object.keys(filteredFiles).length : 0;
          dataStream.writeData({
            type: 'progress',
            label: 'context',
            status: 'complete',
            order: progressCounter++,
            message: `✅ ${fileCount} fichier${fileCount > 1 ? 's' : ''} de code sélectionné${fileCount > 1 ? 's' : ''} pour le contexte`,
          } satisfies ProgressAnnotation);

          // logger.debug('Fichiers de code sélectionnés');
        }

        const options: StreamingOptions = {
          supabaseConnection: supabase,
          toolChoice: 'none',
          onFinish: async ({ text: content, finishReason, usage }) => {
            logger.debug('utilisation', JSON.stringify(usage));

            if (usage) {
              cumulativeUsage.completionTokens += usage.completionTokens || 0;
              cumulativeUsage.promptTokens += usage.promptTokens || 0;
              cumulativeUsage.totalTokens += usage.totalTokens || 0;
            }

            if (finishReason !== 'length') {
              // Check if PROJECT_PLAN.md was generated in the response
              if ((requiresPlanning || requiresDiscussionPlanning) && content.includes('PROJECT_PLAN.md')) {
                dataStream.writeData({
                  type: 'progress',
                  label: 'plan-generation',
                  status: 'complete',
                  order: progressCounter++,
                  message: '📋 Plan de projet généré avec succès',
                } satisfies ProgressAnnotation);
              }
              
              dataStream.writeMessageAnnotation({
                type: 'usage',
                value: {
                  completionTokens: cumulativeUsage.completionTokens,
                  promptTokens: cumulativeUsage.promptTokens,
                  totalTokens: cumulativeUsage.totalTokens,
                },
              });
              dataStream.writeData({
                type: 'progress',
                label: 'response',
                status: 'complete',
                order: progressCounter++,
                message: `✅ Réponse générée (${cumulativeUsage.totalTokens} tokens utilisés)`,
              } satisfies ProgressAnnotation);
              await new Promise((resolve) => setTimeout(resolve, 0));

              // stream.close();
              return;
            }

            responseSegments++;

            if (responseSegments >= MAX_RESPONSE_SEGMENTS) {
              dataStream.writeData({
                type: 'error',
                id: generateId(),
                message: '⚠️ Impossible de continuer le message : Nombre maximum de segments atteint.',
              } satisfies DataStreamError);
              dataStream.writeData({
                type: 'progress',
                label: 'response',
                status: 'error',
                order: progressCounter++,
                message: '❌ Erreur : Limite de segments atteinte',
              } satisfies ProgressAnnotation);
              await new Promise((resolve) => setTimeout(resolve, 0));

              return;
            }

            const switchesLeft = MAX_RESPONSE_SEGMENTS - responseSegments;
            logger.info(`Limite maximale de tokens atteinte (${MAX_TOKENS}) : Poursuite du message (${switchesLeft} changements restants)`);
            
            // Add progress message for continuation
            dataStream.writeData({
              type: 'progress',
              label: 'continuation',
              status: 'in-progress',
              order: progressCounter++,
              message: `🔄 Continuation du message (${switchesLeft} segments restants)...`,
            } satisfies ProgressAnnotation);

            const lastUserMessage = messages.filter((x) => x.role == 'user').slice(-1)[0];
            const { model, provider } = extractPropertiesFromMessage(lastUserMessage);
            messages.push({ id: generateId(), role: 'assistant', content });
            messages.push({
              id: generateId(),
              role: 'user',
              content: `[Model: ${model}]\n\n[Provider: ${provider}]\n\n${CONTINUE_PROMPT}`,
            });
            dataStream.writeMessageAnnotation({
              type: 'segmentsGroup',
              segmentsGroupId,
            } satisfies SegmentsGroupAnnotation);
            const result = await streamText({
              messages,
              env: context.cloudflare?.env,
              options,
              apiKeys,
              files,
              providerSettings,
              promptId,
              contextOptimization,
              contextFiles: filteredFiles,
              chatMode,
              designScheme,
              summary,
              messageSliceId,
            });

            result.mergeIntoDataStream(dataStream);

            (async () => {
              for await (const part of result.fullStream) {
                if (part.type === 'error') {
                  const error: any = part.error;
                  logger.error(`${error}`);

                  return;
                }
              }
            })();

            return;
          },
        };

        dataStream.writeData({
          type: 'progress',
          label: 'response',
          status: 'in-progress',
          order: progressCounter++,
          message: '🤖 Génération de la réponse intelligente en cours...',
        } satisfies ProgressAnnotation);

        const result = await streamText({
          messages,
          env: context.cloudflare?.env,
          options,
          apiKeys,
          files,
          providerSettings,
          promptId,
          contextOptimization,
          contextFiles: filteredFiles,
          chatMode,
          designScheme,
          summary,
          messageSliceId,
        });

        (async () => {
          for await (const part of result.fullStream) {
            if (part.type === 'error') {
              const error: any = part.error;
              logger.error(`${error}`);

              return;
            }
          }
        })();
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error: any) => `Erreur personnalisée : ${error.message}`,
    }).pipeThrough(
      new TransformStream({
        transform: (chunk, controller) => {
          if (!lastChunk) {
            lastChunk = ' ';
          }

          if (typeof chunk === 'string') {
            if (chunk.startsWith('g') && !lastChunk.startsWith('g')) {
              controller.enqueue(encoder.encode(`0: "<div class=\\"__boltThought__\\">"\n`));
            }

            if (lastChunk.startsWith('g') && !chunk.startsWith('g')) {
              controller.enqueue(encoder.encode(`0: "</div>\\n"\n`));
            }
          }

          lastChunk = chunk;

          let transformedChunk = chunk;

          if (typeof chunk === 'string' && chunk.startsWith('g')) {
            let content = chunk.split(':').slice(1).join(':');

            if (content.endsWith('\n')) {
              content = content.slice(0, content.length - 1);
            }

            transformedChunk = `0:${content}\n`;
          }

          // Convertir le flux de chaînes en flux d'octets
          const str = typeof transformedChunk === 'string' ? transformedChunk : JSON.stringify(transformedChunk);
          controller.enqueue(encoder.encode(str));
        },
      }),
    );

    return new Response(dataStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    logger.error(error);

    if (error.message?.includes('API key')) {
      throw new Response('Clé API invalide ou manquante', {
        status: 401,
        statusText: 'Non autorisé',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Erreur interne du serveur',
    });
  }
}
