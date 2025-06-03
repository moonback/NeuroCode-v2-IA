import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';

import { Button } from '~/components/ui/Button';
import { db, deleteById, getAll, chatId, type ChatHistoryItem, useChatHistory } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { workbenchStore } from '~/lib/stores/workbench';
import { chatStore } from '~/lib/stores/chat';
import { supabaseConnection } from '~/lib/stores/supabase';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import SidebarTemplates from './SidebarTemplates';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-340px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent =
  | { type: 'delete'; item: ChatHistoryItem }
  | { type: 'bulkDelete'; items: ChatHistoryItem[] }
  | null;

function ConnectionStatus() {
  const supabaseConn = useStore(supabaseConnection);
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  
  // Check GitHub connection from localStorage
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  
  useEffect(() => {
    const checkGithubConnection = () => {
      const githubConnection = localStorage.getItem('github_connection');
      if (githubConnection) {
        try {
          const parsed = JSON.parse(githubConnection);
          setGithubConnected(true);
          setGithubUser(parsed.user?.login || null);
        } catch {
          setGithubConnected(false);
          setGithubUser(null);
        }
      } else {
        setGithubConnected(false);
        setGithubUser(null);
      }
    };
    
    checkGithubConnection();
    // Check periodically for changes
    const interval = setInterval(checkGithubConnection, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const connections = [
    { 
      name: 'Supabase', 
      connected: !!supabaseConn.user, 
      icon: 'i-ph-database', 
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500',
      user: supabaseConn.user?.email || null
    },
    { 
      name: 'GitHub', 
      connected: githubConnected, 
      icon: 'i-ph-git-branch', 
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500',
      user: githubUser
    },
    { 
      name: 'Netlify', 
      connected: !!netlifyConn.user, 
      icon: 'i-ph-globe', 
      color: 'from-violet-400 to-violet-600',
      bgColor: 'bg-violet-500',
      user: netlifyConn.user?.full_name || netlifyConn.user?.email || null
    },
    { 
      name: 'Vercel', 
      connected: !!vercelConn.user, 
      icon: 'i-ph-triangle', 
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-500',
      user: vercelConn.user?.username || vercelConn.user?.user?.username || null
    },
  ];
  
  const connectedCount = connections.filter(conn => conn.connected).length;
  const allConnected = connectedCount === 4;
  
  return (
    <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
      <div className="flex items-center justify-between">
        {/* Left section - Status overview */}
        <div className="flex items-center gap-4 p-1">
          {/* Status indicator */}
          <div className="relative">
            <div className={`w-5 h-5 rounded-xl flex items-center justify-center transition-all duration-500 ${
              allConnected 
                ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40 shadow-lg scale-110' 
                : connectedCount > 0 
                  ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/40 shadow-lg'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/30'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full bg-white/90 backdrop-blur-sm transition-all duration-300 ${
                allConnected ? 'animate-pulse scale-110' : 'scale-90'
              }`}></div>
            </div>
            
            {/* Decorative ring */}
            <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br opacity-30 blur-sm transition-all duration-500 ${
              allConnected 
                ? 'from-green-400/50 to-green-600/50 animate-pulse'
                : connectedCount > 0
                  ? 'from-orange-400/30 to-orange-600/30'
                  : 'from-gray-400/20 to-gray-500/20'
            }`}></div>
          </div>
          
          {/* Status text */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold bg-gradient-to-br from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              Connexions
            </span>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              allConnected 
                ? 'text-green-600 dark:text-green-400' 
                : connectedCount > 0 
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-500 dark:text-gray-400'
            }`}>
              {connectedCount}/4 services connectés
            </span>
          </div>
        </div>
        
        {/* Right section - Service indicators */}
        <div className="flex items-center gap-2">
          {connections.map((conn) => (
            <div
              key={conn.name}
              className="group relative"
              title={`${conn.name} - ${conn.connected ? 'Connecté' : 'Déconnecté'}${conn.user ? ` (${conn.user})` : ''}`}
            >
              {/* Service indicator */}
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300 ${
                conn.connected 
                  ? `bg-gradient-to-br ${conn.color} text-white shadow-lg hover:scale-110` 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}>
                <div className={`${conn.icon} text-sm`}></div>
              </div>
              
              {/* Connection status dot */}
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 transition-all duration-300 ${
                conn.connected 
                  ? `${conn.bgColor} animate-pulse` 
                  : 'bg-gray-400'
              }`}></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="font-medium">{conn.name}</div>
                {conn.user && (
                  <div className="text-gray-300 dark:text-gray-600 text-xs">{conn.user}</div>
                )}
                <div className="text-xs">
                  {conn.connected ? '✓ Connecté' : '✕ Déconnecté'}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-200/40 dark:border-gray-700/30">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded flex items-center justify-center">
          <div className="i-ph:clock text-white text-xs" />
        </div>
        <span className="font-medium text-gray-800 dark:text-gray-200">{dateTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        <span className="text-gray-500 dark:text-gray-400">{dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

export const Menu = () => {
  const { duplicateCurrentChat, exportChat } = useChatHistory();
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profile = useStore(profileStore);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const chat = useStore(chatStore);
  const isChatStarted = chat.started;

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteChat = useCallback(
    async (id: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not available');
      }

      // Delete chat snapshot from localStorage
      try {
        const snapshotKey = `snapshot:${id}`;
        localStorage.removeItem(snapshotKey);
        console.log('Removed snapshot for chat:', id);
      } catch (snapshotError) {
        console.error(`Error deleting snapshot for chat ${id}:`, snapshotError);
      }

      // Delete the chat from the database
      await deleteById(db, id);
      console.log('Successfully deleted chat:', id);
    },
    [db],
  );

  const deleteItem = useCallback(
    (event: React.UIEvent, item: ChatHistoryItem) => {
      event.preventDefault();
      event.stopPropagation();

      // Log the delete operation to help debugging
      console.log('Attempting to delete chat:', { id: item.id, description: item.description });

      deleteChat(item.id)
        .then(() => {
          toast.success('Chat deleted successfully', {
            position: 'bottom-right',
            autoClose: 3000,
          });

          // Always refresh the list
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            console.log('Navigating away from deleted chat');
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          console.error('Failed to delete chat:', error);
          toast.error('Failed to delete conversation', {
            position: 'bottom-right',
            autoClose: 3000,
          });

          // Still try to reload entries in case data has changed
          loadEntries();
        });
    },
    [loadEntries, deleteChat],
  );

  const deleteSelectedItems = useCallback(
    async (itemsToDeleteIds: string[]) => {
      if (!db || itemsToDeleteIds.length === 0) {
        console.log('Bulk delete skipped: No DB or no items to delete.');
        return;
      }

      console.log(`Starting bulk delete for ${itemsToDeleteIds.length} chats`, itemsToDeleteIds);

      let deletedCount = 0;
      const errors: string[] = [];
      const currentChatId = chatId.get();
      let shouldNavigate = false;

      // Process deletions sequentially using the shared deleteChat logic
      for (const id of itemsToDeleteIds) {
        try {
          await deleteChat(id);
          deletedCount++;

          if (id === currentChatId) {
            shouldNavigate = true;
          }
        } catch (error) {
          console.error(`Error deleting chat ${id}:`, error);
          errors.push(id);
        }
      }

      // Show appropriate toast message
      if (errors.length === 0) {
        toast.success(`${deletedCount} chat${deletedCount === 1 ? '' : 's'} deleted successfully`);
      } else {
        toast.warning(`Deleted ${deletedCount} of ${itemsToDeleteIds.length} chats. ${errors.length} failed.`, {
          autoClose: 5000,
        });
      }

      // Reload the list after all deletions
      await loadEntries();

      // Clear selection state
      setSelectedItems([]);
      setSelectionMode(false);

      // Navigate if needed
      if (shouldNavigate) {
        console.log('Navigating away from deleted chat');
        window.location.pathname = '/';
      }
    },
    [deleteChat, loadEntries, db],
  );

  const closeDialog = () => {
    setDialogContent(null);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);

    if (selectionMode) {
      // If turning selection mode OFF, clear selection
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSelectedItems = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      console.log('Selected items updated:', newSelectedItems);

      return newSelectedItems; // Return the new array
    });
  }, []); // No dependencies needed

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.info('Select at least one chat to delete');
      return;
    }

    const selectedChats = list.filter((item) => selectedItems.includes(item.id));

    if (selectedChats.length === 0) {
      toast.error('Could not find selected chats');
      return;
    }

    setDialogContent({ type: 'bulkDelete', items: selectedChats });
  }, [selectedItems, list]); // Keep list dependency

  const selectAll = useCallback(() => {
    const allFilteredIds = filteredList.map((item) => item.id);
    setSelectedItems((prev) => {
      const allFilteredAreSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => prev.includes(id));

      if (allFilteredAreSelected) {
        // Deselect only the filtered items
        const newSelectedItems = prev.filter((id) => !allFilteredIds.includes(id));
        console.log('Deselecting all filtered items. New selection:', newSelectedItems);

        return newSelectedItems;
      } else {
        // Select all filtered items, adding them to any existing selections
        const newSelectedItems = [...new Set([...prev, ...allFilteredIds])];
        console.log('Selecting all filtered items. New selection:', newSelectedItems);

        return newSelectedItems;
      }
    });
  }, [filteredList]); // Depends only on filteredList

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open, loadEntries]);

  // Exit selection mode when sidebar is closed
  useEffect(() => {
    if (!open && selectionMode) {
      /*
       * Don't clear selection state anymore when sidebar closes
       * This allows the selection to persist when reopening the sidebar
       */
      console.log('Sidebar closed, preserving selection state');
    }
  }, [open, selectionMode]);

  useEffect(() => {
    const enterThreshold = 40;
    const exitThreshold = 40;

    function onMouseMove(event: MouseEvent) {
      if (isSettingsOpen) {
        return;
      }

      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isSettingsOpen]);

  const handleDuplicate = async (id: string) => {
    await duplicateCurrentChat(id);
    loadEntries(); // Reload the list after duplication
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setOpen(false);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const setDialogContentWithLogging = useCallback((content: DialogContent) => {
    console.log('Setting dialog content:', content);
    setDialogContent(content);
  }, []);

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        style={{ width: '340px' }}
        className={classNames(
          'flex selection-accent flex-col side-menu fixed top-0 h-full',
          'bg-white dark:bg-gray-950',
          'border-r border-gray-200/60 dark:border-gray-700/50',
          'shadow-lg text-sm',
          isSettingsOpen ? 'z-40' : 'z-sidebar',
        )}
      >
        <div className="relative h-16 flex items-center justify-between px-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-gradient-to-r from-white via-purple-50/30 to-violet-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-violet-900/10 backdrop-blur-sm">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            
          </div>
          
          {/* Profil utilisateur */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate max-w-20">
                {profile?.username || 'Invité'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                En ligne
              </span>
            </div>
            <div className="relative group">
              <div className="flex items-center justify-center w-9 h-9 overflow-hidden bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 dark:from-purple-800/40 dark:via-violet-800/40 dark:to-indigo-800/40 text-purple-600 dark:text-purple-300 rounded-xl shrink-0 border-2 border-purple-200/60 dark:border-purple-600/40 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile?.username || 'User'}
                    className="w-full h-full object-cover rounded-xl"
                    loading="eager"
                    decoding="sync"
                  />
                ) : (
                  <div className="i-ph:user-fill text-lg" />
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm animate-pulse"></div>
              
              {/* Effet de hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/10 group-hover:to-violet-500/10 transition-all duration-300"></div>
            </div>
          </div>
          
          {/* Effet de fond décoratif */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-50"></div>
        </div>
        {/* <CurrentDateTime /> */}
        
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Bouton Nouveau projet amélioré */}
            <a
              href="/"
              className="relative flex gap-3 items-center bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 transition-all duration-300 group shadow-lg hover:shadow-xl overflow-hidden"
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              
              <div className="relative w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <span className="i-ph:plus h-4 w-4 font-bold" />
              </div>
              <div className="relative flex flex-col">
                <span className="text-sm font-semibold">Nouveau projet</span>
                <span className="text-xs text-white/80">Créer un nouveau projet IA</span>
              </div>
              
              {/* Icône flèche */}
              <div className="relative ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <span className="i-ph:arrow-right h-4 w-4" />
              </div>
            </a>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={classNames(
                  'flex-1 flex gap-1.5 items-center justify-center rounded-lg px-3 py-2 transition-all duration-200 text-xs font-medium',
                  showTemplates
                    ? 'bg-violet-600 dark:bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
                aria-label={showTemplates ? 'Masquer les projets' : 'Afficher les projets'}
                title={showTemplates ? 'Masquer les projets' : 'Afficher les projets'}
              >
                <span className="i-ph:folder h-3.5 w-3.5" />
                <span>Projets</span>
              </button>
              <button
                onClick={toggleSelectionMode}
                className={classNames(
                  'flex-1 flex gap-1.5 items-center justify-center rounded-lg px-3 py-2 transition-all duration-200 text-xs font-medium',
                  selectionMode
                    ? 'bg-red-600 dark:bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
                aria-label={selectionMode ? 'Quitter le mode sélection' : 'Entrer en mode sélection'}
              >
                <span className={selectionMode ? 'i-ph:x h-3.5 w-3.5' : 'i-ph:check-square h-3.5 w-3.5'} />
                <span>{selectionMode ? 'Annuler' : 'Sélection'}</span>
              </button>
            </div>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <span className="i-ph:magnifying-glass h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                className="w-full bg-white dark:bg-gray-800 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-400 dark:focus:border-purple-500 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
                type="search"
                placeholder="Rechercher..."
                onChange={handleSearchChange}
                aria-label="Rechercher dans les chats"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-200/40 dark:border-gray-700/30">
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-violet-600 rounded flex items-center justify-center">
                <div className="i-ph:chat text-white text-xs" />
              </div>
              <span className="text-sm">Projets</span>
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                {filteredList.length}
              </span>
            </div>
            {selectionMode && (
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={selectAll}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  {selectedItems.length === filteredList.length ? 'Désélectionner' : 'Tout'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  disabled={selectedItems.length === 0}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Supprimer ({selectedItems.length})
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto px-3 pb-3">
            {filteredList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg flex items-center justify-center mb-3">
                  <div className="i-ph:chat-circle text-purple-600 dark:text-purple-400 text-xl" />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 text-sm">
                  {list.length === 0 ? 'Aucun projet' : 'Aucun résultat'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-40">
                  {list.length === 0 
                    ? 'Commencez avec NeuroCode' 
                    : 'Essayez d\'autres mots-clés'}
                </p>
              </div>
            )}
            <DialogRoot open={dialogContent !== null}>
              {binDates(filteredList).map(({ category, items }) => (
                <div key={category} className="mt-3 first:mt-0 space-y-1">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 sticky top-0 z-1 bg-white dark:bg-gray-950 px-3 py-1.5 rounded border border-gray-200/40 dark:border-gray-700/40">
                    {category}
                  </div>
                  <div className="space-y-0.5 pr-1">
                    {items.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        exportChat={exportChat}
                        onDelete={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          console.log('Delete triggered for item:', item);
                          setDialogContentWithLogging({ type: 'delete', item });
                        }}
                        onDuplicate={() => handleDuplicate(item.id)}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.includes(item.id)}
                        onToggleSelection={toggleItemSelection}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                {dialogContent?.type === 'delete' && (
                  <>
                    <div className="p-6 bg-white dark:bg-gray-950">
                      <DialogTitle className="text-gray-900 dark:text-white">Supprimer le chat ?</DialogTitle>
                      <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
                        <p>
                          Vous êtes sur le point de supprimer{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {dialogContent.item.description}
                          </span>
                        </p>
                        <p className="mt-2">Êtes-vous sûr de vouloir supprimer ce chat ?</p>
                      </DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Annuler
                      </DialogButton>
                      <DialogButton
                        type="danger"
                        onClick={(event) => {
                          console.log('Dialog delete button clicked for item:', dialogContent.item);
                          deleteItem(event, dialogContent.item);
                          closeDialog();
                        }}
                      >
                        Supprimer
                      </DialogButton>
                    </div>
                  </>
                )}
                {dialogContent?.type === 'bulkDelete' && (
                  <>
                    <div className="p-6 bg-white dark:bg-gray-950">
                      <DialogTitle className="text-gray-900 dark:text-white">Supprimer les chats sélectionnés ?</DialogTitle>
                      <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
                        <p>
                          Vous êtes sur le point de supprimer {dialogContent.items.length}{' '}
                          {dialogContent.items.length === 1 ? 'chat' : 'chats'} :
                        </p>
                        <div className="mt-2 max-h-32 overflow-auto border border-gray-100 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900 p-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {dialogContent.items.map((item) => (
                              <li key={item.id} className="text-sm">
                                <span className="font-medium text-gray-900 dark:text-white">{item.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="mt-3">Êtes-vous sûr de vouloir supprimer ces chats ?</p>
                      </DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Annuler
                      </DialogButton>
                      <DialogButton
                        type="danger"
                        onClick={() => {
                          /*
                           * Pass the current selectedItems to the delete function.
                           * This captures the state at the moment the user confirms.
                           */
                          const itemsToDeleteNow = [...selectedItems];
                          console.log('Bulk delete confirmed for', itemsToDeleteNow.length, 'items', itemsToDeleteNow);
                          deleteSelectedItems(itemsToDeleteNow);
                          closeDialog();
                        }}
                      >
                        Supprimer
                      </DialogButton>
                    </div>
                  </>
                )}
              </Dialog>
            </DialogRoot>
          </div>
          <ConnectionStatus />

          {/* Conditionally render SidebarTemplates based on showTemplates state */}
            {showTemplates && <SidebarTemplates />}
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-4 bg-gradient-to-r from-gray-50/30 to-violet-50/30 dark:from-gray-900/30 dark:to-violet-900/30">
            <button
              onClick={handleSettingsClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/50 dark:hover:to-violet-900/50 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md hover:scale-105 group"
            >
              <span className="i-ph:gear h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-sm font-medium">Paramètres</span>
            </button>
            <ThemeSwitch className="p-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/50 dark:hover:to-violet-900/50 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-md hover:scale-105" />
          </div>
        </div>
      </motion.div>

      <ControlPanel open={isSettingsOpen} onClose={handleSettingsClose} />
      
    </>
  );
};
