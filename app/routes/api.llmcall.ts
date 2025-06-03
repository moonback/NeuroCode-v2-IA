import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import type { IProviderSetting, ProviderInfo } from '~/types/model';
import { generateText, generateId } from 'ai';
import { PROVIDER_LIST } from '~/utils/constants';
import { MAX_TOKENS } from '~/lib/.server/llm/constants';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';
import type { DesignScheme } from '~/types/design-scheme';

export async function action(args: ActionFunctionArgs) {
  return llmCallAction(args);
}

async function getModelList(options: {
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  serverEnv?: Record<string, string>;
}) {
  const llmManager = LLMManager.getInstance(import.meta.env);
  return llmManager.updateModelList(options);
}

const logger = createScopedLogger('api.llmcall');

async function llmCallAction({ context, request }: ActionFunctionArgs) {
  const { system, message, model, provider, streamOutput, chatMode, designScheme, enablePlanning } = await request.json<{
    system: string;
    message: string;
    model: string;
    provider: ProviderInfo;
    streamOutput?: boolean;
    chatMode?: 'discuss' | 'build';
    designScheme?: DesignScheme;
    enablePlanning?: boolean;
  }>();

  const { name: providerName } = provider;

  // validate 'model' and 'provider' fields
  if (!model || typeof model !== 'string') {
    throw new Response('Invalid or missing model', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Invalid or missing provider', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  if (streamOutput) {
    try {
      // Enhanced Project planning instruction injection
      const messages = [
        {
          id: generateId(),
          role: 'user' as const,
          content: message,
        },
      ];

      // Add planning logic if enabled
      if (enablePlanning && chatMode) {
        const isBuildMode = chatMode === 'build';
        const isDiscussMode = chatMode === 'discuss';
        
        // Enhanced planning detection logic
        const hasProjectKeywords = /\b(create|build|develop|make|generate|implement|design|setup|start)\b/i.test(message);
        const hasComplexityIndicators = /\b(app|application|website|system|platform|dashboard|api|backend|frontend|full.?stack)\b/i.test(message);
        
        // Determine if planning is required
        const requiresPlanning = isBuildMode && hasProjectKeywords && hasComplexityIndicators;
        const requiresDiscussionPlanning = isDiscussMode && hasProjectKeywords && hasComplexityIndicators;
        
        if (requiresPlanning || requiresDiscussionPlanning) {
          // Analyze project complexity and type
          const projectType = detectProjectType(message);
          const complexityLevel = assessComplexity(message);
          
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

After outputting the \`PROJECT_PLAN.md\` artifact, ${requiresPlanning ? 'you can then proceed with the first implementation steps from your plan' : 'provide detailed guidance based on this structured approach'}, or await further user input.
Your subsequent ${requiresPlanning ? 'code generation' : 'recommendations'} should align with this plan.
`;
          
          // Add system message at the beginning of the conversation
          messages.unshift({ 
            id: generateId(),
            role: 'user' as const,
            content: planningInstructionContent
          });
          
          logger.info(`Enhanced project planning instruction injected for ${chatMode} mode. Project type: ${projectType}, Complexity: ${complexityLevel}`);
        }
      }

      const result = await streamText({
        options: {
          system,
        },
        messages,
        env: context.cloudflare?.env as any,
        apiKeys,
        providerSettings,
      });

      return new Response(result.textStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (error: unknown) {
      console.log(error);

      if (error instanceof Error && error.message?.includes('API key')) {
        throw new Response('Invalid or missing API key', {
          status: 401,
          statusText: 'Unauthorized',
        });
      }

      throw new Response(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  } else {
    try {
      const models = await getModelList({ apiKeys, providerSettings, serverEnv: context.cloudflare?.env as any });
      const modelDetails = models.find((m: ModelInfo) => m.name === model);

      if (!modelDetails) {
        throw new Error('Model not found');
      }

      const dynamicMaxTokens = modelDetails && modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

      const providerInfo = PROVIDER_LIST.find((p) => p.name === provider.name);

      if (!providerInfo) {
        throw new Error('Provider not found');
      }

      logger.info(`Generating response Provider: ${provider.name}, Model: ${modelDetails.name}`);

      // Enhanced Project planning instruction injection for non-streaming
      const messages = [
        {
          role: 'user' as const,
          content: message,
        },
      ];

      // Add planning logic if enabled
      if (enablePlanning && chatMode) {
        const isBuildMode = chatMode === 'build';
        const isDiscussMode = chatMode === 'discuss';
        
        // Enhanced planning detection logic
        const hasProjectKeywords = /\b(create|build|develop|make|generate|implement|design|setup|start)\b/i.test(message);
        const hasComplexityIndicators = /\b(app|application|website|system|platform|dashboard|api|backend|frontend|full.?stack)\b/i.test(message);
        
        // Determine if planning is required
        const requiresPlanning = isBuildMode && hasProjectKeywords && hasComplexityIndicators;
        const requiresDiscussionPlanning = isDiscussMode && hasProjectKeywords && hasComplexityIndicators;
        
        if (requiresPlanning || requiresDiscussionPlanning) {
          // Analyze project complexity and type
          const projectType = detectProjectType(message);
          const complexityLevel = assessComplexity(message);
          
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

After outputting the \`PROJECT_PLAN.md\` artifact, ${requiresPlanning ? 'you can then proceed with the first implementation steps from your plan' : 'provide detailed guidance based on this structured approach'}, or await further user input.
Your subsequent ${requiresPlanning ? 'code generation' : 'recommendations'} should align with this plan.
`;
          
          // Add system message at the beginning of the conversation
          messages.unshift({ 
            role: 'user' as const,
            content: planningInstructionContent
          });
          
          logger.info(`Enhanced project planning instruction injected for ${chatMode} mode. Project type: ${projectType}, Complexity: ${complexityLevel}`);
        }
      }

      const result = await generateText({
        system,
        messages,
        model: providerInfo.getModelInstance({
          model: modelDetails.name,
          serverEnv: context.cloudflare?.env as any,
          apiKeys,
          providerSettings,
        }),
        maxTokens: dynamicMaxTokens,
        toolChoice: 'none',
      });
      logger.info(`Generated response`);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error: unknown) {
      console.log(error);

      if (error instanceof Error && error.message?.includes('API key')) {
        throw new Response('Invalid or missing API key', {
          status: 401,
          statusText: 'Unauthorized',
        });
      }

      throw new Response(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  }
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
