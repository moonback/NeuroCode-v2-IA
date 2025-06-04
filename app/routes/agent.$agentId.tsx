import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { agentService } from '~/lib/services/agentService';
import type { AgentProfile, AgentChatThread } from '~/utils/types';

export async function loader({ params }: LoaderFunctionArgs) {
  const { agentId } = params;
  
  if (!agentId) {
    throw new Response('Agent ID is required', { status: 400 });
  }

  try {
    const agent = await agentService.getAgentProfile(agentId);
    if (!agent) {
      throw new Response('Agent not found', { status: 404 });
    }

    const threads = await agentService.getAgentThreads(agentId);
    
    return json({ agent, threads });
  } catch (error) {
    console.error('Error loading agent:', error);
    throw new Response('Error loading agent', { status: 500 });
  }
}

export default function AgentPage() {
  const { agent, threads } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get('threadId');
  const [selectedThread, setSelectedThread] = useState<AgentChatThread | null>(null);

  useEffect(() => {
    if (threadId && threads) {
      const thread = threads.find(t => t.id === threadId);
      setSelectedThread(thread || null);
    }
  }, [threadId, threads]);

  return (
    <div className="flex h-screen bg-bolt-elements-background-depth-1">
      {/* Sidebar with threads */}
      <div className="w-80 bg-bolt-elements-background-depth-2 border-r border-bolt-elements-borderColor">
        <div className="p-4 border-b border-bolt-elements-borderColor">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: agent.color }}
            >
              {agent.avatar}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-bolt-elements-textPrimary">
                {agent.name}
              </h1>
              <p className="text-sm text-bolt-elements-textSecondary">
                {agent.description}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h2 className="text-sm font-medium text-bolt-elements-textSecondary mb-3">
            Conversations ({threads.length})
          </h2>
          
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-bolt-elements-textSecondary">
                Aucune conversation pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedThread?.id === thread.id
                      ? 'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColorActive'
                      : 'hover:bg-bolt-elements-background-depth-3'
                  }`}
                >
                  <div className="font-medium text-bolt-elements-textPrimary truncate">
                    {thread.title || 'Conversation sans titre'}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary mt-1">
                    {new Date(thread.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <div className="flex-1 flex flex-col">
            {/* Thread header */}
            <div className="p-4 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
                {selectedThread.title || 'Conversation sans titre'}
              </h2>
              <p className="text-sm text-bolt-elements-textSecondary">
                Créé le {new Date(selectedThread.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            {/* Thread content */}
            <div className="flex-1 p-4">
              {selectedThread.messages && selectedThread.messages.length > 0 ? (
                <div className="space-y-4">
                  {selectedThread.messages.map((message, index) => (
                    <div key={index} className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
                      <div className="font-medium text-bolt-elements-textPrimary mb-2">
                        {message.role === 'user' ? 'Vous' : agent.name}
                      </div>
                      <div className="text-bolt-elements-textPrimary whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-bolt-elements-textSecondary">
                    Cette conversation ne contient pas encore de messages.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-medium mx-auto mb-4"
                style={{ backgroundColor: agent.color }}
              >
                {agent.avatar}
              </div>
              <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-2">
                {agent.name}
              </h2>
              <p className="text-bolt-elements-textSecondary mb-4 max-w-md">
                {agent.description}
              </p>
              {threads.length > 0 ? (
                <p className="text-sm text-bolt-elements-textSecondary">
                  Sélectionnez une conversation dans la barre latérale pour commencer.
                </p>
              ) : (
                <p className="text-sm text-bolt-elements-textSecondary">
                  Aucune conversation disponible pour cet agent.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}