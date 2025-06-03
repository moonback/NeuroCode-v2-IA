import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { 
  agentsListStore, 
  selectedAgentStore, 
  agentsLoadingStore,
  agentsErrorStore,
  selectAgent,
  createAgent,
  deleteAgent,
  initializeAgents
} from '~/lib/stores/agents';
import type { AgentProfile } from '~/utils/types';
import { toast } from 'react-toastify';

interface AgentSelectionProps {
  onConfigureAgent: (agent: AgentProfile) => void;
  onCreateAgent: () => void;
}

export default function AgentSelection({ onConfigureAgent, onCreateAgent }: AgentSelectionProps) {
  const agents = useStore(agentsListStore);
  const selectedAgent = useStore(selectedAgentStore);
  const loading = useStore(agentsLoadingStore);
  const error = useStore(agentsErrorStore);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);

  useEffect(() => {
    initializeAgents();
  }, []);

  const handleSelectAgent = async (agentId: string) => {
    try {
      await selectAgent(agentId);
      toast.success('Agent sélectionné');
    } catch (error) {
      toast.error('Erreur lors de la sélection de l\'agent');
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'agent "${agentName}" ?`)) {
      return;
    }

    setDeletingAgent(agentId);
    try {
      await deleteAgent(agentId);
      toast.success('Agent supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'agent');
    } finally {
      setDeletingAgent(null);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
          <div className="i-ph:spinner animate-spin text-xl" />
          <span>Chargement des agents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <div className="i-ph:warning-circle text-xl" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
            Agents IA
          </h2>
          <p className="text-sm text-bolt-elements-textSecondary mt-1">
            Sélectionnez et gérez vos agents IA spécialisés
          </p>
        </div>
        <button
          onClick={onCreateAgent}
          className={classNames(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-bolt-elements-button-primary-background',
            'text-bolt-elements-button-primary-text',
            'hover:bg-bolt-elements-button-primary-backgroundHover',
            'transition-colors duration-200'
          )}
        >
          <div className="i-ph:plus text-lg" />
          <span>Créer un agent</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={classNames(
                'relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                'hover:shadow-lg hover:scale-[1.02]',
                selectedAgent?.id === agent.id
                  ? 'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background/5'
                  : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:border-bolt-elements-button-primary-background/50'
              )}
              onClick={() => handleSelectAgent(agent.id)}
            >
              {/* Agent Avatar */}
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: agent.color || '#6B7280' }}
                >
                  {agent.avatar || '🤖'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-bolt-elements-textPrimary truncate">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-bolt-elements-textSecondary">
                    {agent.model}
                  </p>
                </div>
              </div>

              {/* Agent Description */}
              <p className="text-sm text-bolt-elements-textSecondary mb-4 line-clamp-2">
                {agent.description}
              </p>

              {/* Agent Tools */}
              {agent.tools && agent.tools.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-1 text-xs rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary"
                      >
                        {tool}
                      </span>
                    ))}
                    {agent.tools.length > 3 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary">
                        +{agent.tools.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedAgent?.id === agent.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 rounded-full bg-bolt-elements-button-primary-background" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-bolt-elements-borderColor">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfigureAgent(agent);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                >
                  <div className="i-ph:gear-six" />
                  <span>Configurer</span>
                </button>

                {/* Delete button - only for custom agents */}
                {!['code_agent', 'doc_agent', 'debug_agent', 'ui_agent'].includes(agent.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAgent(agent.id, agent.name);
                    }}
                    disabled={deletingAgent === agent.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingAgent === agent.id ? (
                      <div className="i-ph:spinner animate-spin" />
                    ) : (
                      <div className="i-ph:trash" />
                    )}
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {agents.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="i-ph:robot text-6xl text-bolt-elements-textTertiary mb-4" />
          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">
            Aucun agent disponible
          </h3>
          <p className="text-bolt-elements-textSecondary mb-4">
            Créez votre premier agent IA pour commencer
          </p>
          <button
            onClick={onCreateAgent}
            className={classNames(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-bolt-elements-button-primary-background',
              'text-bolt-elements-button-primary-text',
              'hover:bg-bolt-elements-button-primary-backgroundHover',
              'transition-colors duration-200'
            )}
          >
            <div className="i-ph:plus text-lg" />
            <span>Créer un agent</span>
          </button>
        </div>
      )}
    </div>
  );
}