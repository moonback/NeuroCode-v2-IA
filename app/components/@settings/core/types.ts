import type { ReactNode } from 'react';

export type SettingCategory = 'profile' | 'file_sharing' | 'connectivity' | 'system' | 'services' | 'preferences';

export type TabType =
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'features'
  | 'data'
  | 'cloud-providers'
  | 'local-providers'
  | 'service-status'
  | 'connection'
  | 'debug'
  | 'event-logs'
  | 'update'
  | 'task-manager'
  | 'tab-management';

export type WindowType = 'user' | 'developer';

export interface UserProfile {
  nickname: any;
  name: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  password?: string;
  bio?: string;
  language: string;
  timezone: string;
}

export interface SettingItem {
  id: TabType;
  label: string;
  icon: string;
  category: SettingCategory;
  description?: string;
  component: () => ReactNode;
  badge?: string;
  keywords?: string[];
}

export interface TabVisibilityConfig {
  id: TabType;
  visible: boolean;
  window: WindowType;
  order: number;
  isExtraDevTab?: boolean;
  locked?: boolean;
}

export interface DevTabConfig extends TabVisibilityConfig {
  window: 'developer';
}

export interface UserTabConfig extends TabVisibilityConfig {
  window: 'user';
}

export interface TabWindowConfig {
  userTabs: UserTabConfig[];
  developerTabs: DevTabConfig[];
}

// TAB_LABELS a été déplacé vers constants.ts

export const categoryLabels: Record<SettingCategory, string> = {
  profile: 'Profil et Compte',
  file_sharing: 'Partage de Fichiers',
  connectivity: 'Connectivité',
  system: 'Système',
  services: 'Services',
  preferences: 'Préférences',
};

export const categoryIcons: Record<SettingCategory, string> = {
  profile: 'i-ph:user-circle',
  file_sharing: 'i-ph:folder-simple',
  connectivity: 'i-ph:wifi-high',
  system: 'i-ph:gear',
  services: 'i-ph:cube',
  preferences: 'i-ph:sliders',
};

export interface Profile {
  username?: string;
  bio?: string;
  avatar?: string;
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
  };
}
