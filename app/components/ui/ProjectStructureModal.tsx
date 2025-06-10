import { forwardRef, type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface ProjectStructureModalProps {
  children: ReactNode;
  className?: string;
}

export const ProjectStructureModal = forwardRef<HTMLDivElement, ProjectStructureModalProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'fixed inset-0 z-50 flex items-center justify-center p-8',
          'bg-gradient-to-br from-black/80 via-purple-950/40 to-black/80',
          'backdrop-blur-2xl transition-all duration-700 ease-out',
          'animate-fade-in',
          className
        )}
        {...props}
      >
        <div className={classNames(
          // 'w-[95vw] max-w-12xl max-h-[90vh]',
          'bg-gradient-to-br from-bolt-elements-bg-depth-2/95 via-bolt-elements-bg-depth-1/90 to-bolt-elements-bg-depth-2/95',
          'rounded-2xl shadow-2xl border border-bolt-elements-borderColor/30',
          'overflow-hidden transform transition-all duration-500',
          'backdrop-blur-xl animate-scale-in',
          'relative'
        )}>
          {children}
        </div>
      </div>
    );
  }
);

ProjectStructureModal.displayName = 'ProjectStructureModal';

export const ProjectStructureModalRoot = forwardRef<HTMLDivElement, ProjectStructureModalProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames('flex flex-col h-full relative overflow-hidden', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProjectStructureModalRoot.displayName = 'ProjectStructureModalRoot';

export const ProjectStructureModalHeader = forwardRef<HTMLDivElement, ProjectStructureModalProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'flex items-center justify-between px-8 py-6',
          'border-b border-bolt-elements-borderColor/20',
          'bg-bolt-elements-bg-depth-1/50',
          'backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProjectStructureModalHeader.displayName = 'ProjectStructureModalHeader';

interface ProjectStructureModalTabsProps {
  children: ReactNode;
  className?: string;
}

export const ProjectStructureModalTabs = forwardRef<HTMLDivElement, ProjectStructureModalTabsProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'flex border-b border-bolt-elements-borderColor/15',
          'bg-bolt-elements-bg-depth-2/30',
          'px-2 overflow-x-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProjectStructureModalTabs.displayName = 'ProjectStructureModalTabs';

export const ProjectStructureModalContent = forwardRef<HTMLDivElement, ProjectStructureModalProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'flex-1 overflow-y-auto px-8 py-6',
          'bg-bolt-elements-bg-depth-1/90',
          'custom-scrollbar',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProjectStructureModalContent.displayName = 'ProjectStructureModalContent';

export const ProjectStructureModalFooter = forwardRef<HTMLDivElement, ProjectStructureModalProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'flex items-center justify-between px-8 py-6',
          'border-t border-bolt-elements-borderColor/20',
          'bg-bolt-elements-bg-depth-1/50',
          'backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProjectStructureModalFooter.displayName = 'ProjectStructureModalFooter';

// Styles personnalisés pour les scrollbars et animations
export const ProjectStructureModalStyles = () => (
  <style>{`
    /* Scrollbar personnalisée simplifiée */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: var(--bolt-elements-bg-depth-2);
      border-radius: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--bolt-elements-borderColor);
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: var(--bolt-elements-borderColorActive);
    }
    
    /* Cartes simplifiées */
    .compact-card {
      min-height: 140px;
      transition: all 0.2s ease;
      border-radius: 12px;
      background: var(--bolt-elements-bg-depth-2);
      border: 1px solid var(--bolt-elements-borderColor)/30;
    }
    
    .compact-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: var(--bolt-elements-borderColorActive)/50;
    }
    
    .compact-text {
      line-height: 1.5;
      transition: color 0.2s ease;
    }
    
    .compact-card:hover .compact-text {
      color: var(--bolt-elements-textPrimary);
    }
    
    /* Amélioration des lignes clampées */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Arbre de dossiers simplifié */
    .folder-tree {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    
    .folder-tree .folder-item {
      padding: 4px 0 4px 16px;
      border-left: 2px solid var(--bolt-elements-borderColor)/40;
      margin-left: 16px;
      transition: all 0.2s ease;
      border-radius: 0 6px 6px 0;
    }
    
    .folder-tree .folder-item:hover {
      border-left-color: var(--bolt-elements-borderColorActive);
      background: var(--bolt-elements-bg-depth-2)/50;
      padding-left: 20px;
    }
    
    /* Onglets simplifiés */
    .project-structure-tab {
      transition: all 0.2s ease;
      border-radius: 8px 8px 0 0;
      background: var(--bolt-elements-bg-depth-2);
      position: relative;
    }
    
    .project-structure-tab::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--bolt-elements-borderColorActive);
      transform: scaleX(0);
      transition: transform 0.2s ease;
    }
    
    .project-structure-tab.active::after {
      transform: scaleX(1);
    }
    
    .project-structure-tab.active {
      background: var(--bolt-elements-bg-depth-1);
    }
    
    /* Boutons simplifiés */
    .project-structure-button {
      transition: all 0.2s ease;
      border-radius: 8px;
      background: var(--bolt-elements-bg-depth-2);
      border: 1px solid var(--bolt-elements-borderColor)/30;
    }
    
    .project-structure-button:hover {
      transform: translateY(-1px);
      background: var(--bolt-elements-bg-depth-1);
      border-color: var(--bolt-elements-borderColorActive)/50;
    }
    
    .project-structure-button:active {
      transform: translateY(0);
    }
    
    /* Animations simplifiées */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.3s ease;
    }
    
    .animate-scale-in {
      animation: scaleIn 0.3s ease;
    }
    
    /* Accessibilité */
    .project-structure-tab:focus-visible,
    .project-structure-button:focus-visible {
      outline: 2px solid var(--bolt-elements-borderColorActive);
      outline-offset: 2px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .folder-tree {
        font-size: 0.8rem;
      }
      
      .compact-card {
        min-height: 120px;
      }
    }
    
    /* Mouvement réduit */
    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
        animation: none !important;
      }
    }
  `}</style>
);