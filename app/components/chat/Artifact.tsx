import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
}

export const Artifact = memo(({ messageId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[messageId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      // Filter out Supabase actions except for migrations
      return Object.values(actions).filter((action) => {
        // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
        return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
      });
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find(
        (action) => action.status !== 'complete' && !(action.type === 'start' && action.status === 'running'),
      );

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions, artifact.type, allActionFinished]);

  // Determine the dynamic title based on state for bundled artifacts
  const dynamicTitle =
    artifact?.type === 'bundled'
      ? allActionFinished
        ? artifact.id === 'restored-project-setup'
          ? 'Project Restored' // Title when restore is complete
          : 'Project Created' // Title when initial creation is complete
        : artifact.id === 'restored-project-setup'
          ? 'Restoring Project...' // Title during restore
          : 'Creating Project...' // Title during initial creation
      : artifact?.title; // Fallback to original title for non-bundled or if artifact is missing

  return (
    <>
      <motion.div 
        className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-xl w-full transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm bg-gradient-to-br from-bolt-elements-artifacts-background/95 to-bolt-elements-artifacts-background/90"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: cubicEasingFn }}
      >
        <div className="flex relative">
          {/* Gradient overlay for visual depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bolt-elements-artifacts-background/10 to-transparent opacity-50 pointer-events-none" />
          
          <motion.button
            className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-gray-800/80 w-full overflow-hidden transition-all duration-200 group relative"
            onClick={() => {
              const showWorkbench = workbenchStore.showWorkbench.get();
              workbenchStore.showWorkbench.set(!showWorkbench);
            }}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            {/* Dark hover effect */}
            <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="px-6 py-4 w-full text-left relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-bolt-elements-loader-progress to-bolt-elements-icon-success animate-pulse" />
                <div className="w-full text-bolt-elements-textPrimary font-semibold leading-5 text-sm tracking-wide">
                  {/* Use the dynamic title here */}
                  {dynamicTitle}
                </div>
              </div>
              <div className="w-full text-bolt-elements-textSecondary text-xs mt-1 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                <span className="inline-flex items-center gap-1">
                  <div className="i-ph:cursor-click text-xs" />
                  Cliquez pour ouvrir l'atelier
                </span>
              </div>
            </div>
          </motion.button>
          
          {artifact.type !== 'bundled' && (
            <div className="bg-gradient-to-b from-bolt-elements-artifacts-borderColor/50 to-bolt-elements-artifacts-borderColor w-[1px] opacity-60" />
          )}
          
          <AnimatePresence>
            {actions.length && artifact.type !== 'bundled' && (
              <motion.button
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: cubicEasingFn }}
                className="bg-bolt-elements-artifacts-background hover:bg-gray-800/80 transition-all duration-200 group relative overflow-hidden"
                onClick={toggleActions}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-4 relative z-10">
                  <motion.div 
                    className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}
                    animate={{ rotate: showActions ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {artifact.type === 'bundled' && (
          <motion.div 
            className="flex items-center gap-3 p-6 bg-gradient-to-r from-bolt-elements-actions-background to-bolt-elements-actions-background/95 border-t border-bolt-elements-artifacts-borderColor/50 relative overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bolt-elements-loader-progress/5 to-transparent opacity-30" />
            
            <motion.div 
              className={classNames('text-xl relative z-10', getIconColor(allActionFinished ? 'complete' : 'running'))}
              animate={allActionFinished ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {allActionFinished ? (
                <motion.div 
                  className="i-ph:check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                />
              ) : (
                <div className="i-svg-spinners:90-ring-with-bg"></div>
              )}
            </motion.div>
            
            <div className="flex flex-col gap-1 relative z-10">
              <div className="text-bolt-elements-textPrimary font-semibold leading-5 text-sm tracking-wide">
                {/* This status text remains the same */}
                {allActionFinished
                  ? artifact.id === 'restored-project-setup'
                    ? 'Restore files from snapshot'
                    : 'Fichiers initiaux créés'
                  : 'Création des fichiers initiaux'}
              </div>
              {!allActionFinished && (
                <div className="text-bolt-elements-textSecondary text-xs opacity-80">
                  Veuillez patienter pendant que nous mettons en place votre projet...
                </div>
              )}
            </div>
            
            {/* Progress indicator */}
            {!allActionFinished && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-bolt-elements-artifacts-borderColor/20">
                <motion.div 
                  className="h-full bg-gradient-to-r from-bolt-elements-loader-progress to-bolt-elements-icon-success"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        )}
        <AnimatePresence>
          {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
            <motion.div
              className="actions overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: '0px', opacity: 0 }}
              transition={{ duration: 0.25, ease: cubicEasingFn }}
            >
              <div className="bg-gradient-to-r from-transparent via-bolt-elements-artifacts-borderColor to-transparent h-[1px] opacity-60" />

              <div className="p-6 text-left bg-gradient-to-br from-bolt-elements-actions-background to-bolt-elements-actions-background/95 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-bolt-elements-loader-progress/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-bolt-elements-icon-success/5 to-transparent rounded-full translate-y-12 -translate-x-12" />
                
                <div className="relative z-10">
                  <ActionList actions={actions} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: shellHighlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-1.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                delay: index * 0.05,
                ease: cubicEasingFn,
              }}
              className="group"
            >
              <motion.div 
                className="flex items-center gap-2 p-2 rounded-lg bg-bolt-elements-artifacts-background/50 border border-bolt-elements-artifacts-borderColor/30 hover:border-gray-600/60 hover:bg-gray-800/40 transition-all duration-200 relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className={classNames('text-base relative z-10', getIconColor(action.status))}
                  animate={status === 'complete' ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {status === 'running' ? (
                    type !== 'start' ? <div className="i-svg-spinners:90-ring-with-bg"></div> 
                                   : <div className="i-ph:terminal-window-duotone"></div>
                  ) : status === 'pending' ? (
                    <div className="i-ph:circle-duotone opacity-60"></div>
                  ) : status === 'complete' ? (
                    <motion.div 
                      className="i-ph:check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, ease: "backOut" }}
                    />
                  ) : (
                    <motion.div 
                      className="i-ph:x"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </motion.div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  {type === 'file' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-bolt-elements-textPrimary text-xs font-medium">Créer:</span>
                      <motion.code
                        className="bg-bolt-elements-artifacts-inlineCode-background px-2 py-0.5 rounded text-bolt-elements-item-contentAccent hover:bg-gray-700/80 cursor-pointer text-xs font-mono truncate"
                        onClick={() => openArtifactInWorkbench(action.filePath)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={action.filePath}
                      >
                        {action.filePath}
                      </motion.code>
                    </div>
                  ) : type === 'shell' ? (
                    <div className="text-bolt-elements-textPrimary text-xs">
                      <span className="font-medium">Commande à exécuter</span>
                    </div>
                  ) : (
                    <motion.a
                      onClick={e => {
                        e.preventDefault();
                        workbenchStore.currentView.set('preview');
                      }}
                      className="flex items-center gap-2 cursor-pointer group-hover:text-bolt-elements-item-contentAccent"
                      whileHover={{ x: 2 }}
                    >
                      <span className="text-bolt-elements-textPrimary text-xs font-medium">Démarrage de l'application</span>
                      <div className="i-ph:arrow-right text-xs opacity-60 group-hover:opacity-100" />
                    </motion.a>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
              
              {(type === 'shell' || type === 'start') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 ml-6"
                >
                  <div className="bg-bolt-elements-artifacts-background/80 rounded-lg border border-bolt-elements-artifacts-borderColor/30 overflow-hidden">
                    <ShellCodeBlock
                      classsName={classNames('p-2', {
                        'mb-0': isLast,
                      })}
                      code={content}
                    />
                  </div>
                </motion.div>
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
