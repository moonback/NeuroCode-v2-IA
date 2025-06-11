import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from 'langchain/tools';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import type { ProviderInfo } from '~/types/model';
import { PROVIDER_LIST } from '~/utils/constants';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { message, model, provider } = await request.json<{
    message: string;
    model: string;
    provider: ProviderInfo;
  }>();

  const providerInfo = PROVIDER_LIST.find((p) => p.name === provider.name);

  if (!providerInfo) {
    throw new Response('Invalid provider', { status: 400 });
  }

  const apiKeys = getApiKeysFromCookie(request.headers.get('Cookie'));
  const apiKey = apiKeys?.[provider.name];

  if (!apiKey) {
    throw new Response('Missing API key', { status: 400 });
  }

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    baseURL: providerInfo.config.baseUrl,
  });

  const tools = [
    new DynamicTool({
      name: 'ping',
      description: 'Simple tool that returns pong.',
      func: async () => 'pong',
    }),
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, llm, {
    agentType: 'openai-functions',
    maxIterations: 5,
  });

  const result = await executor.invoke({ input: message });

  return json({ output: result.output });
};
