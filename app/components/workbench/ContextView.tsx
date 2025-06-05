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
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {chatSummary && (
          <div className="group animate-in slide-in-from-top-4 duration-500">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-bolt-elements-background-depth-2/80 to-bolt-elements-background-depth-3/60 backdrop-blur-sm border border-bolt-elements-borderColor/50 shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Header avec effet glassmorphism */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-bolt-elements-borderColor/30">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <div className="i-ph:chat-circle-text text-white text-lg" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-bolt-elements-textPrimary to-bolt-elements-textSecondary bg-clip-text text-transparent">
                  Résumé de la Conversation
                </h2>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg bg-bolt-elements-background-depth-3/50 hover:bg-bolt-elements-background-depth-3/70 transition-colors duration-200"
                    title={isExpanded ? 'Réduire' : 'Développer'}
                  >
                    <div className={`i-ph:${isExpanded ? 'minus' : 'plus'} text-bolt-elements-textSecondary`} />
                  </button>
                </div>
              </div>
              </div>
              
              {/* Contenu avec scroll personnalisé */}
              <div className={`relative overflow-y-auto p-6 custom-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-80'}`}>
                <div 
                  style={{ zoom: 0.95 }} 
                  className="prose prose-sm dark:prose-invert max-w-none"
                >
                  <Markdown>{chatSummary}</Markdown>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {codeContext && codeContext.length > 0 && (
          <div className="group animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-bolt-elements-background-depth-2/80 to-bolt-elements-background-depth-3/60 backdrop-blur-sm border border-bolt-elements-borderColor/50 shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Header avec icône animée */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-bolt-elements-borderColor/30">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <div className="i-ph:file-code text-white text-lg" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-bolt-elements-textPrimary to-bolt-elements-textSecondary bg-clip-text text-transparent">
                      Fichiers de Contexte
                    </h2>
                    <div className="ml-auto px-3 py-1 rounded-full bg-bolt-elements-background-depth-3/50 border border-bolt-elements-borderColor/30">
                      <span className="text-xs font-medium text-bolt-elements-textTertiary">
                        {filteredFiles.length} / {codeContext.length} fichier{codeContext.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Statistiques des types de fichiers */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fileStats.fileTypes).map(([type, count]) => (
                      <div key={type} className="px-2 py-1 rounded-md bg-bolt-elements-background-depth-3/30 border border-bolt-elements-borderColor/20">
                        <span className="text-xs text-bolt-elements-textTertiary">
                          .{type}: {count}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Barre de recherche et filtres */}
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-bolt-elements-background-depth-3/50 border border-bolt-elements-borderColor/30 text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      />
                    </div>
                    <select
                      value={selectedFileType}
                      onChange={(e) => setSelectedFileType(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-bolt-elements-background-depth-3/50 border border-bolt-elements-borderColor/30 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                    >
                      <option value="all">Tous les types</option>
                      {uniqueFileTypes.map(type => (
                        <option key={type} value={type}>.{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Liste des fichiers avec animations décalées */}
              <div className="p-6 space-y-3">
                {filteredFiles.length === 0 && (searchTerm || selectedFileType !== 'all') && (
                  <div className="text-center py-8">
                    <div className="i-ph:file-x text-4xl text-bolt-elements-textTertiary mb-3" />
                    <p className="text-bolt-elements-textTertiary">
                      Aucun fichier trouvé pour les critères de recherche.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedFileType('all');
                      }}
                      className="mt-3 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors duration-200"
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