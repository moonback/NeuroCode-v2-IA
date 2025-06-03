import { memo, useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { Checkbox } from '~/components/ui/Checkbox';

interface AITargetManagerProps {
  className?: string;
}

interface TargetedFile {
  path: string;
  name: string;
  extension: string;
}

export const AITargetManager = memo<AITargetManagerProps>(({ className }) => {
  const aiTargetFiles = useStore(workbenchStore.aiTargetFiles);
  const aiContext = useStore(workbenchStore.aiContext);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'js' | 'ts' | 'py' | 'other'>('all');
  const [isContextFocused, setIsContextFocused] = useState(false);

  const targetedFilesArray: TargetedFile[] = Array.from(aiTargetFiles).map(filePath => {
    const fileName = filePath.split('/').pop() || 'file';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    return {
      path: filePath,
      name: fileName,
      extension: fileExtension
    };
  });

  const handleRemoveFile = (filePath: string) => {
    workbenchStore.removeAITargetFile(filePath);
    const fileName = filePath.split('/').pop() || 'file';
    toast.success(`Fichier "${fileName}" retiré des cibles IA`);
    // Remove from selection if it was selected
    const newSelectedFiles = new Set(selectedFiles);
    newSelectedFiles.delete(filePath);
    setSelectedFiles(newSelectedFiles);
  };

  const handleClearAll = () => {
    workbenchStore.clearAITargetFiles();
    toast.success('Toutes les cibles IA effacées');
    setSelectedFiles(new Set());
  };

  const handleRemoveSelected = () => {
    if (selectedFiles.size === 0) {
      toast.error('Aucun fichier sélectionné à supprimer.');
      return;
    }

    let removedCount = 0;
    selectedFiles.forEach((filePath) => {
      workbenchStore.removeAITargetFile(filePath);
      removedCount++;
    });

    if (removedCount > 0) {
      toast.success(`${removedCount} fichier(s) sélectionné(s) retiré(s) des cibles IA.`);
      setSelectedFiles(new Set());
    }
  };

  const handleContextChange = (newContext: string) => {
    workbenchStore.setAIContext(newContext);
  };

  // Clear selection when files change
  useEffect(() => {
    setSelectedFiles(prev => {
      const newSelection = new Set<string>();
      prev.forEach(path => {
        if (aiTargetFiles.has(path)) {
          newSelection.add(path);
        }
      });
      return newSelection;
    });
  }, [aiTargetFiles]);



  // Filter and sort the targeted files
  const filteredAndSortedFiles = targetedFilesArray
    .filter((file) => {
      // Apply type filter
      if (filter === 'js' && !['js', 'jsx'].includes(file.extension)) {
        return false;
      }
      if (filter === 'ts' && !['ts', 'tsx'].includes(file.extension)) {
        return false;
      }
      if (filter === 'py' && file.extension !== 'py') {
        return false;
      }
      if (filter === 'other' && ['js', 'jsx', 'ts', 'tsx', 'py'].includes(file.extension)) {
        return false;
      }

      // Apply search filter
      if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase()) && !file.path.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Handle selecting/deselecting a single file
  const handleSelectFile = (filePath: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(filePath)) {
      newSelectedFiles.delete(filePath);
    } else {
      newSelectedFiles.add(filePath);
    }
    setSelectedFiles(newSelectedFiles);
  };

  // Handle selecting/deselecting all visible files
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allVisiblePaths = new Set(filteredAndSortedFiles.map((file) => file.path));
      setSelectedFiles(allVisiblePaths);
    } else {
      setSelectedFiles(new Set());
    }
  };

  // Determine the state of the "Select All" checkbox
  const isAllSelected = filteredAndSortedFiles.length > 0 && selectedFiles.size === filteredAndSortedFiles.length;
  const isSomeSelected = selectedFiles.size > 0 && selectedFiles.size < filteredAndSortedFiles.length;
  const selectAllCheckedState: boolean | 'indeterminate' = isAllSelected
    ? true
    : isSomeSelected
      ? 'indeterminate'
      : false;

  const getFileIcon = (fileExtension: string) => {
    const icons = {
      js: 'i-ph:file-js text-yellow-400',
      jsx: 'i-ph:file-jsx text-cyan-400',
      ts: 'i-ph:file-ts text-violet-400',
      tsx: 'i-ph:file-tsx text-violet-300',
      py: 'i-ph:file-py text-green-400',
      java: 'i-ph:file-java text-red-400',
      cpp: 'i-ph:file-cpp text-violet-500',
      c: 'i-ph:file-c text-violet-600',
      md: 'i-ph:file-md text-white',
      txt: 'i-ph:file-text text-gray-400',
      json: 'i-ph:file-json text-orange-400',
      yaml: 'i-ph:file-code text-purple-400',
      yml: 'i-ph:file-code text-purple-400',
      css: 'i-ph:file-css text-pink-400',
      scss: 'i-ph:file-css text-pink-500',
      sass: 'i-ph:file-css text-pink-500',
      html: 'i-ph:file-html text-orange-500',
      vue: 'i-ph:file-vue text-emerald-400',
    };
    return icons[fileExtension as keyof typeof icons] || 'i-ph:file text-bolt-elements-textSecondary';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-bolt-elements-borderColor">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary i-ph:magnifying-glass text-xs pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher des fichiers..."
            className="w-full text-xs pl-6 pr-2 py-0.5 h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded border border-bolt-elements-borderColor focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: 0 }}
          />
        </div>
        {/* Filter Select */}
        <select
          className="text-xs px-1 py-0.5 h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded border border-bolt-elements-borderColor focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">Tous</option>
          <option value="js">JS/JSX</option>
          <option value="ts">TS/TSX</option>
          <option value="py">Python</option>
          <option value="other">Autres</option>
        </select>
      </div>

      {/* Header Row with Select All */}
      <div className="flex items-center justify-between px-2 py-1 text-xs text-bolt-elements-textSecondary">
        <div>
          <Checkbox
            checked={selectAllCheckedState}
            onCheckedChange={handleSelectAll}
            className="w-3 h-3 rounded border-bolt-elements-borderColor mr-2"
            aria-label="Sélectionner tous les fichiers"
            disabled={filteredAndSortedFiles.length === 0}
          />
          <span>Tous</span>
        </div>
        {selectedFiles.size > 0 && (
          <button
            className="ml-auto px-2 py-0.5 rounded bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text text-xs flex items-center gap-1"
            onClick={handleRemoveSelected}
            title="Supprimer tous les fichiers sélectionnés"
          >
            Supprimer sélectionnés
          </button>
        )}
        <div></div>
      </div>

      {/* List of targeted files */}
      <div className="flex-1 overflow-auto modern-scrollbar px-1 py-1">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-bolt-elements-textTertiary text-xs gap-2">
            <span className="i-ph:target text-lg opacity-50" />
            <span>Aucun fichier ciblé trouvé</span>
            {targetedFilesArray.length > 0 && (
              <span className="text-center">Essayez d'ajuster votre recherche ou filtre</span>
            )}
          </div>
        ) : (
          <ul className="space-y-1">
            {filteredAndSortedFiles.map((file) => (
              <li
                key={file.path}
                className={classNames(
                  'text-bolt-elements-textTertiary flex items-center gap-2 px-2 py-1 rounded hover:bg-bolt-elements-background-depth-2 transition-colors group',
                  selectedFiles.has(file.path) ? 'bg-bolt-elements-background-depth-2' : '',
                )}
              >
                <Checkbox
                  checked={selectedFiles.has(file.path)}
                  onCheckedChange={() => handleSelectFile(file.path)}
                  className="w-3 h-3 rounded border-bolt-elements-borderColor"
                  aria-labelledby={`file-label-${file.path}`}
                />
                <span
                  className={classNames(
                    'shrink-0 text-bolt-elements-textTertiary text-xs',
                    getFileIcon(file.extension)
                  )}
                />
                <span id={`file-label-${file.path}`} className="truncate flex-1 text-xs" title={file.path}>
                  {file.path.replace('/home/project/', '')}
                </span>
                <span
                  className={classNames(
                    'inline-flex items-center px-1 rounded-sm text-xs',
                    'bg-violet-500/10 text-violet-500',
                  )}
                ></span>
                <button
                  className="flex items-center px-1 py-0.5 text-xs rounded bg-transparent hover:bg-bolt-elements-background-depth-3"
                  onClick={() => handleRemoveFile(file.path)}
                  title="Retirer des cibles"
                >
                  <span className="i-ph:x text-xs" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-xs text-bolt-elements-textTertiary flex justify-between items-center">
        <div>
          {filteredAndSortedFiles.length} fichier(s) • {selectedFiles.size} sélectionné(s)
        </div>
      </div>
    </div>
  );
});

AITargetManager.displayName = 'AITargetManager';