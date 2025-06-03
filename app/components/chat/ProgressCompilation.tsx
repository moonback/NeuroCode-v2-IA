import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import type { ProgressAnnotation } from '~/types/context';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

export default function ProgressCompilation({ data }: { data?: ProgressAnnotation[] }) {
  const [progressList, setProgressList] = React.useState<ProgressAnnotation[]>([]);
  const [expanded, setExpanded] = useState(false);
  React.useEffect(() => {
    if (!data || data.length == 0) {
      setProgressList([]);
      return;
    }

    const progressMap = new Map<string, ProgressAnnotation>();
    data.forEach((x) => {
      const existingProgress = progressMap.get(x.label);

      if (existingProgress && existingProgress.status === 'complete') {
        return;
      }

      progressMap.set(x.label, x);
    });

    const newData = Array.from(progressMap.values());
    newData.sort((a, b) => a.order - b.order);
    setProgressList(newData);
  }, [data]);

  if (progressList.length === 0) {
    return <></>;
  }

  // Calculer le nombre d'étapes terminées
  const completedSteps = progressList.filter(item => item.status === 'complete').length;
  const totalSteps = progressList.length;
  const inProgress = progressList.some(item => item.status === 'in-progress');

  return (
    <AnimatePresence>
      <div
        className={classNames(
          'bg-bolt-elements-background-depth-2',
          'border border-bolt-elements-borderColor',
          'shadow-lg rounded-lg relative w-full max-w-chat mx-auto z-prompt',
          'p-3',
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="i-ph:robot text-purple-500 w-5 h-5"></div>
            <h3 className="font-semibold text-bolt-elements-textPrimary">Progression de l'Agent IA</h3>
          </div>
          <div className="text-xs text-bolt-elements-textSecondary">
            {completedSteps}/{totalSteps} étapes {inProgress ? "(en cours...)" : "(terminé)"}
          </div>
        </div>

        <div
          className={classNames(
            'bg-bolt-elements-item-backgroundAccent',
            'p-2 rounded-lg text-bolt-elements-item-contentAccent',
            'flex',
          )}
        >
          <div className="flex-1">
            <AnimatePresence>
              {expanded ? (
                <motion.div
                  className="actions"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: '0px' }}
                  transition={{ duration: 0.15 }}
                >
                  {progressList.map((x, i) => {
                    return <ProgressItem key={i} progress={x} />;
                  })}
                </motion.div>
              ) : (
                <ProgressItem progress={progressList.slice(-1)[0]} />
              )}
            </AnimatePresence>
          </div>
          <motion.button
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.15, ease: cubicEasingFn }}
            className="p-1 rounded-lg bg-bolt-elements-item-backgroundAccent hover:bg-bolt-elements-artifacts-backgroundHover"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Réduire les détails" : "Afficher tous les détails"}
            title={expanded ? "Réduire les détails" : "Afficher tous les détails"}
          >
            <div className={expanded ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
          </motion.button>
        </div>
      </div>
    </AnimatePresence>
  );
}

const ProgressItem = ({ progress }: { progress: ProgressAnnotation }) => {
  // Définir les couleurs selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'text-blue-400';
      case 'complete':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return '';
    }
  };

  return (
    <motion.div
      className={classNames('flex text-sm gap-3 p-1.5 rounded-md', {
        'bg-bolt-elements-background-depth-1': progress.status === 'in-progress',
      })}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className={classNames('flex items-center gap-2', getStatusColor(progress.status))}>
        <div className="flex-shrink-0">
          {progress.status === 'in-progress' ? (
            <div className="i-svg-spinners:90-ring-with-bg w-4 h-4"></div>
          ) : progress.status === 'complete' ? (
            <div className="i-ph:check-circle-fill w-4 h-4"></div>
          ) : progress.status === 'error' ? (
            <div className="i-ph:warning-circle-fill w-4 h-4"></div>
          ) : null}
        </div>
        <span className="font-medium">{progress.label}</span>
      </div>
      <div className="flex-1 text-bolt-elements-textSecondary">{progress.message}</div>
    </motion.div>
  );
};
