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
    toast.success(`File "${fileName}" removed from AI targets`);
    // Remove from selection if it was selected
    const newSelectedFiles = new Set(selectedFiles);
    newSelectedFiles.delete(filePath);
    setSelectedFiles(newSelectedFiles);
  };

  const handleClearAll = () => {
    workbenchStore.clearAITargetFiles();
    toast.success('All AI targets cleared');
    setSelectedFiles(new Set());
  };

  const handleRemoveSelected = () => {
    if (selectedFiles.size === 0) {
      toast.error('No files selected to remove.');
      return;
    }

    let removedCount = 0;
    selectedFiles.forEach((filePath) => {
      workbenchStore.removeAITargetFile(filePath);
      removedCount++;
    });

    if (removedCount > 0) {
      toast.success(`Removed ${removedCount} selected file(s) from AI targets.`);
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

  if (targetedFilesArray.length === 0) {
    return null;
  };

  if (targetedFilesArray.length === 0) {
    return null;
  }

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
    <div className={classNames(
      'flex flex-col h-full overflow-hidden',
      'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
        <div className="flex items-center gap-2">
          <div className="i-ph:target text-violet-500" />
          <span className="text-sm font-semibold text-bolt-elements-textPrimary">AI Targets</span>
          <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-300 rounded-full font-bold">
            {targetedFilesArray.length}
          </span>
        </div>
        {targetedFilesArray.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            title="Clear all targets"
          >
            <div className="i-ph:trash" />
          </button>
        )}
      </div>



      {/* Controls */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-bolt-elements-borderColor">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary i-ph:magnifying-glass text-xs pointer-events-none" />
          <input
            type="text"
            placeholder="Search files..."
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
          <option value="all">All</option>
          <option value="js">JS/JSX</option>
          <option value="ts">TS/TSX</option>
          <option value="py">Python</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Header Row with Select All */}
      <div className="flex items-center justify-between px-2 py-1 text-xs text-bolt-elements-textSecondary">
        <div>
          <Checkbox
            checked={selectAllCheckedState}
            onCheckedChange={handleSelectAll}
            className="w-3 h-3 rounded border-bolt-elements-borderColor mr-2"
            aria-label="Select all files"
            disabled={filteredAndSortedFiles.length === 0}
          />
          <span>All</span>
        </div>
        {selectedFiles.size > 0 && (
          <button
            className="ml-auto px-2 py-0.5 rounded bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text text-xs flex items-center gap-1"
            onClick={handleRemoveSelected}
            title="Remove all selected files"
          >
            Remove selected
          </button>
        )}
      </div>

      {/* List of targeted files */}
      <div className="flex-1 overflow-auto modern-scrollbar px-1 py-1">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-bolt-elements-textTertiary text-xs gap-2">
            <span className="i-ph:target text-lg opacity-50" />
            <span>No targeted files found</span>
            {targetedFilesArray.length > 0 && (
              <span className="text-center">Try adjusting your search or filter</span>
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
                    'shrink-0 text-xs',
                    getFileIcon(file.extension)
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div id={`file-label-${file.path}`} className="truncate text-xs font-medium" title={file.name}>
                    {file.name}
                  </div>
                  <div className="truncate text-xs text-bolt-elements-textTertiary" title={file.path}>
                    {file.path.replace('/home/project/', '')}
                  </div>
                </div>
                <button
                  className="flex items-center px-1 py-0.5 text-xs rounded bg-transparent hover:bg-bolt-elements-background-depth-3"
                  onClick={() => handleRemoveFile(file.path)}
                  title="Remove from targets"
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
          {filteredAndSortedFiles.length} file(s) • {selectedFiles.size} selected
        </div>
      </div>
    </div>
  );
});

AITargetManager.displayName = 'AITargetManager';