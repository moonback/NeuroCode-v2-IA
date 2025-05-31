import { generateText, type CoreTool, type GenerateTextResult, type Message } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { extractCurrentContext, extractPropertiesFromMessage, simplifyBoltActions } from './utils';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createHash } from 'crypto';

const logger = createScopedLogger('create-summary');

// Cache pour stocker les résumés générés
const summaryCache = new Map<string, {
  summary: string;
  timestamp: number;
  messageHash: string;
}>();

// Durée de validité du cache en millisecondes (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Nombre maximum de messages à traiter par lot pour la création du résumé
const BATCH_SIZE = 50;

// Fonction pour générer un hash des messages
function generateMessagesHash(messages: Message[]): string {
  const content = JSON.stringify(messages.map(m => ({ role: m.role, content: m.content })));
  return createHash('md5').update(content).digest('hex');
}

// Fonction pour vérifier si le cache est valide
function isCacheValid(cacheEntry: { timestamp: number; messageHash: string }, currentHash: string): boolean {
  const now = Date.now();
  return now - cacheEntry.timestamp < CACHE_DURATION && cacheEntry.messageHash === currentHash;
}

// Fonction pour extraire les informations clés d'un message
function extractKeyInformation(message: Message): string {
  const content = Array.isArray(message.content)
    ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
    : message.content;

  // Suppression des parties non essentielles
  return content
    .replace(/<div class=\\"__boltThought__\\">.*?<\/div>/s, '')
    .replace(/<think>.*?<\/think>/s, '')
    .replace(/```.*?```/gs, '[code]')
    .trim();
}

export async function createSummary(props: {
  messages: Message[];
  env?: Env;
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  onFinish?: (resp: GenerateTextResult<Record<string, CoreTool<any, any>>, never>) => void;
}) {
  const { messages, env: serverEnv, apiKeys, providerSettings, onFinish, promptId } = props;
  
  // Vérification du cache
  const currentHash = generateMessagesHash(messages);
  const cacheKey = promptId || 'default';
  const cachedSummary = summaryCache.get(cacheKey);
  
  if (cachedSummary && isCacheValid(cachedSummary, currentHash)) {
    logger.info('Using cached summary');
    return cachedSummary.summary;
  }

  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  
  // Optimisation du traitement des messages
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;
      return { ...message, content };
    } else if (message.role === 'assistant') {
      return { ...message, content: extractKeyInformation(message) };
    }
    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  let slicedMessages = processedMessages;
  const { summary } = extractCurrentContext(processedMessages);
  let summaryText: string | undefined = undefined;
  let chatId: string | undefined = undefined;

  if (summary && summary.type === 'chatSummary') {
    chatId = summary.chatId;
    summaryText = `Below is the Chat Summary till now, this is chat summary before the conversation provided by the user 
you should also use this as historical message while providing the response to the user.        
${summary.summary}`;

    if (chatId) {
      const index = processedMessages.findIndex(m => m.id === chatId);
      if (index !== -1) {
        slicedMessages = processedMessages.slice(index + 1);
      }
    }
  }

  // Traitement par lots pour les conversations longues
  const batches = [];
  for (let i = 0; i < slicedMessages.length; i += BATCH_SIZE) {
    batches.push(slicedMessages.slice(i, i + BATCH_SIZE));
  }

  let batchSummaries = [];
  for (const batch of batches) {
    const batchSummary = await generateText({
      system: `
        You are a software engineer. You are working on a project. you need to summarize the work till now and provide a summary of the chat till now.

        Please only use the following format to generate the summary:
---
# Project Overview
- **Project**: {project_name} - {brief_description}
- **Current Phase**: {phase}
- **Tech Stack**: {languages}, {frameworks}, {key_dependencies}
- **Environment**: {critical_env_details}

# Conversation Context
- **Last Topic**: {main_discussion_point}
- **Key Decisions**: {important_decisions_made}
- **User Context**:
  - Technical Level: {expertise_level}
  - Preferences: {coding_style_preferences}
  - Communication: {preferred_explanation_style}

# Implementation Status
## Current State
- **Active Feature**: {feature_in_development}
- **Progress**: {what_works_and_what_doesn't}
- **Blockers**: {current_challenges}

## Code Evolution
- **Recent Changes**: {latest_modifications}
- **Working Patterns**: {successful_approaches}
- **Failed Approaches**: {attempted_solutions_that_failed}

# Requirements
- **Implemented**: {completed_features}
- **In Progress**: {current_focus}
- **Pending**: {upcoming_features}
- **Technical Constraints**: {critical_constraints}

# Critical Memory
- **Must Preserve**: {crucial_technical_context}
- **User Requirements**: {specific_user_needs}
- **Known Issues**: {documented_problems}

# Next Actions
- **Immediate**: {next_steps}
- **Open Questions**: {unresolved_issues}

---
Note:
4. Keep entries concise and focused on information needed for continuity
---
        `,
      prompt: `
Here is the previous summary of the chat:
<old_summary>
${summaryText} 
</old_summary>

Below is the chat after that:
---
<new_chats>
${batch
  .map((x) => `---\n[${x.role}] ${extractKeyInformation(x)}\n---`)
  .join('\n')}
</new_chats>
---

Please provide a summary of the chat till now including the historical summary of the chat.
`,
      model: provider.getModelInstance({
        model: currentModel,
        serverEnv,
        apiKeys,
        providerSettings,
      }),
    });
    
    batchSummaries.push(batchSummary.text);
  }

  // Fusion des résumés de lots
  const finalSummary = batchSummaries.length > 1 
    ? await generateText({
        system: "You are a software engineer tasked with merging multiple summaries into a single coherent summary.",
        prompt: `Merge these summaries into a single summary:\n\n${batchSummaries.join('\n\n')}`,
        model: provider.getModelInstance({
          model: currentModel,
          serverEnv,
          apiKeys,
          providerSettings,
        }),
      })
    : { text: batchSummaries[0] };

  // Mise en cache du résumé
  summaryCache.set(cacheKey, {
    summary: finalSummary.text,
    timestamp: Date.now(),
    messageHash: currentHash
  });

  if (onFinish) {
    onFinish(finalSummary as GenerateTextResult<Record<string, CoreTool<any, any>>, never>);
  }

  return finalSummary.text;
}
