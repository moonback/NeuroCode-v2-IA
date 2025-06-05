import { Fragment, memo, useState, useMemo } from 'react';
import { Markdown } from '~/components/chat/Markdown';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';
import { Card, CardContent, CardHeader } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { SearchInput } from '~/components/ui/SearchInput';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { Separator } from '~/components/ui/Separator';
import { EmptyState } from '~/components/ui/EmptyState';
import { classNames } from '~/utils/classNames';

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
  const [currentView, setCurrentView] = useState<'summary' | 'files'>('summary');

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

  // Fonction pour obtenir l'icône du fichier
  const getFileIcon = (ext: string) => {
    switch (ext) {
      case 'js': case 'jsx': return 'i-ph:file-js';
      case 'ts': case 'tsx': return 'i-ph:file-ts';
      case 'css': case 'scss': return 'i-ph:file-css';
      case 'html': return 'i-ph:file-html';
      case 'json': return 'i-ph:file-json';
      case 'md': return 'i-ph:file-md';
      case 'py': return 'i-ph:file-py';
      case 'vue': return 'i-ph:file-vue';
      case 'svg': return 'i-ph:file-image';
      case 'png': case 'jpg': case 'jpeg': case 'gif': return 'i-ph:image';
      default: return 'i-ph:file-code';
    }
  };

  // Fonction pour obtenir la couleur du type de fichier
  const getFileTypeColor = (ext: string) => {
    switch (ext) {
      case 'js': case 'jsx': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'ts': case 'tsx': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'css': case 'scss': return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'html': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'json': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'md': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'py': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'vue': return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
      default: return 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border-bolt-elements-borderColor';
    }
  };

  return (
    <div className="h-full flex flex-col bg-bolt-elements-background-depth-1">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bolt-elements-item-backgroundAccent flex items-center justify-center">
            <div className={`${currentView === 'summary' ? 'i-ph:chat-circle-text' : 'i-ph:file-code'} text-bolt-elements-item-contentAccent text-lg`} />
          </div>
          <h1 className="text-xl font-semibold text-bolt-elements-textPrimary">
            {currentView === 'summary' ? 'Résumé de Contexte' : 'Fichiers de Contexte'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'summary' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('summary')}
            disabled={!chatSummary}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all bg-bolt-elements-background-depth-2 text-white duration-200 ease-in-out
              ${currentView === 'summary' 
                ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-textPrimary shadow-sm' 
                : 'hover:bg-bolt-elements-background-depth-2'
              }
              ${!chatSummary && 'opacity-50 cursor-not-allowed'}
            `}
          >
            <div className="i-ph:chat-circle-text text-lg" />
            <span className="font-medium">Résumé</span>
          </Button>

          <Button
            variant={currentView === 'files' ? 'default' : 'ghost'}
            size="sm" 
            onClick={() => setCurrentView('files')}
            disabled={!codeContext || codeContext.length === 0}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all bg-bolt-elements-background-depth-2 text-white duration-200 ease-in-out
              ${currentView === 'files'
                ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-textPrimary shadow-sm'
                : 'hover:bg-bolt-elements-background-depth-2'
              }
              ${(!codeContext || codeContext.length === 0) && 'opacity-50  cursor-not-allowed'}
            `}
          >
            <div className="i-ph:file-code text-lg" />
            <span className="font-medium">Fichiers ({codeContext?.length || 0})</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Vue Résumé */}
          {currentView === 'summary' && chatSummary && (
            <Card className="animate-in slide-in-from-top-4 duration-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bolt-elements-item-backgroundAccent flex items-center justify-center">
                      <div className="i-ph:chat-circle-text text-bolt-elements-item-contentAccent text-lg" />
                    </div>
                    <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
                      Résumé Complet de la Conversation
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 p-0"
                  >
                    <div className={`i-ph:${isExpanded ? 'caret-up' : 'caret-down'} text-bolt-elements-textSecondary`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={classNames(
                  "transition-all duration-300 overflow-hidden",
                  isExpanded ? "max-h-none" : "max-h-96"
                )}>
                  <ScrollArea className={isExpanded ? "max-h-[70vh]" : "h-full"}>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-bolt-elements-textPrimary">
                      <Markdown>{chatSummary}</Markdown>
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        
          {/* Vue Fichiers */}
          {currentView === 'files' && codeContext && codeContext.length > 0 && (
            <Card className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bolt-elements-item-backgroundAccent flex items-center justify-center">
                      <div className="i-ph:file-code text-bolt-elements-item-contentAccent text-lg" />
                    </div>
                    <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
                      Liste des Fichiers de Contexte
                    </h2>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {filteredFiles.length} / {codeContext.length} fichier{codeContext.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                  
                 
                 {/* Statistiques des types de fichiers */}
                 <div className="flex flex-wrap gap-2 mt-3">
                   {Object.entries(fileStats.fileTypes).map(([ext, count]) => (
                     <Badge 
                       key={ext}
                       variant="outline" 
                       className="text-xs"
                     >
                       <div className={`w-2 h-2 rounded-full mr-1 ${getFileTypeColor(ext)}`} />
                       {ext || 'sans ext'} ({count})
                     </Badge>
                   ))}
                 </div>
                 
                 {/* Filtres et recherche */}
                 <div className="mt-4 space-y-3">
                   <SearchInput
                     placeholder="Rechercher dans les fichiers..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full"
                   />
                   
                   {/* Filtre par type de fichier */}
                   <div className="flex flex-wrap gap-2">
                     <Button
                       variant={selectedFileType === 'all' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setSelectedFileType('all')}
                       className="text-xs"
                     >
                       Tous ({codeContext.length})
                     </Button>
                     {uniqueFileTypes.map(ext => (
                       <Button
                         key={ext}
                         variant={selectedFileType === ext ? 'default' : 'outline'}
                         size="sm"
                         onClick={() => setSelectedFileType(ext)}
                         className="text-xs"
                       >
                         .{ext} ({fileStats.fileTypes[ext]})
                       </Button>
                     ))}
                   </div>
                 </div>
               </CardHeader>
              
              <CardContent className="pt-0">
                <ScrollArea className="max-h-96">
                  {filteredFiles.length === 0 ? (
                    <EmptyState
                      icon="i-ph:file-x"
                      title={searchTerm ? 'Aucun fichier trouvé' : 'Aucun fichier dans le contexte'}
                      description={searchTerm ? 'Essayez un autre terme de recherche' : 'Les fichiers apparaîtront ici quand ils seront ajoutés'}
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredFiles.map((filePath, index) => {
                        let normalizedPath = filePath;
                        
                        if (normalizedPath.startsWith(WORK_DIR)) {
                          normalizedPath = filePath.replace(WORK_DIR, '');
                        }
                        
                        if (normalizedPath.startsWith('/')) {
                          normalizedPath = normalizedPath.slice(1);
                        }
                        
                        const fileExtension = normalizedPath.split('.').pop()?.toLowerCase() || '';
                        const fileName = normalizedPath.split('/').pop() || normalizedPath;
                        const directory = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
                        
                        return (
                          <Card
                            key={normalizedPath}
                            className="group animate-in slide-in-from-left-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => openArtifactInWorkbench(normalizedPath)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Icône de fichier */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getFileTypeColor(fileExtension)} bg-opacity-20`}>
                                  <div className={`${getFileIcon(fileExtension)} text-lg`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  {/* Nom du fichier */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-bolt-elements-textPrimary truncate">
                                      {fileName}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      .{fileExtension}
                                    </Badge>
                                  </div>
                                  
                                  {/* Chemin du répertoire */}
                                  {directory && (
                                    <p className="text-sm text-bolt-elements-textSecondary truncate mb-2">
                                      {directory}
                                    </p>
                                  )}
                                  
                                  {/* Type de fichier */}
                                  <div className="text-xs text-bolt-elements-textSecondary">
                                    Type: .{fileExtension || 'unknown'}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <div className="i-ph:external-link text-bolt-elements-textSecondary" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        
          {/* États vides */}
          {currentView === 'summary' && !chatSummary && (
            <div className="flex flex-col items-center justify-center h-full">
              <EmptyState
                icon="i-ph:chat-circle-dots"
                title="Aucun Résumé Disponible"
                description="Le résumé de la conversation apparaîtra ici lorsqu'il sera généré."
              />
            </div>
          )}
          
          {currentView === 'files' && (!codeContext || codeContext.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full">
              <EmptyState
                icon="i-ph:file-x"
                title="Aucun Fichier de Contexte"
                description="Les fichiers de contexte apparaîtront ici lorsqu'ils seront ajoutés à la conversation."
              />
              
              <Card className="mt-6 max-w-lg">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-bolt-elements-textPrimary mb-3">
                    💡 Conseils d'utilisation :
                  </h4>
                  <ul className="text-sm text-bolt-elements-textSecondary space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent" />
                      Posez des questions sur votre code
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent" />
                      Demandez des explications sur des fichiers
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent" />
                      Explorez l'architecture de votre projet
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent" />
                      Obtenez des suggestions d'amélioration
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* État vide global */}
          {!chatSummary && (!codeContext || codeContext.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full">
              <EmptyState
                icon="i-ph:chat-circle-dots"
                title="Aucun Contexte Disponible"
                description="Les informations de contexte apparaîtront ici lorsqu'elles seront disponibles dans les messages de chat."
              />
            </div>
          )}
      </div>
      </ScrollArea>
      

    </div>
  );
});