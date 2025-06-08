import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSupabaseConnection } from '~/lib/hooks/useSupabaseConnection';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { chatId } from '~/lib/persistence/useChatHistory';
import { fetchSupabaseStats } from '~/lib/stores/supabase';
import { Button } from '~/components/ui/Button';

export default function SupabaseConnection() {
  const {
    connection: supabaseConn,
    connecting,
    fetchingStats,
    isProjectsExpanded,
    setIsProjectsExpanded,
    handleConnect,
    handleDisconnect,
    selectProject,
    handleCreateProject,
    updateToken,
    isConnected,
    fetchProjectApiKeys,
  } = useSupabaseConnection();

  const currentChatId = useStore(chatId);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isConnected && currentChatId) {
      const savedProjectId = localStorage.getItem(`supabase-project-${currentChatId}`);

      if (!savedProjectId && supabaseConn.selectedProjectId) {
        localStorage.setItem(`supabase-project-${currentChatId}`, supabaseConn.selectedProjectId);
      } else if (savedProjectId && savedProjectId !== supabaseConn.selectedProjectId) {
        selectProject(savedProjectId);
      }
    }
  }, [isConnected, currentChatId]);

  useEffect(() => {
    if (currentChatId && supabaseConn.selectedProjectId) {
      localStorage.setItem(`supabase-project-${currentChatId}`, supabaseConn.selectedProjectId);
    } else if (currentChatId && !supabaseConn.selectedProjectId) {
      localStorage.removeItem(`supabase-project-${currentChatId}`);
    }
  }, [currentChatId, supabaseConn.selectedProjectId]);

  useEffect(() => {
    if (isConnected && supabaseConn.token) {
      fetchSupabaseStats(supabaseConn.token).catch(console.error);
    }
  }, [isConnected, supabaseConn.token]);

  useEffect(() => {
    if (isConnected && supabaseConn.selectedProjectId && supabaseConn.token && !supabaseConn.credentials) {
      fetchProjectApiKeys(supabaseConn.selectedProjectId).catch(console.error);
    }
  }, [isConnected, supabaseConn.selectedProjectId, supabaseConn.token, supabaseConn.credentials]);

  return (
    <motion.div
      className="bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              className="w-6 h-6"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/supabase"
              alt="Supabase Logo"
              loading="lazy"
            />
            <div>
              <h3 className="text-base font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                Supabase
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
                Base de données et backend en tant que service
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <div 
                className="w-2 h-2 rounded-full bg-green-500 animate-pulse" 
                title="Connecté à Supabase"
                aria-label="Indicateur de statut de connexion"
              />
            )}
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <div
                className={classNames(
                  'i-ph:caret-down w-4 h-4 transition-transform duration-200',
                  isExpanded ? 'rotate-180' : ''
                )}
              />
              {isExpanded ? 'Réduire' : 'Configurer'}
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-4">
          <div className={classNames(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
            isConnected
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
          )}>
            <div className={classNames(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            )} />
            <span>
              {isConnected ? 'Connecté' : 'Non connecté'}
              {isConnected && supabaseConn.user?.email && (
                <span className="ml-2 text-xs">({supabaseConn.user.email})</span>
              )}
            </span>
          </div>
        </div>

        {/* Expanded Configuration */}
        {isExpanded && (
          <div className="space-y-4">
            {!isConnected ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="supabase-token" className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    Token d'Accès Supabase
                  </label>
                  <input
                    id="supabase-token"
                    type="password"
                    value={supabaseConn.token}
                    onChange={(e) => updateToken(e.target.value)}
                    disabled={connecting}
                    placeholder="Entrez votre token d'accès Supabase"
                    className={classNames(
                      'w-full px-3 py-2 rounded-lg text-sm',
                      'bg-bolt-elements-background dark:bg-bolt-elements-background',
                      'border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary',
                      'placeholder-bolt-elements-textTertiary dark:placeholder-bolt-elements-textTertiary',
                      'focus:outline-none focus:ring-2 focus:ring-[#3ECF8E] focus:ring-opacity-50',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-200'
                    )}
                  />
                  <div className="mt-2 text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
                    <a
                      href="https://app.supabase.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3ECF8E] hover:underline inline-flex items-center gap-1 transition-colors duration-200"
                    >
                      Obtenir votre token
                      <div className="i-ph:arrow-square-out w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleConnect}
                    disabled={connecting || !supabaseConn.token}
                    className={classNames(
                      'flex items-center gap-2',
                      'bg-[#3ECF8E] text-white',
                      'hover:bg-[#3BBF84] active:bg-[#35AB77]',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {connecting ? (
                      <>
                        <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <div className="i-ph:plug-charging w-4 h-4" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-4 p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor">
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                      {supabaseConn.user?.email}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
                      Rôle: {supabaseConn.user?.role}
                    </p>
                  </div>
                </div>

                {/* Projects Section */}
                {fetchingStats ? (
                  <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
                    <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                    Récupération des projets...
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                        className="bg-transparent text-left text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary flex items-center gap-2 hover:text-[#3ECF8E] transition-colors duration-200"
                      >
                        <div className="i-ph:database w-4 h-4" />
                        Vos Projets ({supabaseConn.stats?.totalProjects || 0})
                        <div
                          className={classNames(
                            'i-ph:caret-down w-4 h-4 transition-transform duration-200',
                            isProjectsExpanded ? 'rotate-180' : ''
                          )}
                        />
                      </button>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => fetchSupabaseStats(supabaseConn.token)}
                          variant="outline"
                          className="px-2 py-1 text-xs flex items-center gap-1"
                          title="Actualiser la liste des projets"
                        >
                          <div className="i-ph:arrows-clockwise w-3 h-3" />
                          Actualiser
                        </Button>
                        <Button
                          onClick={() => handleCreateProject()}
                          className="px-2 py-1 text-xs bg-[#3ECF8E] text-white hover:bg-[#3BBF84] flex items-center gap-1"
                        >
                          <div className="i-ph:plus w-3 h-3" />
                          Nouveau Projet
                        </Button>
                      </div>
                    </div>

                    {isProjectsExpanded && (
                      <>
                        {!supabaseConn.selectedProjectId && (
                          <div className="mb-3 p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor">
                            Sélectionnez un projet ou créez-en un nouveau pour ce chat
                          </div>
                        )}

                        {supabaseConn.stats?.projects?.length ? (
                          <div className="grid gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {supabaseConn.stats.projects.map((project) => (
                              <div
                                key={project.id}
                                className="block p-3 rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor hover:border-[#3ECF8E] dark:hover:border-[#3ECF8E] transition-colors duration-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary flex items-center gap-1">
                                      <div className="i-ph:database w-3 h-3 text-[#3ECF8E]" />
                                      {project.name}
                                    </h5>
                                    <div className="text-xs text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mt-1">
                                      {project.region}
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => selectProject(project.id)}
                                    variant={supabaseConn.selectedProjectId === project.id ? 'default' : 'outline'}
                                    className={classNames(
                                      'px-3 py-1 text-xs transition-colors duration-200',
                                      supabaseConn.selectedProjectId === project.id
                                        ? 'bg-[#3ECF8E] text-white'
                                        : 'hover:bg-[#3ECF8E] hover:text-white'
                                    )}
                                  >
                                    {supabaseConn.selectedProjectId === project.id ? (
                                      <span className="flex items-center gap-1">
                                        <div className="i-ph:check w-3 h-3" />
                                        Sélectionné
                                      </span>
                                    ) : (
                                      'Sélectionner'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary flex items-center gap-2 p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor">
                            <div className="i-ph:info w-4 h-4" />
                            Aucun projet trouvé
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Disconnect Button */}
                <div className="flex justify-end pt-4 border-t border-bolt-elements-borderColor dark:border-bolt-elements-borderColor">
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                  >
                    <div className="i-ph:plugs w-4 h-4" />
                    Se déconnecter
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}