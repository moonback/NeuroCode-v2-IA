import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { 
  selectedAgentStore, 
  activeThreadStore, 
  agentThreadsStore,
  agentsListStore
} from '~/lib/stores/agents';
import { useAgentChatHistory } from '~/lib/hooks/useAgentChatHistory';
import type { AgentProfile, AgentChatThread } from '~/utils/types';

interface AgentChatSelectorProps {
  onClose?: () => void;
}

export default function AgentChatSelector({ onClose }: AgentChatSelectorProps) {
  const selectedAgent = useStore(selectedAgentStore);
  const activeThread = useStore(activeThreadStore);
  const agentThreads = useStore(agentThreadsStore);
  const agents = useStore(agentsListStore);
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    createNewChat, 
    switchToThread, 
    deleteThread, 
    getThreadTitle 
  } = useAgentChatHistory();

  const handleCreateNewThread = async () => {
    await createNewChat();
    setIsOpen(false);
  };

  const handleSwitchThread = async (threadId: string) => {
    await switchToThread(threadId);
    setIsOpen(false);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce thread ?')) {
      await deleteThread(threadId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center p-4 text-bolt-elements-textSecondary">
        <div className="text-center">
          <div className="i-ph:robot text-4xl mb-2" />
          <p>Aucun agent sélectionné</p>
          <p className="text-sm">Sélectionnez un agent dans les paramètres</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Agent Header */}
      <div 
        className={classNames(
          'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
          'bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3',
          'border border-bolt-elements-borderColor'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: selectedAgent.color || '#6B7280' }}
        >
          {selectedAgent.avatar || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-bolt-elements-textPrimary truncate">
            {selectedAgent.name}
          </div>
          <div className="text-xs text-bolt-elements-textSecondary truncate">
            {getThreadTitle()}
          </div>
        </div>
        <div className={classNames(
          'transition-transform duration-200',
          isOpen ? 'rotate-180' : 'rotate-0'
        )}>
          <div className="i-ph:caret-down text-bolt-elements-textSecondary" />
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={classNames(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor',
              'shadow-lg max-h-80 overflow-y-auto'
            )}
          >
            {/* New Thread Button */}
            <button
              onClick={handleCreateNewThread}
              className={classNames(
                'w-full flex items-center gap-3 p-3 text-left transition-colors',
                'hover:bg-bolt-elements-background-depth-2',
                'border-b border-bolt-elements-borderColor'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-bolt-elements-button-primary-background flex items-center justify-center">
                <div className="i-ph:plus text-white" />
              </div>
              <div>
                <div className="font-medium text-bolt-elements-textPrimary">
                  Nouveau thread
                </div>
                <div className="text-xs text-bolt-elements-textSecondary">
                  Commencer une nouvelle conversation
                </div>
              </div>
            </button>

            {/* Thread List */}
            <div className="max-h-60 overflow-y-auto">
              {agentThreads.length === 0 ? (
                <div className="p-4 text-center text-bolt-elements-textSecondary">
                  <div className="i-ph:chat-circle text-2xl mb-2" />
                  <p className="text-sm">Aucun thread disponible</p>
                </div>
              ) : (
                agentThreads.map((thread) => {
                  const isActive = activeThread?.id === thread.id;
                  const threadTitle = thread.title || 
                    (thread.messages.find(m => m.role === 'user')?.content as string)?.slice(0, 40) + '...' ||
                    `Thread ${thread.id.slice(0, 8)}`;
                  
                  return (
                    <div
                      key={thread.id}
                      className={classNames(
                        'flex items-center gap-3 p-3 cursor-pointer transition-colors group',
                        isActive 
                          ? 'bg-bolt-elements-button-primary-background/10 border-l-2 border-bolt-elements-button-primary-background'
                          : 'hover:bg-bolt-elements-background-depth-2'
                      )}
                      onClick={() => handleSwitchThread(thread.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-bolt-elements-background-depth-3 flex items-center justify-center">
                        <div className="i-ph:chat-circle text-bolt-elements-textSecondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={classNames(
                          'font-medium truncate',
                          isActive ? 'text-bolt-elements-button-primary-background' : 'text-bolt-elements-textPrimary'
                        )}>
                          {threadTitle}
                        </div>
                        <div className="text-xs text-bolt-elements-textSecondary">
                          {thread.lastMessageAt ? formatDate(thread.lastMessageAt) : 'Pas de messages'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {thread.messages.length > 0 && (
                          <span className="text-xs text-bolt-elements-textTertiary">
                            {thread.messages.length}
                          </span>
                        )}
                        {!isActive && (
                          <button
                            onClick={(e) => handleDeleteThread(e, thread.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-all"
                          >
                            <div className="i-ph:trash text-xs" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}