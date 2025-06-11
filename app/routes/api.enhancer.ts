import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

const logger = createScopedLogger('api.enhancher');

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, model, provider, description, type, context: userContext, complexity, outputType, language, tone, databaseType, features, architecture, deployment, customPrompt } = await request.json<{
    message?: string;
    description?: string;
    context?: string;
    complexity?: string;
    outputType?: string;
    language?: string;
    tone?: string;
    databaseType?: string;
    features?: string;
    architecture?: string;
    deployment?: string;
    type?: 'enhance' | 'structured_prompt';
    model: string;
    provider: ProviderInfo;
    apiKeys?: Record<string, string>;
    customPrompt?: string;
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

  // Déterminer le contenu et le prompt selon le type
  let userContent: string;
  let systemPrompt: string;

  if (type === 'structured_prompt' && description) {
    // Génération de prompt structuré à partir d'une description
    const contextSection = userContext ? `\n\n<additional_context>\n${userContext}\n</additional_context>` : '';
    
    // Construction de la section spécifications techniques
    const technicalSpecs = [];
    if (databaseType) technicalSpecs.push(`Database: ${databaseType}`);
    if (architecture) technicalSpecs.push(`Architecture: ${architecture}`);
    if (deployment) technicalSpecs.push(`Deployment: ${deployment}`);
    if (features) technicalSpecs.push(`Key Features: ${features}`);
    
    const technicalSection = technicalSpecs.length > 0 ? 
      `\n\n<technical_specifications>\n${technicalSpecs.join('\n')}\n</technical_specifications>` : '';
    
    userContent = `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n` +
      stripIndents`
        You are a professional prompt engineer and software architect.
        Your task is to create a detailed, structured, and professional prompt based on the provided description and parameters.
        
        Transform the following description into a comprehensive, actionable prompt:
        
        <description>
        ${description}
        </description>${contextSection}${technicalSection}
        
        <parameters>
        - Complexity Level: ${complexity || 'intermediate'}
        - Output Type: ${outputType || 'detailed'}
        - Response Language: ${language || 'french'}
        - Tone: ${tone || 'professional'}
        </parameters>
        
        Guidelines for creating the structured prompt:
        - Adapt complexity to the specified level (${complexity || 'intermediate'})
        - Format output according to type: ${outputType || 'detailed'}
        - Write in ${language || 'french'} language
        - Use a ${tone || 'professional'} tone throughout
        - Be specific and detailed about requirements
        - Include technical specifications when relevant
        - Add context about best practices
        - Specify expected deliverables
        - Include error handling considerations
        - Mention code quality standards
        - Add relevant constraints and assumptions
        - Structure the prompt logically
        ${userContext ? '- Incorporate the additional context provided' : ''}
        ${technicalSpecs.length > 0 ? '- Include technical specifications in your recommendations' : ''}
        ${databaseType ? `- Consider ${databaseType} database specifics and best practices` : ''}
        ${architecture ? `- Follow ${architecture} architectural patterns and principles` : ''}
        ${deployment ? `- Include ${deployment} deployment considerations and optimizations` : ''}
        ${features ? '- Address the specified key features and their implementation' : ''}
        
        IMPORTANT: Your response must ONLY contain the enhanced structured prompt text.
        Do not include any explanations, metadata, or wrapper tags.
        Ensure the response follows the specified language, tone, and complexity level.
      `;
    
    systemPrompt = 'You are a senior software architect and prompt engineer. Create detailed, professional prompts that will help developers build high-quality software solutions. Focus on clarity, completeness, and actionability.';
  } else {
    // Amélioration de prompt existant (comportement original)
    userContent = `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n` +
      stripIndents`
        You are a professional prompt engineer specializing in crafting precise, effective prompts.
        Your task is to enhance prompts by making them more specific, actionable, and effective.

        I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

        For valid prompts:
        - Make instructions explicit and unambiguous
        - Add relevant context and constraints
        - Remove redundant information
        - Maintain the core intent
        - Ensure the prompt is self-contained
        - Use professional language

        For invalid or unclear prompts:
        - Respond with clear, professional guidance
        - Keep responses concise and actionable
        - Maintain a helpful, constructive tone
        - Focus on what the user should provide
        - Use a standard template for consistency

        IMPORTANT: Your response must ONLY contain the enhanced prompt text.
        Do not include any explanations, metadata, or wrapper tags.

        <original_prompt>
          ${message || ''}
        </original_prompt>
      `;
    
    systemPrompt = 'You are a senior software principal architect, you should help the user analyse the user query and enrich it with the necessary context and constraints to make it more specific, actionable, and effective. You should also ensure that the prompt is self-contained and uses professional language. Your response should ONLY contain the enhanced prompt text. Do not include any explanations, metadata, or wrapper tags.';
  }

  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      env: context.cloudflare?.env as any,
      apiKeys,
      providerSettings,
      customPrompt,
      options: {
        system: systemPrompt,

        /*
         * onError: (event) => {
         *   throw new Response(null, {
         *     status: 500,
         *     statusText: 'Internal Server Error',
         *   });
         * }
         */
      },
    });

    // Handle streaming errors in a non-blocking way
    (async () => {
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'error') {
            const error: any = part.error;
            logger.error('Streaming error:', error);
            break;
          }
        }
      } catch (error) {
        logger.error('Error processing stream:', error);
      }
    })();

    // Return the text stream directly since it's already text data
    return new Response(result.textStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
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
