import React, { memo, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { IconButton } from './IconButton';
import { Button } from './Button';

export { Close as ColorSchemeModalClose, Root as ColorSchemeModalRoot } from '@radix-ui/react-dialog';

interface ColorSchemeModalProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  onBackdrop?: () => void;
}

interface ColorSchemeModalHeaderProps {
  title: string;
  description: string;
  onClose?: () => void;
}

interface ColorSchemeModalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    key: string;
    label: string;
    icon: string;
  }>;
}

interface ColorSchemeModalContentProps {
  children: ReactNode;
  className?: string;
}

interface ColorSchemeModalFooterProps {
  stats: {
    colors: number;
    fonts: number;
    features: number;
  };
  onSaveAsCustom?: () => void;
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
}

const transition = {
  duration: 0.15,
  ease: cubicEasingFn,
};

const backdropVariants = {
  closed: {
    opacity: 0,
    transition,
  },
  open: {
    opacity: 1,
    transition,
  },
} satisfies Variants;

const modalVariants = {
  closed: {
    x: '-50%',
    y: '-45%',
    scale: 0.96,
    opacity: 0,
    transition,
  },
  open: {
    x: '-50%',
    y: '-50%',
    scale: 1,
    opacity: 1,
    transition,
  },
} satisfies Variants;

// Composant principal du modal - Version compacte
export const ColorSchemeModal = memo(({ children, className, onClose, onBackdrop }: ColorSchemeModalProps) => {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay asChild>
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/70 dark:bg-black/80 backdrop-blur-sm"
          initial="closed"
          animate="open"
          exit="closed"
          variants={backdropVariants}
          onClick={onBackdrop}
        />
      </RadixDialog.Overlay>
      <RadixDialog.Content asChild>
        <motion.div
          className={classNames(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-bolt-elements-background-depth-1 dark:bg-gray-950',
            'rounded-xl shadow-2xl border border-bolt-elements-borderColor',
            'z-[9999] w-[85vw] max-w-[1000px] h-[85vh] max-h-[750px]',
            'focus:outline-none overflow-hidden',
            className,
          )}
          initial="closed"
          animate="open"
          exit="closed"
          variants={modalVariants}
        >
          <div className="flex flex-col h-full">
            {children}
            <RadixDialog.Close asChild onClick={onClose}>
              <IconButton
                icon="i-ph:x"
                className="absolute top-3 right-3 text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary z-10 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 rounded-lg p-1.5 w-8 h-8"
              />
            </RadixDialog.Close>
          </div>
        </motion.div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

// En-tête compact
export const ColorSchemeModalHeader = memo(({ title, description }: ColorSchemeModalHeaderProps) => {
  return (
    <div className="px-6 py-4 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-6">
          <h2 className="text-xl font-bold text-bolt-elements-textPrimary mb-1">
            {title}
          </h2>
          <p className="text-bolt-elements-textSecondary text-xs leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
});

// Navigation par onglets compacte
export const ColorSchemeModalTabs = memo(({ activeTab, onTabChange, tabs }: ColorSchemeModalTabsProps) => {
  return (
    <div className="px-6 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
      <div className="flex gap-0.5 p-0.5 bg-bolt-elements-bg-depth-3 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={classNames(
              'relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all duration-150 text-xs',
              activeTab === tab.key
                ? 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary shadow-md ring-1 ring-bolt-elements-borderColor'
                : 'bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-2'
            )}
          >
            <span className={`${tab.icon} text-base`} />
            <span className="hidden sm:inline truncate">{tab.label}</span>
            {activeTab === tab.key && (
              <motion.div
                className="absolute inset-0 bg-bolt-elements-button-primary-background/8 rounded-md"
                layoutId="activeTab"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

// Zone de contenu principal compacte
export const ColorSchemeModalContent = memo(({ children, className }: ColorSchemeModalContentProps) => {
  return (
    <div className={classNames(
      'flex-1 overflow-y-auto px-6 py-4',
      'scrollbar-thin scrollbar-thumb-bolt-elements-bg-depth-3 scrollbar-track-transparent',
      className
    )}>
      {children}
    </div>
  );
});

// Pied de page compact
export const ColorSchemeModalFooter = memo(({ 
  stats, 
  onSaveAsCustom, 
  onExport, 
  onImport, 
  onCancel, 
  onSave,
  saveLabel = "Sauvegarder",
  cancelLabel = "Annuler"
}: ColorSchemeModalFooterProps) => {
  return (
    <div className="px-6 py-4 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
      <div className="flex justify-between items-center">
        {/* Statistiques et actions rapides compactes */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-bolt-elements-textSecondary">
            <span className="font-medium">{stats.colors}</span> couleurs • 
            <span className="font-medium">{stats.fonts}</span> polices • 
            <span className="font-medium">{stats.features}</span> fonctionnalités
          </div>
          <div className="flex gap-1">
            {onSaveAsCustom && (
              <button
                onClick={onSaveAsCustom}
                className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-150 border border-transparent hover:border-bolt-elements-borderColor"
                title="Sauvegarder comme groupe personnalisé"
              >
                <span className="i-ph:heart text-xs" />
                <span className="hidden sm:inline">Sauvegarder</span>
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-150 border border-transparent hover:border-bolt-elements-borderColor"
                title="Exporter le schéma"
              >
                <span className="i-ph:download-simple text-xs" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
            )}
            {onImport && (
              <label className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-150 cursor-pointer border border-transparent hover:border-bolt-elements-borderColor">
                <span className="i-ph:upload-simple text-xs" />
                <span className="hidden sm:inline">Importer</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImport}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
        
        {/* Boutons d'action principaux compacts */}
        <div className="flex gap-2">
          {onCancel && (
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className="px-4 py-2 text-sm"
            >
              {cancelLabel}
            </Button>
          )}
          {onSave && (
            <Button
              variant="ghost"
              onClick={onSave}
              className="bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text px-4 py-2 text-sm"
            >
              {saveLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

// Styles CSS optimisés pour la version compacte
export const ColorSchemeModalStyles = () => (
  <style>{`
    .color-scheme-modal-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: var(--bolt-elements-bg-depth-3) transparent;
    }
    .color-scheme-modal-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .color-scheme-modal-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .color-scheme-modal-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--bolt-elements-bg-depth-3);
      border-radius: 3px;
    }
    .color-scheme-modal-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: var(--bolt-elements-textTertiary);
    }
    
    /* Animation optimisée pour les onglets */
    @keyframes tabGlow {
      0% { box-shadow: 0 0 0 0 rgba(var(--bolt-elements-button-primary-background-rgb), 0.3); }
      70% { box-shadow: 0 0 0 3px rgba(var(--bolt-elements-button-primary-background-rgb), 0); }
      100% { box-shadow: 0 0 0 0 rgba(var(--bolt-elements-button-primary-background-rgb), 0); }
    }
    
    .tab-active {
      animation: tabGlow 0.4s ease-out;
    }
    
    /* Styles compacts pour les grilles */
    .compact-grid {
      gap: 0.75rem;
    }
    
    .compact-card {
      padding: 0.75rem;
      border-radius: 0.5rem;
    }
    
    .compact-text {
      font-size: 0.75rem;
      line-height: 1.2;
    }
  `}</style>
);