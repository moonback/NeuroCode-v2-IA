export interface FigmaConfig {
  accessToken?: string;
  apiBaseUrl: string;
  timeout: number;
}

export const defaultFigmaConfig: FigmaConfig = {
  apiBaseUrl: 'https://api.figma.com/v1',
  timeout: 30000, // 30 seconds
};

// Storage key for Figma configuration
export const FIGMA_CONFIG_KEY = 'neurocode_figma_config';

// Helper functions for managing Figma configuration
export const figmaConfigManager = {
  save: (config: Partial<FigmaConfig>) => {
    if (typeof window !== 'undefined') {
      const currentConfig = figmaConfigManager.load();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem(FIGMA_CONFIG_KEY, JSON.stringify(newConfig));
    }
  },

  load: (): FigmaConfig => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FIGMA_CONFIG_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...defaultFigmaConfig, ...parsed };
        } catch (error) {
          console.warn('Failed to parse Figma config:', error);
        }
      }
    }
    return defaultFigmaConfig;
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FIGMA_CONFIG_KEY);
    }
  },

  setAccessToken: (token: string) => {
    figmaConfigManager.save({ accessToken: token });
  },

  getAccessToken: (): string | undefined => {
    return figmaConfigManager.load().accessToken;
  },

  hasValidToken: (): boolean => {
    const token = figmaConfigManager.getAccessToken();
    return Boolean(token && token.trim().length > 0);
  },
};