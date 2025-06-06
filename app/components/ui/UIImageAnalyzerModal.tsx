import React, { memo, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { IconButton } from './IconButton';
import { Button } from './Button';

export { Close as UIImageAnalyzerModalClose, Root as UIImageAnalyzerModalRoot } from '@radix-ui/react-dialog';

interface UIImageAnalyzerModalProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  onBackdrop?: () => void;
}

interface UIImageAnalyzerModalHeaderProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onClose?: () => void;
}

interface UIImageAnalyzerModalStepsProps {
  currentStep: number;
  steps: Array<{
    key: number;
    label: string;
    icon: string;
    completed: boolean;
  }>;
}

interface UIImageAnalyzerModalContentProps {
  children: ReactNode;
  className?: string;
}

interface UIImageAnalyzerModalFooterProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  onCancel?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  cancelLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
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

// Composant principal du modal - Version optimisée pour l'analyseur d'images
export const UIImageAnalyzerModal = memo(({ children, className, onClose, onBackdrop }: UIImageAnalyzerModalProps) => {
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
            'z-[9999] w-[90vw] max-w-[900px] h-[85vh] max-h-[700px]',
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

// En-tête avec indicateur de progression
export const UIImageAnalyzerModalHeader = memo(({ 
  title, 
  description, 
  currentStep, 
  totalSteps 
}: UIImageAnalyzerModalHeaderProps) => {
  return (
    <div className="px-6 py-4 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-6">
          <h2 className="text-xl font-bold text-bolt-elements-textPrimary mb-1">
            {title}
          </h2>
          <p className="text-bolt-elements-textSecondary text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
          <span className="font-medium">Étape {currentStep} sur {totalSteps}</span>
        </div>
      </div>
    </div>
  );
});

// Indicateur de progression par étapes
export const UIImageAnalyzerModalSteps = memo(({ currentStep, steps }: UIImageAnalyzerModalStepsProps) => {
  return (
    <div className="px-6 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
      <div className="flex items-center gap-3">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <motion.div
                className={classNames(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  currentStep >= step.key
                    ? 'bg-bolt-elements-item-contentAccent text-white'
                    : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary'
                )}
                animate={{ scale: currentStep === step.key ? 1.1 : 1 }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              >
                {step.completed ? (
                  <span className="i-ph:check text-sm" />
                ) : (
                  <span className={`${step.icon} text-sm`} />
                )}
              </motion.div>
              <span className={classNames(
                'text-sm font-medium hidden sm:inline',
                currentStep >= step.key
                  ? 'text-bolt-elements-item-contentAccent'
                  : 'text-bolt-elements-textTertiary'
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={classNames(
                'flex-1 h-0.5 rounded-full transition-all min-w-8',
                currentStep > step.key
                  ? 'bg-bolt-elements-item-contentAccent'
                  : 'bg-bolt-elements-background-depth-3'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

// Zone de contenu principal
export const UIImageAnalyzerModalContent = memo(({ children, className }: UIImageAnalyzerModalContentProps) => {
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

// Pied de page avec navigation
export const UIImageAnalyzerModalFooter = memo(({ 
  currentStep,
  totalSteps,
  stepLabel,
  onCancel, 
  onNext,
  onPrevious,
  nextLabel = "Suivant",
  previousLabel = "Précédent",
  cancelLabel = "Annuler",
  isNextDisabled = false,
  isLoading = false
}: UIImageAnalyzerModalFooterProps) => {
  return (
    <div className="px-6 py-4 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
      <div className="flex justify-between items-center">
        {/* Indicateur d'étape */}
        <div className="text-sm text-bolt-elements-textSecondary">
          {stepLabel || `Étape ${currentStep} sur ${totalSteps}`}
        </div>
        
        {/* Boutons de navigation */}
        <div className="flex gap-3">
          {onCancel && (
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className="px-4 py-2 text-sm"
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          
          {onPrevious && currentStep > 1 && (
            <Button
              variant="secondary"
              onClick={onPrevious}
              className="px-4 py-2 text-sm flex items-center gap-2"
              disabled={isLoading}
            >
              <span className="i-ph:arrow-left text-sm" />
              {previousLabel}
            </Button>
          )}
          
          {onNext && (
            <Button
              variant="ghost"
              onClick={onNext}
              disabled={isNextDisabled || isLoading}
              className={classNames(
                "px-4 py-2 text-sm flex items-center gap-2",
                !isNextDisabled && !isLoading
                  ? "bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text"
                  : "bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <motion.span
                    className="i-ph:spinner-gap"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Analyse en cours...
                </>
              ) : (
                <>
                  {currentStep === totalSteps ? (
                    <>
                      <span className="i-ph:rocket-launch" />
                      Lancer l'analyse
                    </>
                  ) : (
                    <>
                      {nextLabel}
                      <span className="i-ph:arrow-right text-sm" />
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

// Styles CSS optimisés
export const UIImageAnalyzerModalStyles = () => (
  <style>{`
    .ui-image-analyzer-modal-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: var(--bolt-elements-bg-depth-3) transparent;
    }
    .ui-image-analyzer-modal-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .ui-image-analyzer-modal-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .ui-image-analyzer-modal-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--bolt-elements-bg-depth-3);
      border-radius: 3px;
    }
    .ui-image-analyzer-modal-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: var(--bolt-elements-textTertiary);
    }
    
    /* Animation pour les étapes */
    @keyframes stepGlow {
      0% { box-shadow: 0 0 0 0 rgba(var(--bolt-elements-item-contentAccent-rgb), 0.3); }
      70% { box-shadow: 0 0 0 3px rgba(var(--bolt-elements-item-contentAccent-rgb), 0); }
      100% { box-shadow: 0 0 0 0 rgba(var(--bolt-elements-item-contentAccent-rgb), 0); }
    }
    
    .step-active {
      animation: stepGlow 0.4s ease-out;
    }
    
    /* Styles pour les zones de drop */
    .drop-zone {
      transition: all 0.2s ease;
    }
    
    .drop-zone-active {
      transform: scale(1.02);
      border-color: var(--bolt-elements-item-contentAccent);
      background-color: rgba(var(--bolt-elements-item-backgroundAccent-rgb), 0.1);
    }
  `}</style>
);