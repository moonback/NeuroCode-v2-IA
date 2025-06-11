import type { TabType } from './types';

export const TAB_ICONS: Record<TabType, string> = {
  profile: 'i-ph:user-circle',
  settings: 'i-ph:gear-six',
  notifications: 'i-ph:bell',
  features: 'i-ph:star',
  data: 'i-ph:database',
  'cloud-providers': 'i-ph:cloud',
  'local-providers': 'i-ph:desktop',
  'service-status': 'i-ph:activity',
  connection: 'i-ph:wifi-high',
  debug: 'i-ph:bug',
  'event-logs': 'i-ph:list-bullets',
  update: 'i-ph:arrow-clockwise',
  'task-manager': 'i-ph:chart-line',
  'tab-management': 'i-ph:sliders-horizontal',
};

// Define which tabs are beta
export const BETA_TABS = new Set<TabType>(['task-manager', 'service-status', 'update', 'local-providers']);

// Define which tabs are default in user mode
export const DEFAULT_USER_TABS: TabType[] = [
  'features',
  'data',
  'cloud-providers',
  'local-providers',
  'connection',
  'notifications',
  'event-logs',
];

// Define which tabs can be added to user mode
export const OPTIONAL_USER_TABS: TabType[] = ['profile', 'settings', 'task-manager', 'service-status', 'debug', 'update'];

// All available tabs for user mode
export const ALL_USER_TABS = [...DEFAULT_USER_TABS, ...OPTIONAL_USER_TABS];


export const TAB_LABELS: Record<TabType, string> = {
  profile: 'Profil',
  settings: 'Paramètres',
  notifications: 'Notifications',
  features: 'Fonctionnalités',
  data: 'Gestion des Données',
  'cloud-providers': 'Fournisseurs Cloud',
  'local-providers': 'Fournisseurs Locaux',
  'service-status': 'État des Services',
  connection: 'Connexion',
  debug: 'Débogage',
  'event-logs': 'Journaux d\'Événements',
  update: 'Mises à Jour',
  'task-manager': 'Gestionnaire de Tâches',
  'tab-management': 'Gestion des Onglets',
};

export const TAB_DESCRIPTIONS: Record<TabType, string> = {
  profile: 'Gérer votre profil et les paramètres de compte',
  settings: 'Configurer les préférences de l\'application',
  notifications: 'Voir et gérer vos notifications',
  features: 'Explorer les nouvelles fonctionnalités',
  data: 'Gérer vos données et stockage',
  'cloud-providers': 'Configurer les fournisseurs IA cloud et modèles',
  'local-providers': 'Configurer les fournisseurs IA locaux et modèles',
  'service-status': 'Surveiller l\'état des services LLM cloud',
  connection: 'Vérifier l\'état de connexion et paramètres',
  debug: 'Outils de débogage et informations système',
  'event-logs': 'Voir les événements système et journaux',
  update: 'Vérifier les mises à jour et notes de version',
  'task-manager': 'Surveiller les ressources système et processus',
  'tab-management': 'Configurer les onglets visibles et leur ordre',
};

export const DEFAULT_TAB_CONFIG = [
  // User Window Tabs (Always visible by default)
  { id: 'features', visible: true, window: 'user' as const, order: 0 },
  { id: 'data', visible: true, window: 'user' as const, order: 1 },
  { id: 'cloud-providers', visible: true, window: 'user' as const, order: 2 },
  { id: 'local-providers', visible: true, window: 'user' as const, order: 3 },
  { id: 'connection', visible: true, window: 'user' as const, order: 4 },
  { id: 'notifications', visible: true, window: 'user' as const, order: 5 },
  { id: 'event-logs', visible: true, window: 'user' as const, order: 6 },


  // User Window Tabs (In dropdown, initially hidden)
  { id: 'profile', visible: false, window: 'user' as const, order: 7 },
  { id: 'settings', visible: false, window: 'user' as const, order: 8 },
  { id: 'task-manager', visible: false, window: 'user' as const, order: 9 },
  { id: 'service-status', visible: false, window: 'user' as const, order: 10 },

  // User Window Tabs (Hidden, controlled by TaskManagerTab)
  { id: 'debug', visible: false, window: 'user' as const, order: 11 },
  { id: 'update', visible: false, window: 'user' as const, order: 12 },

  // Developer Window Tabs (All visible by default)
  { id: 'features', visible: true, window: 'developer' as const, order: 0 },
  { id: 'data', visible: true, window: 'developer' as const, order: 1 },
  { id: 'cloud-providers', visible: true, window: 'developer' as const, order: 2 },
  { id: 'local-providers', visible: true, window: 'developer' as const, order: 3 },
  { id: 'connection', visible: true, window: 'developer' as const, order: 4 },
  { id: 'notifications', visible: true, window: 'developer' as const, order: 5 },
  { id: 'event-logs', visible: true, window: 'developer' as const, order: 6 },
  { id: 'profile', visible: true, window: 'developer' as const, order: 7 },
  { id: 'settings', visible: true, window: 'developer' as const, order: 8 },
  { id: 'task-manager', visible: true, window: 'developer' as const, order: 9 },
  { id: 'service-status', visible: true, window: 'developer' as const, order: 10 },
  { id: 'debug', visible: true, window: 'developer' as const, order: 11 },
  { id: 'update', visible: true, window: 'developer' as const, order: 12 },
];
