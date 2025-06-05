import { Fragment, memo, useState, useMemo } from 'react';
import { Markdown } from '~/components/chat/Markdown';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';

interface ContextViewProps {
  chatSummary?: string;
  codeContext?: string[];
}

interface FileStats {
  totalFiles: number;
  fileTypes: Record<string, number>;
  totalSize?: number;
}

function openArtifactInWorkbench(filePath: string) {
  let normalizedPath = filePath;

  if (normalizedPath.startsWith(WORK_DIR)) {
    normalizedPath = filePath.replace(WORK_DIR, '');
  }

  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1);
  }

  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${normalizedPath}`);
}

export const ContextView = memo(({ chatSummary, codeContext }: ContextViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentView, setCurrentView] = useState<'summary' | 'files'>('summary'); // Nouvel état pour gérer la vue

  // Calcul des statistiques des fichiers
  const fileStats: FileStats = useMemo(() => {
    if (!codeContext || codeContext.length === 0) {
      return { totalFiles: 0, fileTypes: {} };
    }

    const stats: FileStats = {
      totalFiles: codeContext.length,
      fileTypes: {}
    };

    codeContext.forEach(filePath => {
      const extension = filePath.split('.').pop()?.toLowerCase() || 'other';
      stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
    });

    return stats;
  }, [codeContext]);

  // Filtrage des fichiers
  const filteredFiles = useMemo(() => {
    if (!codeContext) return [];

    return codeContext.filter(filePath => {
      const normalizedPath = filePath.replace(WORK_DIR, '').replace(/^\//, '');
      const matchesSearch = normalizedPath.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedFileType === 'all') return matchesSearch;
      
      const extension = normalizedPath.split('.').pop()?.toLowerCase() || 'other';
      return matchesSearch && extension === selectedFileType;
    });
  }, [codeContext, searchTerm, selectedFileType]);

  // Types de fichiers uniques pour le filtre
  const uniqueFileTypes = useMemo(() => {
    return Object.keys(fileStats.fileTypes).sort();
  }, [fileStats]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2/50">
      {/* Barre de navigation pour basculer entre les vues */}
      {chatSummary && codeContext && codeContext.length > 0 && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex gap-2 p-1 bg-bolt-elements-background-depth-3 rounded-lg border border-bolt-elements-borderColor">
            <button
              onClick={() => setCurrentView('summary')}
              className={`flex-1 bg-bolt-elements-background-depth-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'summary'
                  ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text shadow-sm'
                  : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <div className="i-ph:chat-circle-text text-base" />
                Résumé
              </div>
            </button>
            <button
              onClick={() => setCurrentView('files')}
              className={`flex-1 bg-bolt-elements-background-depth-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'files'
                  ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text shadow-sm'
                  : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <div className="i-ph:file-code text-base" />
                Fichiers ({codeContext.length})
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Affichage conditionnel basé sur la vue sélectionnée */}
        {chatSummary && (currentView === 'summary' || !codeContext || codeContext.length === 0) && (
          <div className="group animate-in slide-in-from-top-4 duration-500">
            <div className="relative overflow-hidden rounded-xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Header unifié */}
              <div className="relative px-6 py-4 bg-bolt-elements-background-depth-3 border-b border-bolt-elements-borderColor">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500/90 to-purple-600/90 flex items-center justify-center shadow-sm ring-1 ring-white/10">
                    <div className="i-ph:chat-circle-text text-white text-base" />
                  </div>
                  <h2 className="text-lg font-medium text-bolt-elements-textPrimary">
                    Résumé de la Conversation
                  </h2>
                </div>
              </div>
              
              {/* Contenu avec scroll cohérent */}
              <div className={`relative overflow-y-auto p-6 custom-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-80'}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none text-bolt-elements-textPrimary">
                  <Markdown>{chatSummary}</Markdown>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {codeContext && codeContext.length > 0 && (currentView === 'files' || !chatSummary) && (
          <div className="group animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="relative overflow-hidden rounded-xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Header cohérent avec le premier bloc */}
              <div className="relative px-6 py-4 bg-bolt-elements-background-depth-3 border-b border-bolt-elements-borderColor">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <div className="i-ph:file-code text-white text-lg" />
                    </div>
                    <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
                      Fichiers de Contexte
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                      {chatSummary && (
                        <button
                          onClick={() => setCurrentView('summary')}
                          className="p-2 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor hover:border-bolt-elements-borderColor-focus transition-all duration-200"
                          title="Voir le résumé"
                        >
                          <div className="i-ph:chat-circle-text text-bolt-elements-textSecondary" />
                        </button>
                      )}
                      <div className="px-3 py-1 rounded-full bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor">
                        <span className="text-xs font-medium text-bolt-elements-textSecondary">
                          {filteredFiles.length} / {codeContext.length} fichier{codeContext.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistiques avec design cohérent */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fileStats.fileTypes).map(([type, count]) => (
                      <div key={type} className="px-3 py-1 rounded-md bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-xs text-bolt-elements-textSecondary">
                        .{type}: {count}
                      </div>
                    ))}
                  </div>
                  
                  {/* Contrôles de recherche unifiés */}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <div className="i-ph:magnifying-glass text-bolt-elements-textTertiary" />
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher des fichiers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:border-bolt-elements-borderColor-focus transition-all duration-200"
                      />
                    </div>
                    <select
                      value={selectedFileType}
                      onChange={(e) => setSelectedFileType(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:border-bolt-elements-borderColor-focus transition-all duration-200"
                    >
                      <option value="all">Tous les types</option>
                      {uniqueFileTypes.map(type => (
                        <option key={type} value={type}>.{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Liste des fichiers avec design cohérent */}
              <div className="p-6 space-y-3">
                {filteredFiles.length === 0 && (searchTerm || selectedFileType !== 'all') && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor flex items-center justify-center">
                      <div className="i-ph:file-x text-2xl text-bolt-elements-textTertiary" />
                    </div>
                    <p className="text-bolt-elements-textSecondary mb-4">
                      Aucun fichier trouvé pour les critères de recherche.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedFileType('all');
                      }}
                      className="px-4 py-2 rounded-lg bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text transition-colors duration-200"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
                {filteredFiles.map((filePath, index) => {
                  let normalizedPath = filePath;
                  
                  if (normalizedPath.startsWith(WORK_DIR)) {
                    normalizedPath = filePath.replace(WORK_DIR, '');
                  }
                  
                  if (normalizedPath.startsWith('/')) {
                    normalizedPath = normalizedPath.slice(1);
                  }
                  
                  const fileExtension = normalizedPath.split('.').pop()?.toLowerCase() || '';
                  const getFileIcon = (ext: string) => {
                    switch (ext) {
                      case 'js': case 'jsx': return 'i-ph:file-js';
                      case 'ts': case 'tsx': return 'i-ph:file-ts';
                      case 'css': case 'scss': return 'i-ph:file-css';
                      case 'html': return 'i-ph:file-html';
                      case 'json': return 'i-ph:file-json';
                      case 'md': return 'i-ph:file-md';
                      default: return 'i-ph:file-code';
                    }
                  };
                  
                  return (
                    <Fragment key={normalizedPath}>
                      <button
                        className={`
                          w-full text-left p-4 rounded-lg
                          bg-gradient-to-r from-bolt-elements-background-depth-2/60 to-bolt-elements-background-depth-3/40
                          border border-bolt-elements-borderColor/40
                          hover:from-bolt-elements-background-depth-3/80 hover:to-bolt-elements-background-depth-2/60
                          hover:border-bolt-elements-borderColor/60 hover:shadow-md
                          transform hover:scale-[1.02] hover:-translate-y-0.5
                          transition-all duration-300 ease-out
                          group/file animate-in slide-in-from-left-2 duration-300
                          relative overflow-hidden
                        `}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openArtifactInWorkbench(normalizedPath);
                        }}
                        title={`Ouvrir ${normalizedPath} dans l'éditeur`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            bg-gradient-to-br from-bolt-elements-item-contentAccent/20 to-bolt-elements-item-contentAccent/10
                            group-hover/file:from-bolt-elements-item-contentAccent/30 group-hover/file:to-bolt-elements-item-contentAccent/20
                            transition-all duration-300 shadow-sm
                          `}>
                            <div className={`${getFileIcon(fileExtension)} text-bolt-elements-item-contentAccent text-base`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <code className="block text-bolt-elements-item-contentAccent group-hover/file:text-bolt-elements-textPrimary text-sm font-mono transition-colors duration-300 truncate">
                              {normalizedPath}
                            </code>
                            <div className="text-xs text-bolt-elements-textTertiary mt-1">
                              Type: .{fileExtension || 'unknown'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="opacity-0 group-hover/file:opacity-100 transition-opacity duration-300">
                              <div className="i-ph:external-link text-bolt-elements-textTertiary text-sm" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Effet de survol */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover/file:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </button>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {!chatSummary && (!codeContext || codeContext.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in-0 duration-1000">
            <div className="relative mb-8">
              {/* Cercles d'arrière-plan animés */}
              <div className="absolute inset-0 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl" />
              </div>
              <div className="absolute inset-2 animate-ping animation-delay-1000">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-lg" />
              </div>
              
              {/* Icône principale */}
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/50 flex items-center justify-center shadow-xl">
                <div className="i-ph:chat-circle-dots text-3xl text-bolt-elements-textTertiary animate-bounce animation-delay-500" />
              </div>
            </div>
            
            <div className="space-y-4 max-w-lg">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-bolt-elements-textPrimary to-bolt-elements-textSecondary bg-clip-text text-transparent">
                Aucun Contexte Disponible
              </h3>
              <p className="text-bolt-elements-textTertiary leading-relaxed">
                Les informations de contexte apparaîtront ici lorsqu'elles seront disponibles dans les messages de chat.
                <span className="block mt-3 text-sm opacity-70">
                  Commencez une conversation pour voir les résumés et les fichiers pertinents.
                </span>
              </p>
              
              {/* Conseils d'utilisation */}
              <div className="mt-6 p-4 rounded-lg bg-bolt-elements-background-depth-2/50 border border-bolt-elements-borderColor/30">
                <h4 className="text-sm font-semibold text-bolt-elements-textSecondary mb-2">
                  💡 Conseils d'utilisation :
                </h4>
                <ul className="text-xs text-bolt-elements-textTertiary space-y-1 text-left">
                  <li>• Posez des questions sur votre code</li>
                  <li>• Demandez des explications sur des fichiers</li>
                  <li>• Explorez l'architecture de votre projet</li>
                  <li>• Obtenez des suggestions d'amélioration</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Style personnalisé pour la scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.5));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.7), rgba(147, 51, 234, 0.7));
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
});