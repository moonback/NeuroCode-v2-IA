import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import type { TabVisibilityConfig } from '~/components/@settings/core/types';
import { TAB_LABELS, TAB_ICONS } from '~/components/@settings/core/constants';
import { Switch } from '~/components/ui/Switch';

interface DraggableTabListProps {
  tabs: TabVisibilityConfig[];
  onReorder: (tabs: TabVisibilityConfig[]) => void;
  onWindowChange?: (tab: TabVisibilityConfig, window: 'user' | 'developer') => void;
  onVisibilityChange?: (tab: TabVisibilityConfig, visible: boolean) => void;
  showControls?: boolean;
}

interface DraggableTabItemProps {
  tab: TabVisibilityConfig;
  index: number;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  showControls?: boolean;
  onWindowChange?: (tab: TabVisibilityConfig, window: 'user' | 'developer') => void;
  onVisibilityChange?: (tab: TabVisibilityConfig, visible: boolean) => void;
}

interface DragItem {
  type: string;
  index: number;
  id: string;
}

const DraggableTabItem = ({
  tab,
  index,
  moveTab,
  showControls,
  onWindowChange,
  onVisibilityChange,
}: DraggableTabItemProps) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'tab',
    item: { type: 'tab', index, id: tab.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: 'tab',
    hover: (item: DragItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) {
        return;
      }

      if (item.index === index) {
        return;
      }

      if (item.id === tab.id) {
        return;
      }

      moveTab(item.index, index);
      item.index = index;
    },
  });

  const ref = (node: HTMLDivElement | null) => {
    dragRef(node);
    dropRef(node);
  };

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
      }}
      className={classNames(
        'flex items-center justify-between p-4 rounded-lg',
        'bg-bolt-elements-background-depth-2',
        'border border-bolt-elements-borderColor',
        'hover:bg-bolt-elements-background-depth-3',
        'transition-all duration-200',
        isDragging ? 'z-50 shadow-lg' : '',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="cursor-grab hover:text-purple-500 transition-colors">
          <div className="i-ph:dots-six-vertical w-4 h-4 text-bolt-elements-textSecondary" />
        </div>
        <div className={classNames(
          'w-8 h-8 flex items-center justify-center rounded-lg',
          'bg-bolt-elements-background-depth-3',
          tab.visible ? 'text-purple-500' : 'text-bolt-elements-textSecondary'
        )}>
          <div className={classNames(TAB_ICONS[tab.id], 'w-4 h-4')} />
        </div>
        <div>
          <div className="font-medium text-bolt-elements-textPrimary">{TAB_LABELS[tab.id]}</div>
          {showControls && (
            <div className="text-xs text-bolt-elements-textSecondary">
              Order: {tab.order}, Window: {tab.window}
            </div>
          )}
        </div>
      </div>
      {showControls && !tab.locked && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={tab.visible}
              onCheckedChange={(checked: boolean) => onVisibilityChange?.(tab, checked)}
              className="data-[state=checked]:bg-purple-500"
              aria-label={`Toggle ${TAB_LABELS[tab.id]} visibility`}
            />
            <label className="text-sm text-bolt-elements-textSecondary">Visible</label>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-bolt-elements-textSecondary">User</label>
            <Switch
              checked={tab.window === 'developer'}
              onCheckedChange={(checked: boolean) => onWindowChange?.(tab, checked ? 'developer' : 'user')}
              className="data-[state=checked]:bg-purple-500"
              aria-label={`Toggle ${TAB_LABELS[tab.id]} window assignment`}
            />
            <label className="text-sm text-bolt-elements-textSecondary">Dev</label>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const DraggableTabList = ({
  tabs,
  onReorder,
  onWindowChange,
  onVisibilityChange,
  showControls = false,
}: DraggableTabListProps) => {
  const moveTab = (dragIndex: number, hoverIndex: number) => {
    const items = Array.from(tabs);
    const [reorderedItem] = items.splice(dragIndex, 1);
    items.splice(hoverIndex, 0, reorderedItem);

    // Update order numbers based on position
    const reorderedTabs = items.map((tab, index) => ({
      ...tab,
      order: index + 1,
    }));

    onReorder(reorderedTabs);
  };

  return (
    <div className="space-y-2">
      {tabs.map((tab, index) => (
        <DraggableTabItem
          key={tab.id}
          tab={tab}
          index={index}
          moveTab={moveTab}
          showControls={showControls}
          onWindowChange={onWindowChange}
          onVisibilityChange={onVisibilityChange}
        />
      ))}
    </div>
  );
};
