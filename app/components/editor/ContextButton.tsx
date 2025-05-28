import { memo } from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { contextItems, isContextPanelOpen, toggleContextPanel } from '~/lib/stores/context';

const ContextButton = memo(() => {
  const items = useStore(contextItems);
  const isOpen = useStore(isContextPanelOpen);
  const itemCount = Object.keys(items).length;

  const handleClick = () => {
    toggleContextPanel();
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-40 flex items-center justify-center gap-2 rounded-full bg-bolt-elements-background-depth-2 p-2 shadow-md hover:bg-bolt-elements-background-depth-3 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="i-ph:brain size-5 text-bolt-elements-textPrimary" />
      {itemCount > 0 && (
        <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bolt-elements-accent text-xs text-white">
          {itemCount}
        </div>
      )}
    </motion.button>
  );
});

export default ContextButton;