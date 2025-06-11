import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from 'langchain/tools';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import type { ProviderInfo } from '~/types/model';
import { PROVIDER_LIST } from '~/utils/constants';

export interface AgentToolConfig {
  name: string;
  description: string;
}

function getBuiltInTool(config: AgentToolConfig): DynamicTool {
  switch (config.name) {
    case 'ping':
      return new DynamicTool({
        name: 'ping',
        description: config.description || 'Simple ping tool',
        func: async () => 'pong',
      });
    case 'echo':
      return new DynamicTool({
        name: 'echo',
        description: config.description || 'Echo input',
        func: async (input) => String(input),
      });
    case 'time':
      return new DynamicTool({
        name: 'time',
        description: config.description || 'Current ISO time',
        func: async () => new Date().toISOString(),
      });
    default:
      return new DynamicTool({
        name: config.name,
        description: config.description,
        func: async () => `tool ${config.name} not implemented`,
      });
  }
}

export async function executeAgent(options: {
  message: string;
  model: string;
  provider: ProviderInfo;
  apiKey: string;
  tools?: AgentToolConfig[];
}): Promise<string> {
  const { message, model, provider, apiKey, tools = [{ name: 'ping', description: 'ping tool' }] } = options;

  const providerInfo = PROVIDER_LIST.find((p) => p.name === provider.name);
  if (!providerInfo) {
    throw new Error('Invalid provider');
  }

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    baseURL: providerInfo.config.baseUrl,
  });

  const toolInstances = tools.map((t) => getBuiltInTool(t));

  const executor = await initializeAgentExecutorWithOptions(toolInstances, llm, {
    agentType: 'openai-functions',
    maxIterations: 5,
  });

  const result = await executor.invoke({ input: message });
  return result.output;
}
