import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { 
  agentsListStore, 
  agentsLoadingStore,
  agentsErrorStore,
  initializeAgents
} from '~/lib/stores/agents';
import { agentsApi } from '~/lib/api/agentsApi';
import type { AgentProfile, AgentChatThread } from '~/utils/types';

interface AgentStats {
  totalAgents: number;
  customAgents: number;
  defaultAgents: number;
  totalThreads: number;
  activeThreads: number;
  mostUsedAgent: AgentProfile | null;
  recentActivity: Array<{
    agentId: string;
    agentName: string;
    threadCount: number;
    lastActivity: string;
  }>;
}

interface AgentDashboardProps {
  onViewAgent: (agent: AgentProfile) => void;
  onBack: () => void;
}

export default function AgentDashboard({ onViewAgent, onBack }: AgentDashboardProps) {
  const agents = useStore(agentsListStore);
  const loading = useStore(agentsLoadingStore);
  const error = useStore(agentsErrorStore);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    initializeAgents();
  }, []);

  useEffect(() => {
    if (agents.length > 0) {
      calculateStats();
    }
  }, [agents]);

  const calculateStats = async () => {
    setLoadingStats(true);
    try {
      const defaultAgentIds = ['code_agent', 'doc_agent', 'design_agent'];
      const customAgents = agents.filter(agent => !defaultAgentIds.includes(agent.id));
      const defaultAgents = agents.filter(agent => defaultAgentIds.includes(agent.id));

      // Récupérer les threads pour chaque agent
      const agentThreadsPromises = agents.map(async (agent) => {
        try {
          const threads = await agentsApi.getAgentThreads(agent.id);
          return {
            agent,
            threads,
            threadCount: threads.length,
            lastActivity: threads.length > 0 
              ? Math.max(...threads.map(t => new Date(t.updatedAt).getTime()))
              : 0
          };
        } catch (error) {
          return {
            agent,
            threads: [],
            threadCount: 0,
            lastActivity: 0
          };
        }
      });

      const agentThreadsData = await Promise.all(agentThreadsPromises);
      const totalThreads = agentThreadsData.reduce((sum, data) => sum + data.threadCount, 0);
      const activeThreads = agentThreadsData.filter(data => 
        data.lastActivity > Date.now() - (7 * 24 * 60 * 60 * 1000) // Actif dans les 7 derniers jours
      ).length;

      // Agent le plus utilisé
      const mostUsedAgentData = agentThreadsData.reduce((max, current) => 
        current.threadCount > max.threadCount ? current : max
      );

      // Activité récente
      const recentActivity = agentThreadsData
        .filter(data => data.threadCount > 0)
        .sort((a, b) => b.lastActivity - a.lastActivity)
        .slice(0, 5)
        .map(data => ({
          agentId: data.agent.id,
          agentName: data.agent.name,
          threadCount: data.threadCount,
          lastActivity: new Date(data.lastActivity).toISOString()
        }));

      setStats({
        totalAgents: agents.length,
        customAgents: customAgents.length,
        defaultAgents: defaultAgents.length,
        totalThreads,
        activeThreads,
        mostUsedAgent: mostUsedAgentData.threadCount > 0 ? mostUsedAgentData.agent : null,
        recentActivity
      });
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
          <div className="i-ph:spinner animate-spin text-xl" />
          <span>Chargement du tableau de bord...</span>
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
            Tableau de Bord des Agents
          </h2>
          <p className="text-sm text-bolt-elements-textSecondary mt-1">
            Vue d'ensemble de l'utilisation et des performances de vos agents IA
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
        >
          <div className="i-ph:arrow-left text-lg" />
          <span>Retour</span>
        </button>
      </div>

      {loadingStats ? (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
            <div className="i-ph:spinner animate-spin text-xl" />
            <span>Calcul des statistiques...</span>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <div className="i-ph:robot text-white text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                    {stats.totalAgents}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary">
                    Agents Total
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <div className="i-ph:user-plus text-white text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                    {stats.customAgents}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary">
                    Agents Personnalisés
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <div className="i-ph:chat-circle text-white text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                    {stats.totalThreads}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary">
                    Conversations Total
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <div className="i-ph:lightning text-white text-xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                    {stats.activeThreads}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary">
                    Actifs (7 jours)
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Most Used Agent */}
          {stats.mostUsedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-6"
            >
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">
                Agent le Plus Utilisé
              </h3>
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg"
                  style={{ backgroundColor: stats.mostUsedAgent.color || '#3B82F6' }}
                >
                  {stats.mostUsedAgent.avatar || stats.mostUsedAgent.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-bolt-elements-textPrimary">
                    {stats.mostUsedAgent.name}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary">
                    {stats.mostUsedAgent.description}
                  </div>
                  <div className="text-xs text-bolt-elements-textSecondary mt-1">
                    Modèle: {stats.mostUsedAgent.model} • Fournisseur: {stats.mostUsedAgent.provider}
                  </div>
                </div>
                <button
                  onClick={() => onViewAgent(stats.mostUsedAgent!)}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors"
                >
                  Voir l'agent
                </button>
              </div>
            </motion.div>
          )}

          {/* Recent Activity */}
          {stats.recentActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-6"
            >
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">
                Activité Récente
              </h3>
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => {
                  const agent = agents.find(a => a.id === activity.agentId);
                  return (
                    <div key={activity.agentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                          style={{ backgroundColor: agent?.color || '#3B82F6' }}
                        >
                          {agent?.avatar || activity.agentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-bolt-elements-textPrimary text-sm">
                            {activity.agentName}
                          </div>
                          <div className="text-xs text-bolt-elements-textSecondary">
                            {activity.threadCount} conversation{activity.threadCount > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">
                        {new Date(activity.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <div className="text-center p-8 text-bolt-elements-textSecondary">
          Aucune donnée disponible
        </div>
      )}
    </div>
  );
}