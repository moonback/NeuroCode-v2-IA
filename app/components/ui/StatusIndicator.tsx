import React from 'react';
import { classNames } from '~/utils/classNames';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';

// Status types supported by the component
type StatusType = 'online' | 'offline' | 'away' | 'busy' | 'success' | 'warning' | 'error' | 'info' | 'loading';

// Size types for the indicator
type SizeType = 'sm' | 'md' | 'lg';

// Status color mapping
const STATUS_COLORS: Record<StatusType, { bg: string, border: string, text: string, description: string }> = {
  online: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-600 dark:text-green-400',
    description: 'Connecté'
  },
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-600 dark:text-green-400',
    description: 'Succès'
  },
  offline: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400',
    description: 'Déconnecté'
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400',
    description: 'Erreur'
  },
  away: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    description: 'En attente'
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    description: 'Avertissement'
  },
  busy: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400',
    description: 'Occupé'
  },
  info: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    description: 'Information'
  },
  loading: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    description: 'Chargement'
  },
};

// Size class mapping
const SIZE_CLASSES: Record<SizeType, string> = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3.5 h-3.5',
  lg: 'w-4.5 h-4.5',
};

// Text size mapping based on indicator size
const TEXT_SIZE_CLASSES: Record<SizeType, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

interface StatusIndicatorProps {
  /** The status to display */
  status: StatusType;

  /** Size of the indicator */
  size?: SizeType;

  /** Whether to show a pulsing animation */
  pulse?: boolean;

  /** Optional label text */
  label?: string;

  /** Additional class name */
  className?: string;
  
  /** Custom tooltip text (uses default status description if not provided) */
  tooltip?: string;
  
  /** Whether to show the tooltip */
  showTooltip?: boolean;
}

/**
 * StatusIndicator component
 *
 * A component for displaying status indicators with optional labels and pulse animations.
 */
export function StatusIndicator({ 
  status, 
  size = 'md', 
  pulse = false, 
  label, 
  className,
  tooltip,
  showTooltip = true
}: StatusIndicatorProps) {
  // Get the color classes for the status
  const statusStyle = STATUS_COLORS[status] || {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    description: 'Statut inconnu'
  };

  // Get the size class for the indicator
  const sizeClass = SIZE_CLASSES[size];

  // Get the text size class for the label
  const textSizeClass = TEXT_SIZE_CLASSES[size];
  
  // Tooltip content
  const tooltipContent = tooltip || statusStyle.description;
  
  // Animation variants for the pulse effect
  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    noPulse: {
      scale: 1,
      opacity: 1
    }
  };

  const indicator = (
    <div className={classNames('flex items-center gap-2', className)}>
      {/* Status indicator dot with enhanced styling */}
      <div className="relative">
        <motion.span 
          className={classNames(
            'rounded-full relative border-2 shadow-sm flex items-center justify-center',
            statusStyle.bg,
            statusStyle.border,
            sizeClass
          )}
          variants={pulseVariants}
          animate={pulse ? "pulse" : "noPulse"}
        >
          {/* Inner dot for better visual hierarchy */}
          <span className={classNames(
            'absolute rounded-full',
            statusStyle.border.replace('border', 'bg'),
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2'
          )} />
        </motion.span>
      </div>

      {/* Enhanced label with proper styling */}
      {label && (
        <span
          className={classNames(
            statusStyle.text,
            'font-medium tracking-tight',
            textSizeClass,
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
  
  // Wrap with tooltip if enabled
  if (showTooltip) {
    return (
      <Tooltip content={tooltipContent}>
        {indicator}
      </Tooltip>
    );
  }
  
  return indicator;
}
