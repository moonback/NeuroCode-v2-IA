export interface DesignScheme {
    palette: { [key: string]: string }; // Changed from string[] to object
    features: string[];
    font: string[];
  }

  // Interface pour les groupes de couleurs personnalisés
  export interface CustomColorGroup {
    id: string;
    name: string;
    description?: string;
    scheme: DesignScheme;
    createdAt: string;
    updatedAt: string;
    isCustom: true;
  }
  
  export const defaultDesignScheme: DesignScheme = {
    palette: {
      primary: '#9E7FFF',
      secondary: '#38bdf8',
      accent: '#f472b6',
      background: '#171717',
      surface: '#262626',
      text: '#FFFFFF',
      textSecondary: '#A3A3A3',
      border: '#2F2F2F',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    features: ['rounded'],
    font: ['sans-serif'],
  };
  
  export const paletteRoles = [
    {
      key: 'primary',
      label: 'Primary',
      description: 'Main brand color - use for primary buttons, active links, and key interactive elements',
    },
    {
      key: 'secondary',
      label: 'Secondary',
      description: 'Supporting brand color - use for secondary buttons, inactive states, and complementary elements',
    },
    {
      key: 'accent',
      label: 'Accent',
      description: 'Highlight color - use for badges, notifications, focus states, and call-to-action elements',
    },
    {
      key: 'background',
      label: 'Background',
      description: 'Page backdrop - use for the main application/website background behind all content',
    },
    {
      key: 'surface',
      label: 'Surface',
      description: 'Elevated content areas - use for cards, modals, dropdowns, and panels that sit above the background',
    },
    { key: 'text', label: 'Text', description: 'Primary text - use for headings, body text, and main readable content' },
    {
      key: 'textSecondary',
      label: 'Text Secondary',
      description: 'Muted text - use for captions, placeholders, timestamps, and less important information',
    },
    {
      key: 'border',
      label: 'Border',
      description: 'Separators - use for input borders, dividers, table lines, and element outlines',
    },
    {
      key: 'success',
      label: 'Success',
      description: 'Positive feedback - use for success messages, completed states, and positive indicators',
    },
    {
      key: 'warning',
      label: 'Warning',
      description: 'Caution alerts - use for warning messages, pending states, and attention-needed indicators',
    },
    {
      key: 'error',
      label: 'Error',
      description: 'Error states - use for error messages, failed states, and destructive action indicators',
    },
  ];
  
  export const designFeatures = [
    { key: 'rounded', label: 'Rounded Corners' },
    { key: 'border', label: 'Subtle Border' },
    { key: 'gradient', label: 'Gradient Accent' },
    { key: 'shadow', label: 'Soft Shadow' },
    { key: 'frosted-glass', label: 'Frosted Glass' },
  ];
  
  export const designFonts = [
  { key: 'sans-serif', label: 'Sans Serif', preview: 'Aa' },
  { key: 'serif', label: 'Serif', preview: 'Aa' },
  { key: 'monospace', label: 'Monospace', preview: 'Aa' },
  { key: 'cursive', label: 'Cursive', preview: 'Aa' },
  { key: 'fantasy', label: 'Fantasy', preview: 'Aa' },
];

// Préréglages de thèmes populaires
export const themePresets = [
  {
    name: 'Dark Modern',
    description: 'Thème sombre moderne avec des accents violets',
    scheme: {
      palette: {
        primary: '#9E7FFF',
        secondary: '#38bdf8',
        accent: '#f472b6',
        background: '#171717',
        surface: '#262626',
        text: '#FFFFFF',
        textSecondary: '#A3A3A3',
        border: '#2F2F2F',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      features: ['rounded', 'shadow'],
      font: ['sans-serif'],
    }
  },
  {
    name: 'Light Clean',
    description: 'Thème clair et épuré pour une interface moderne',
    scheme: {
      palette: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#ec4899',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
      },
      features: ['rounded', 'border'],
      font: ['sans-serif'],
    }
  },
  {
    name: 'Ocean Blue',
    description: 'Thème inspiré de l\'océan avec des tons bleus profonds',
    scheme: {
      palette: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        accent: '#8b5cf6',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
        success: '#22c55e',
        warning: '#eab308',
        error: '#f87171',
      },
      features: ['rounded', 'frosted-glass'],
      font: ['sans-serif'],
    }
  },
  {
    name: 'Warm Sunset',
    description: 'Thème chaleureux aux couleurs du coucher de soleil',
    scheme: {
      palette: {
        primary: '#f97316',
        secondary: '#eab308',
        accent: '#ef4444',
        background: '#1c1917',
        surface: '#292524',
        text: '#fafaf9',
        textSecondary: '#a8a29e',
        border: '#44403c',
        success: '#84cc16',
        warning: '#f59e0b',
        error: '#dc2626',
      },
      features: ['rounded', 'gradient'],
      font: ['sans-serif'],
    }
  },
  {
    name: 'Forest Green',
    description: 'Thème naturel inspiré de la forêt',
    scheme: {
      palette: {
        primary: '#059669',
        secondary: '#0d9488',
        accent: '#7c3aed',
        background: '#0c0a09',
        surface: '#1c1917',
        text: '#fafaf9',
        textSecondary: '#a8a29e',
        border: '#292524',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      features: ['rounded', 'shadow'],
      font: ['sans-serif'],
    }
  },
  {
    name: 'Minimalist',
    description: 'Design minimaliste en noir et blanc',
    scheme: {
      palette: {
        primary: '#000000',
        secondary: '#404040',
        accent: '#666666',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#e0e0e0',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
      },
      features: ['border'],
      font: ['serif'],
    }
  }
];

// Types pour les utilitaires de couleur
export interface ColorUtilities {
  isValidHex: (color: string) => boolean;
  getContrastRatio: (color1: string, color2: string) => number;
  getLuminance: (color: string) => number;
  generateRandomColor: () => string;
  adjustBrightness: (color: string, amount: number) => string;
  hexToRgb: (hex: string) => { r: number; g: number; b: number } | null;
  rgbToHex: (r: number, g: number, b: number) => string;
}

// Utilitaires pour la manipulation des couleurs
export const colorUtils: ColorUtilities = {
  isValidHex: (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  getLuminance: (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  },

  getContrastRatio: (color1: string, color2: string): number => {
    const l1 = colorUtils.getLuminance(color1);
    const l2 = colorUtils.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  generateRandomColor: (): string => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },

  adjustBrightness: (color: string, amount: number): string => {
    const rgb = colorUtils.hexToRgb(color);
    if (!rgb) return color;
    
    const adjust = (value: number) => {
      const adjusted = Math.round(value + (255 * amount));
      return Math.max(0, Math.min(255, adjusted));
    };
    
    return colorUtils.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  },

  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  rgbToHex: (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
};

// Fonctions d'aide pour la validation des schémas
export const validateDesignScheme = (scheme: Partial<DesignScheme>): string[] => {
  const errors: string[] = [];
  
  if (scheme.palette) {
    Object.entries(scheme.palette).forEach(([key, color]) => {
      if (!colorUtils.isValidHex(color)) {
        errors.push(`Couleur invalide pour ${key}: ${color}`);
      }
    });
    
    // Vérification du contraste
    if (scheme.palette.text && scheme.palette.background) {
      const contrast = colorUtils.getContrastRatio(scheme.palette.text, scheme.palette.background);
      if (contrast < 4.5) {
        errors.push(`Contraste insuffisant entre le texte et l'arrière-plan (${contrast.toFixed(1)}:1, minimum recommandé: 4.5:1)`);
      }
    }
  }
  
  if (scheme.features) {
    const validFeatures = designFeatures.map(f => f.key);
    scheme.features.forEach(feature => {
      if (!validFeatures.includes(feature)) {
        errors.push(`Fonctionnalité de design inconnue: ${feature}`);
      }
    });
  }
  
  if (scheme.font) {
    const validFonts = designFonts.map(f => f.key);
    scheme.font.forEach(font => {
      if (!validFonts.includes(font)) {
        errors.push(`Police inconnue: ${font}`);
      }
    });
  }
  
  return errors;
};

// Fonction pour fusionner des schémas
export const mergeDesignSchemes = (base: DesignScheme, override: Partial<DesignScheme>): DesignScheme => {
  return {
    palette: { ...base.palette, ...override.palette },
    features: override.features || base.features,
    font: override.font || base.font,
  };
};

// Fonction pour générer un schéma aléatoire
// export const generateRandomScheme = (): DesignScheme => {
//   const randomPalette: { [key: string]: string } = {};
  
//   Object.keys(defaultDesignScheme.palette).forEach(key => {
//     randomPalette[key] = colorUtils.generateRandomColor();
//   });
  
//   const randomFeatures = designFeatures
//     .filter(() => Math.random() > 0.5)
//     .map(f => f.key);
    
//   const randomFont = [designFonts[Math.floor(Math.random() * designFonts.length)].key];
  
//   return {
//     palette: randomPalette,
//     features: randomFeatures.length > 0 ? randomFeatures : ['rounded'],
//     font: randomFont,
//   };
// };

// Export des constantes pour l'accessibilité
export const ACCESSIBILITY_STANDARDS = {
  WCAG_AA_NORMAL: 4.5,
  WCAG_AA_LARGE: 3,
  WCAG_AAA_NORMAL: 7,
  WCAG_AAA_LARGE: 4.5,
} as const;

// Types pour les niveaux d'accessibilité
export type AccessibilityLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';

// Fonction pour vérifier la conformité WCAG
export const checkWCAGCompliance = (
  foreground: string,
  background: string,
  level: AccessibilityLevel = 'AA',
  textSize: TextSize = 'normal'
): boolean => {
  const contrast = colorUtils.getContrastRatio(foreground, background);
  const key = `WCAG_${level}_${textSize.toUpperCase()}` as keyof typeof ACCESSIBILITY_STANDARDS;
  return contrast >= ACCESSIBILITY_STANDARDS[key];
};

// Fonctions pour la gestion des groupes de couleurs personnalisés
export const customColorGroupsUtils = {
  // Clé de stockage local
  STORAGE_KEY: 'neurocode-custom-color-groups',

  // Charger les groupes personnalisés depuis le localStorage
  loadCustomGroups: (): CustomColorGroup[] => {
    try {
      const stored = localStorage.getItem(customColorGroupsUtils.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des groupes personnalisés:', error);
      return [];
    }
  },

  // Sauvegarder les groupes personnalisés dans le localStorage
  saveCustomGroups: (groups: CustomColorGroup[]): void => {
    try {
      localStorage.setItem(customColorGroupsUtils.STORAGE_KEY, JSON.stringify(groups));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des groupes personnalisés:', error);
    }
  },

  // Créer un nouveau groupe personnalisé
  createCustomGroup: (name: string, scheme: DesignScheme, description?: string): CustomColorGroup => {
    const now = new Date().toISOString();
    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      scheme,
      createdAt: now,
      updatedAt: now,
      isCustom: true,
    };
  },

  // Ajouter un nouveau groupe personnalisé
  addCustomGroup: (name: string, scheme: DesignScheme, description?: string): CustomColorGroup => {
    const groups = customColorGroupsUtils.loadCustomGroups();
    const newGroup = customColorGroupsUtils.createCustomGroup(name, scheme, description);
    groups.push(newGroup);
    customColorGroupsUtils.saveCustomGroups(groups);
    return newGroup;
  },

  // Mettre à jour un groupe personnalisé existant
  updateCustomGroup: (id: string, updates: Partial<Omit<CustomColorGroup, 'id' | 'createdAt' | 'isCustom'>>): CustomColorGroup | null => {
    const groups = customColorGroupsUtils.loadCustomGroups();
    const index = groups.findIndex(group => group.id === id);
    
    if (index === -1) return null;
    
    groups[index] = {
      ...groups[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    customColorGroupsUtils.saveCustomGroups(groups);
    return groups[index];
  },

  // Supprimer un groupe personnalisé
  deleteCustomGroup: (id: string): boolean => {
    const groups = customColorGroupsUtils.loadCustomGroups();
    const filteredGroups = groups.filter(group => group.id !== id);
    
    if (filteredGroups.length === groups.length) return false;
    
    customColorGroupsUtils.saveCustomGroups(filteredGroups);
    return true;
  },

  // Dupliquer un groupe personnalisé
  duplicateCustomGroup: (id: string, newName?: string): CustomColorGroup | null => {
    const groups = customColorGroupsUtils.loadCustomGroups();
    const originalGroup = groups.find(group => group.id === id);
    
    if (!originalGroup) return null;
    
    const duplicatedGroup = customColorGroupsUtils.createCustomGroup(
      newName || `${originalGroup.name} (Copie)`,
      originalGroup.scheme,
      originalGroup.description
    );
    
    groups.push(duplicatedGroup);
    customColorGroupsUtils.saveCustomGroups(groups);
    return duplicatedGroup;
  },

  // Exporter tous les groupes personnalisés
  exportCustomGroups: (): void => {
    const groups = customColorGroupsUtils.loadCustomGroups();
    const dataStr = JSON.stringify(groups, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neurocode-custom-color-groups-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Importer des groupes personnalisés
  importCustomGroups: (file: File): Promise<CustomColorGroup[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          
          if (!Array.isArray(imported)) {
            reject(new Error('Le fichier doit contenir un tableau de groupes'));
            return;
          }
          
          const validGroups: CustomColorGroup[] = imported.filter(group => 
            group.id && group.name && group.scheme && group.isCustom
          ).map(group => ({
            ...group,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Nouveau ID pour éviter les conflits
            updatedAt: new Date().toISOString(),
          }));
          
          const existingGroups = customColorGroupsUtils.loadCustomGroups();
          const allGroups = [...existingGroups, ...validGroups];
          customColorGroupsUtils.saveCustomGroups(allGroups);
          
          resolve(validGroups);
        } catch (error) {
          reject(new Error('Erreur lors de l\'analyse du fichier JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  },

  // Valider un nom de groupe (éviter les doublons)
  validateGroupName: (name: string, excludeId?: string): { isValid: boolean; error?: string } => {
    if (!name.trim()) {
      return { isValid: false, error: 'Le nom ne peut pas être vide' };
    }
    
    if (name.length > 50) {
      return { isValid: false, error: 'Le nom ne peut pas dépasser 50 caractères' };
    }
    
    const groups = customColorGroupsUtils.loadCustomGroups();
    const nameExists = groups.some(group => 
      group.name.toLowerCase() === name.toLowerCase() && group.id !== excludeId
    );
    
    if (nameExists) {
      return { isValid: false, error: 'Un groupe avec ce nom existe déjà' };
    }
    
    return { isValid: true };
  },
};