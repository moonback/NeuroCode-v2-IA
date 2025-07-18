import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { Switch } from '~/components/ui/Switch';
import { classNames } from '~/utils/classNames';
import { tabConfigurationStore, resetTabConfiguration, developerModeStore } from '~/lib/stores/settings';
import { 
  TAB_LABELS, 
  TAB_ICONS, 
  DEFAULT_USER_TABS, 
  OPTIONAL_USER_TABS, 
  ALL_USER_TABS, 
  BETA_TABS 
} from '~/components/@settings/core/constants';
import type { TabType, TabVisibilityConfig, UserTabConfig, DevTabConfig } from '~/components/@settings/core/types';
import { toast } from 'react-toastify';
import { TbLayoutGrid, TbRefresh, TbGripVertical } from 'react-icons/tb';
import { useSettingsStore } from '~/lib/stores/settings';
import { DraggableTabList } from './DraggableTabList';

// Beta label component
const BetaLabel = () => (
  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-500 font-medium">BETA</span>
);

export const TabManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const tabConfiguration = useStore(tabConfigurationStore);
  const isDeveloperMode = useStore(developerModeStore);
  const { setSelectedTab } = useSettingsStore();

  const handleTabVisibilityChange = (tabId: TabType, checked: boolean) => {
    // Get current tab configuration
    const currentTab = tabConfiguration.userTabs.find((tab) => tab.id === tabId);

    // If tab doesn't exist in configuration, create it
    if (!currentTab) {
      const newTab = {
        id: tabId,
        visible: checked,
        window: 'user' as const,
        order: tabConfiguration.userTabs.length,
      };

      const updatedTabs = [...tabConfiguration.userTabs, newTab];

      tabConfigurationStore.set({
        ...tabConfiguration,
        userTabs: updatedTabs,
      });

      toast.success(`Tab ${checked ? 'enabled' : 'disabled'} successfully`);

      return;
    }

    // Check if tab can be enabled in user mode
    const canBeEnabled = DEFAULT_USER_TABS.includes(tabId) || OPTIONAL_USER_TABS.includes(tabId);

    if (!canBeEnabled && checked) {
      toast.error('This tab cannot be enabled in user mode');
      return;
    }

    // Update tab visibility
    const updatedTabs = tabConfiguration.userTabs.map((tab) => {
      if (tab.id === tabId) {
        return { ...tab, visible: checked };
      }

      return tab;
    });

    // Update store
    tabConfigurationStore.set({
      ...tabConfiguration,
      userTabs: updatedTabs,
    });

    // Show success message
    toast.success(`Tab ${checked ? 'enabled' : 'disabled'} successfully`);
  };

  const handleTabReorder = (reorderedTabs: TabVisibilityConfig[]) => {
    // Separate tabs by window type
    const userTabs = reorderedTabs.filter((tab): tab is UserTabConfig => tab.window === 'user');
    const developerTabs = reorderedTabs.filter((tab): tab is DevTabConfig => tab.window === 'developer');
    
    tabConfigurationStore.set({
      ...tabConfiguration,
      userTabs,
      developerTabs,
    });
    toast.success('Tab order updated successfully');
  };

  const handleWindowChange = (tab: TabVisibilityConfig, window: 'user' | 'developer') => {
    // Remove tab from current window
    const updatedUserTabs = tabConfiguration.userTabs.filter(t => t.id !== tab.id);
    const updatedDeveloperTabs = (tabConfiguration.developerTabs || []).filter(t => t.id !== tab.id);
    
    // Add tab to new window
    const updatedTab = { ...tab, window } as TabVisibilityConfig;
    
    if (window === 'user') {
      updatedUserTabs.push(updatedTab as UserTabConfig);
    } else {
      updatedDeveloperTabs.push(updatedTab as DevTabConfig);
    }
    
    tabConfigurationStore.set({
      ...tabConfiguration,
      userTabs: updatedUserTabs,
      developerTabs: updatedDeveloperTabs,
    });
    
    toast.success(`Tab moved to ${window} mode`);
  };

  const handleVisibilityChange = (tab: TabVisibilityConfig, visible: boolean) => {
    handleTabVisibilityChange(tab.id, visible);
  };

  const handleResetConfiguration = () => {
    resetTabConfiguration();
    toast.success('Tab configuration reset to defaults');
  };

  // Create a map of existing tab configurations
  const tabConfigMap = new Map(tabConfiguration.userTabs.map((tab) => [tab.id, tab]));

  // Generate the complete list of tabs, including those not in the configuration
  const allTabs = ALL_USER_TABS.map((tabId) => {
    return (
      tabConfigMap.get(tabId) || {
        id: tabId,
        visible: false,
        window: 'user' as const,
        order: -1,
      }
    );
  });

  // Filter tabs based on search query
  const filteredTabs = allTabs.filter((tab) => TAB_LABELS[tab.id].toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    // Reset to first tab when component unmounts
    return () => {
      setSelectedTab('user'); // Reset to user tab when unmounting
    };
  }, [setSelectedTab]);

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mt-8 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={classNames(
                'w-8 h-8 flex items-center justify-center rounded-lg',
                'bg-bolt-elements-background-depth-3',
                'text-purple-500',
              )}
            >
              <TbLayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-md font-medium text-bolt-elements-textPrimary">Tab Management</h4>
              <p className="text-sm text-bolt-elements-textSecondary">
                Configure visible tabs and their order {isDeveloperMode && '(Developer Mode)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-bolt-elements-background-depth-2 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={classNames(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'grid'
                    ? 'bg-purple-500 text-white'
                    : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                )}
              >
                <TbLayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={classNames(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-purple-500 text-white'
                    : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                )}
              >
                <TbGripVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetConfiguration}
              className={classNames(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-bolt-elements-background-depth-2',
                'border border-bolt-elements-borderColor',
                'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-all duration-200'
              )}
            >
              <TbRefresh className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>

            {/* Search */}
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="i-ph:magnifying-glass w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tabs..."
                className={classNames(
                  'w-full pl-10 pr-4 py-2 rounded-lg',
                  'bg-bolt-elements-background-depth-2',
                  'border border-bolt-elements-borderColor',
                  'text-bolt-elements-textPrimary',
                  'placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
                  'transition-all duration-200',
                )}
              />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {viewMode === 'list' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <TbGripVertical className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-bolt-elements-textPrimary">
                Drag & Drop Mode - Reorder tabs by dragging
              </span>
            </div>
            <DraggableTabList
               tabs={filteredTabs.sort((a, b) => (a.order || 0) - (b.order || 0))}
               onReorder={handleTabReorder}
               onWindowChange={isDeveloperMode ? handleWindowChange : undefined}
               onVisibilityChange={handleVisibilityChange}
               showControls={true}
             />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Section Header */}
          {filteredTabs.some((tab) => DEFAULT_USER_TABS.includes(tab.id)) && (
            <div className="col-span-full flex items-center gap-2 mt-4 mb-2">
              <div className="i-ph:star-fill w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-bolt-elements-textPrimary">Default Tabs</span>
            </div>
          )}

          {/* Default Tabs */}
          {filteredTabs
            .filter((tab) => DEFAULT_USER_TABS.includes(tab.id))
            .map((tab, index) => (
              <motion.div
                key={tab.id}
                className={classNames(
                  'rounded-lg border bg-bolt-elements-background text-bolt-elements-textPrimary',
                  'bg-bolt-elements-background-depth-2',
                  'hover:bg-bolt-elements-background-depth-3',
                  'transition-all duration-200',
                  'relative overflow-hidden group',
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Status Badges */}
                <div className="absolute top-1 right-1.5 flex gap-1">
                  <span className="px-1.5 py-0.25 text-xs rounded-full bg-purple-500/10 text-purple-500 font-medium mr-2">
                    Default
                  </span>
                </div>

                <div className="flex items-start gap-4 p-4">
                  <motion.div
                    className={classNames(
                      'w-10 h-10 flex items-center justify-center rounded-xl',
                      'bg-bolt-elements-background-depth-3 group-hover:bg-bolt-elements-background-depth-4',
                      'transition-all duration-200',
                      tab.visible ? 'text-purple-500' : 'text-bolt-elements-textSecondary',
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className={classNames('w-6 h-6', 'transition-transform duration-200', 'group-hover:rotate-12')}
                    >
                      <div className={classNames(TAB_ICONS[tab.id], 'w-full h-full')} />
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-purple-500 transition-colors">
                            {TAB_LABELS[tab.id]}
                          </h4>
                          {BETA_TABS.has(tab.id) && <BetaLabel />}
                        </div>
                        <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                          {tab.visible ? 'Visible in user mode' : 'Hidden in user mode'}
                        </p>
                      </div>
                      <Switch
                        checked={tab.visible}
                        onCheckedChange={(checked) => {
                          const isDisabled =
                            !DEFAULT_USER_TABS.includes(tab.id) && !OPTIONAL_USER_TABS.includes(tab.id);

                          if (!isDisabled) {
                            handleTabVisibilityChange(tab.id, checked);
                          }
                        }}
                        className={classNames('data-[state=checked]:bg-purple-500 ml-4', {
                          'opacity-50 pointer-events-none':
                            !DEFAULT_USER_TABS.includes(tab.id) && !OPTIONAL_USER_TABS.includes(tab.id),
                        })}
                      />
                    </div>
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 border-2 border-purple-500/0 rounded-lg pointer-events-none"
                  animate={{
                    borderColor: tab.visible ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0)',
                    scale: tab.visible ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            ))}

          {/* Optional Section Header */}
          {filteredTabs.some((tab) => OPTIONAL_USER_TABS.includes(tab.id)) && (
            <div className="col-span-full flex items-center gap-2 mt-8 mb-2">
              <div className="i-ph:plus-circle-fill w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-bolt-elements-textPrimary">Optional Tabs</span>
            </div>
          )}

          {/* Optional Tabs */}
          {filteredTabs
            .filter((tab) => OPTIONAL_USER_TABS.includes(tab.id))
            .map((tab, index) => (
              <motion.div
                key={tab.id}
                className={classNames(
                  'rounded-lg border bg-bolt-elements-background text-bolt-elements-textPrimary',
                  'bg-bolt-elements-background-depth-2',
                  'hover:bg-bolt-elements-background-depth-3',
                  'transition-all duration-200',
                  'relative overflow-hidden group',
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Status Badges */}
                <div className="absolute top-1 right-1.5 flex gap-1">
                  <span className="px-1.5 py-0.25 text-xs rounded-full bg-blue-500/10 text-blue-500 font-medium mr-2">
                    Optional
                  </span>
                </div>

                <div className="flex items-start gap-4 p-4">
                  <motion.div
                    className={classNames(
                      'w-10 h-10 flex items-center justify-center rounded-xl',
                      'bg-bolt-elements-background-depth-3 group-hover:bg-bolt-elements-background-depth-4',
                      'transition-all duration-200',
                      tab.visible ? 'text-purple-500' : 'text-bolt-elements-textSecondary',
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className={classNames('w-6 h-6', 'transition-transform duration-200', 'group-hover:rotate-12')}
                    >
                      <div className={classNames(TAB_ICONS[tab.id], 'w-full h-full')} />
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-purple-500 transition-colors">
                            {TAB_LABELS[tab.id]}
                          </h4>
                          {BETA_TABS.has(tab.id) && <BetaLabel />}
                        </div>
                        <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                          {tab.visible ? 'Visible in user mode' : 'Hidden in user mode'}
                        </p>
                      </div>
                      <Switch
                        checked={tab.visible}
                        onCheckedChange={(checked) => {
                          const isDisabled =
                            !DEFAULT_USER_TABS.includes(tab.id) && !OPTIONAL_USER_TABS.includes(tab.id);

                          if (!isDisabled) {
                            handleTabVisibilityChange(tab.id, checked);
                          }
                        }}
                        className={classNames('data-[state=checked]:bg-purple-500 ml-4', {
                          'opacity-50 pointer-events-none':
                            !DEFAULT_USER_TABS.includes(tab.id) && !OPTIONAL_USER_TABS.includes(tab.id),
                        })}
                      />
                    </div>
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 border-2 border-purple-500/0 rounded-lg pointer-events-none"
                  animate={{
                    borderColor: tab.visible ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0)',
                    scale: tab.visible ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
