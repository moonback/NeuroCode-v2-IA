import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { supabaseConnection } from '~/lib/stores/supabase';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { StatusIndicator } from './StatusIndicator';
import { classNames } from '~/utils/classNames';
import { getLocalStorage } from '~/lib/persistence/localStorage';
import { motion } from 'framer-motion';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showLabels?: boolean;
  showBadge?: boolean;
}

/**
 * Composant qui affiche les indicateurs visuels pour les états de connexion et de synchronisation
 * avec un design moderne et professionnel
 */
export function ConnectionStatusIndicator({ className, showLabels = true, showBadge = false }: ConnectionStatusIndicatorProps) {
  const { hasConnectionIssues, currentIssue } = useConnectionStatus();
  const supabaseConn = useStore(supabaseConnection);
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const [gitStatus, setGitStatus] = useState<'online' | 'offline'>('offline');
  const [isExpanded, setIsExpanded] = useState(false);

  // Vérifier l'état de la connexion GitHub
  useEffect(() => {
    const checkGitHubConnection = () => {
      const githubConnection = getLocalStorage('github_connection');
      setGitStatus(githubConnection?.token ? 'online' : 'offline');
    };
    
    // Vérifier immédiatement et à chaque fois que le composant est monté
    checkGitHubConnection();
    
    // Configurer un écouteur d'événements pour les changements de stockage
    const handleStorageChange = () => {
      checkGitHubConnection();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Déterminer l'état de connexion réseau
  const networkStatus = currentIssue === null ? 'online' : 'offline';
  
  // Déterminer l'état de connexion Supabase
  const supabaseStatus = supabaseConn.isConnected ? 'online' : 'offline';
  
  // Déterminer l'état de connexion Netlify
  const netlifyStatus = netlifyConn.token && netlifyConn.user ? 'online' : 'offline';
  
  // Déterminer l'état de connexion Vercel
  const vercelStatus = vercelConn.token && vercelConn.user ? 'online' : 'offline';
  
  // Déterminer les messages de tooltip personnalisés
  const networkTooltip = currentIssue === null 
    ? 'Connexion réseau stable' 
    : `Problème de connexion: ${currentIssue}`;
    
  const gitTooltip = gitStatus === 'online' 
    ? 'Connecté à GitHub' 
    : 'Non connecté à GitHub';
    
  const supabaseTooltip = supabaseConn.isConnected 
    ? `Connecté à Supabase (${supabaseConn.projectName || 'Projet'})` 
    : 'Non connecté à Supabase';
    
  const netlifyTooltip = netlifyConn.user 
    ? `Connecté à Netlify (${netlifyConn.user.full_name || netlifyConn.user.email || 'Utilisateur'})` 
    : 'Non connecté à Netlify';
    
  const vercelTooltip = vercelConn.user 
    ? `Connecté à Vercel (${vercelConn.user.name || vercelConn.user.email || 'Utilisateur'})` 
    : 'Non connecté à Vercel';

  // Calculer le nombre de services connectés pour le badge
  const connectedServicesCount = [
    networkStatus === 'online',
    gitStatus === 'online',
    supabaseStatus === 'online',
    netlifyStatus === 'online',
    vercelStatus === 'online'
  ].filter(Boolean).length;

  return (
    <motion.div 
      className={classNames(
        'flex items-center gap-3 bg-bolt-elements-background-depth-1/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-bolt-elements-background-depth-3/30',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      whileHover={{ scale: 1.02 }}
    >
      {/* Badge du nombre de services connectés */}
      {showBadge && connectedServicesCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {connectedServicesCount}
        </div>
      )}

      {/* Indicateur de connexion réseau */}
      <StatusIndicator 
        status={networkStatus} 
        pulse={hasConnectionIssues}
        label={(isExpanded || showLabels) ? "Réseau" : undefined} 
        size="sm"
        tooltip={networkTooltip}
      />
      
      {/* Indicateur de connexion Git */}
      <StatusIndicator 
        status={gitStatus} 
        label={(isExpanded || showLabels) ? "Git" : undefined}
        size="sm"
        tooltip={gitTooltip}
      />
      
      {/* Indicateur de connexion Supabase */}
      <StatusIndicator 
        status={supabaseStatus} 
        label={(isExpanded || showLabels) ? "Supabase" : undefined}
        size="sm"
        tooltip={supabaseTooltip}
      />
      
      {/* Indicateur de connexion Netlify */}
      <StatusIndicator 
        status={netlifyStatus} 
        label={(isExpanded || showLabels) ? "Netlify" : undefined}
        size="sm"
        tooltip={netlifyTooltip}
      />
      
      {/* Indicateur de connexion Vercel */}
      <StatusIndicator 
        status={vercelStatus} 
        label={(isExpanded || showLabels) ? "Vercel" : undefined}
        size="sm"
        tooltip={vercelTooltip}
      />
    </motion.div>
  );
}