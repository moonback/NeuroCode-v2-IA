import React from 'react';
import { Badge } from './Badge';
import { classNames } from '~/utils/classNames';
import { formatSize } from '~/utils/formatSize';

interface RepositoryStatsProps {
  stats: {
    totalFiles?: number;
    totalSize?: number;
    languages?: Record<string, number>;
    hasPackageJson?: boolean;
    hasDependencies?: boolean;
  };
  className?: string;
  compact?: boolean;
}

export function RepositoryStats({ stats, className, compact = false }: RepositoryStatsProps) {
  const { totalFiles, totalSize, languages, hasPackageJson, hasDependencies } = stats;

  return (
    <div className={classNames('space-y-4', className)}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <span className="i-ph:chart-bar text-purple-500 w-5 h-5" />
          <h3 className="text-base font-semibold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark">
            Statistiques du Dépôt
          </h3>
        </div>
      )}

      <div className={classNames('grid gap-3', compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
        {totalFiles !== undefined && (
          <div className="group relative overflow-hidden rounded-lg border border-bolt-elements-borderColor/20 dark:border-bolt-elements-borderColor-dark/20 bg-gradient-to-br from-purple-50/50 to-white/50 dark:from-purple-900/10 dark:to-bolt-elements-background-depth-2/50 p-4 transition-all duration-200 hover:shadow-md hover:border-purple-300/40 dark:hover:border-purple-500/40">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
                <span className="i-ph:files text-purple-600 dark:text-purple-400 w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary-dark uppercase tracking-wide">
                  Fichiers Totaux
                </p>
                <p className="text-lg font-bold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark">
                  {totalFiles.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {totalSize !== undefined && (
          <div className="group relative overflow-hidden rounded-lg border border-bolt-elements-borderColor/20 dark:border-bolt-elements-borderColor-dark/20 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-blue-900/10 dark:to-bolt-elements-background-depth-2/50 p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300/40 dark:hover:border-blue-500/40">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                <span className="i-ph:database text-blue-600 dark:text-blue-400 w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary-dark uppercase tracking-wide">
                  Taille du Dépôt
                </p>
                <p className="text-lg font-bold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark">
                  {formatSize(totalSize)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {languages && Object.keys(languages).length > 0 && (
        <div className="rounded-lg border border-bolt-elements-borderColor/20 dark:border-bolt-elements-borderColor-dark/20 bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-900/10 dark:to-bolt-elements-background-depth-2/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
              <span className="i-ph:code text-emerald-600 dark:text-emerald-400 w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark">
              Langages
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(languages)
              .sort(([, a], [, b]) => b - a)
              .slice(0, compact ? 3 : 6)
              .map(([lang, size], index) => {
                const colors = [
                  'primary',
                  'success', 
                  'info',
                  'warning',
                  'secondary',
                  'subtle'
                ] as const;
                const variant = colors[index % colors.length];
                
                return (
                  <Badge key={lang} variant={variant} size={compact ? 'sm' : 'md'}>
                    {lang} ({formatSize(size)})
                  </Badge>
                );
              })}
            {Object.keys(languages).length > (compact ? 3 : 6) && (
              <Badge variant="outline" size={compact ? 'sm' : 'md'}>
                +{Object.keys(languages).length - (compact ? 3 : 6)} de plus
              </Badge>
            )}
          </div>
        </div>
      )}

      {(hasPackageJson || hasDependencies) && (
        <div className="rounded-lg border border-bolt-elements-borderColor/20 dark:border-bolt-elements-borderColor-dark/20 bg-gradient-to-br from-amber-50/50 to-white/50 dark:from-amber-900/10 dark:to-bolt-elements-background-depth-2/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5">
              <span className="i-ph:gear text-amber-600 dark:text-amber-400 w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark">
              Configuration du Projet
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasPackageJson && (
              <Badge variant="success" size={compact ? 'sm' : 'md'} icon="i-ph:package w-3.5 h-3.5">
                package.json
              </Badge>
            )}
            {hasDependencies && (
              <Badge variant="info" size={compact ? 'sm' : 'md'} icon="i-ph:tree-structure w-3.5 h-3.5">
                Dépendances
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
