import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { getApiKeysFromCookie } from '~/lib/api/cookies';
import type { ProviderInfo } from '~/types/model';
import { executeAgent, type AgentToolConfig } from '~/lib/.server/agent/execute-agent';

export const action = async ({ request }: ActionFunctionArgs) => {
  const {
    message,
    model,
    provider,
    tools,
  }: {
    message: string;
    model: string;
    provider: ProviderInfo;
    tools?: AgentToolConfig[];
  } = await request.json();

  const apiKeys = getApiKeysFromCookie(request.headers.get('Cookie'));
  const apiKey = apiKeys?.[provider.name];

  if (!apiKey) {
    throw new Response('Missing API key', { status: 400 });
  }

  const output = await executeAgent({
    message,
    model,
    provider,
    apiKey,
    tools,
  });

  return json({ output });
};
