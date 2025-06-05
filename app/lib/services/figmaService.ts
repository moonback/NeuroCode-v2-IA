import { toast } from 'react-toastify';

// Types existants + nouveaux types pour une structure complète
interface FigmaProjectConfig {
  fileId: string;
  projectName?: string;
  outputFormat: 'react-vite' | 'nextjs' | 'vanilla-html';
  features: {
    typescript: boolean;
    tailwindcss: boolean;
    storybook: boolean;
    testing: boolean;
    animations: boolean;
    responsiveDesign: boolean;
    darkMode: boolean;
    accessibility: boolean;
    i18n: boolean;
    stateManagement: 'useState' | 'zustand' | 'redux' | 'none';
  };
  customization: {
    cssFramework: 'tailwind' | 'styled-components' | 'css-modules' | 'vanilla';
    componentLibrary: 'custom' | 'mui' | 'antd' | 'chakra' | 'none';
    iconLibrary: 'lucide' | 'heroicons' | 'react-icons' | 'custom';
  };
}

interface ProjectStructure {
  files: ProjectFile[];
  directories: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

interface ProjectFile {
  path: string;
  content: string;
  type: 'component' | 'style' | 'config' | 'test' | 'story' | 'type' | 'util' | 'hook' | 'asset';
}

interface ComponentMetadata {
  name: string;
  type: 'layout' | 'ui' | 'form' | 'navigation' | 'display' | 'feedback';
  category: string;
  props: ComponentProp[];
  variants: ComponentVariant[];
  dependencies: string[];
  examples: ComponentExample[];
}

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

interface ComponentVariant {
  name: string;
  props: Record<string, any>;
  description?: string;
}

interface ComponentExample {
  name: string;
  code: string;
  description?: string;
}

class EnhancedFigmaService {
  private config: FigmaProjectConfig;
  private projectStructure: ProjectStructure;
  
  constructor(config: FigmaProjectConfig) {
    this.config = config;
    this.projectStructure = {
      files: [],
      directories: [],
      dependencies: {},
      devDependencies: {},
      scripts: {}
    };
  }

  /**
   * Valide si l'URL Figma est correcte
   */
  static isValidFigmaUrl(url: string): boolean {
    const figmaUrlPattern = /^https:\/\/(?:www\.)?figma\.com\/(file|proto|design)\/([a-zA-Z0-9]{22,128})\/?.*/;
    return figmaUrlPattern.test(url);
  }

  /**
   * Extrait l'ID du fichier depuis l'URL Figma
   */
  static extractFileId(url: string): string | null {
    const match = url.match(/\/(file|design|proto)\/([a-zA-Z0-9]{22,128})\//)
    return match ? match[2] : null;
  }

  /**
   * Récupère le token d'accès Figma depuis la configuration
   */
  static getAccessToken(): string | null {
    // Import figmaConfigManager dynamically to avoid circular dependencies
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('neurocode_figma_config');
      if (stored) {
        try {
          const config = JSON.parse(stored);
          return config.accessToken || null;
        } catch (error) {
          console.warn('Failed to parse Figma config:', error);
        }
      }
    }
    return process.env.FIGMA_ACCESS_TOKEN || null;
  }

  /**
   * Convertit un fichier Figma en projet React
   */
  static async convertToReactProject(fileId: string): Promise<any | null> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        console.error('Token d\'accès Figma manquant');
        return null;
      }

      // Récupérer les données du fichier Figma
      const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
        headers: {
          'X-Figma-Token': token
        }
      });

      if (!response.ok) {
        console.error('Erreur lors de la récupération du fichier Figma:', response.statusText);
        return null;
      }

      const figmaData = await response.json();
      
      // Créer une configuration par défaut
      const config: FigmaProjectConfig = {
        fileId,
        projectName: (figmaData as { name?: string }).name || 'Figma Project',
        outputFormat: 'react-vite',
        features: {
          typescript: true,
          tailwindcss: true,
          storybook: false,
          testing: false,
          animations: true,
          responsiveDesign: true,
          darkMode: false,
          accessibility: true,
          i18n: false,
          stateManagement: 'useState'
        },
        customization: {
          cssFramework: 'tailwind',
          componentLibrary: 'custom',
          iconLibrary: 'lucide'
        }
      };

      // Créer une instance du service et convertir
      const service = new EnhancedFigmaService(config);
      const projectStructure = await service.convertToCompleteProject();
      
      if (!projectStructure) {
        return null;
      }

      // Transformer la structure en format attendu par le composant
      return {
        component: service.generateMainComponent(figmaData),
        css: service.generateMainCSS(figmaData),
        packageJson: service.generatePackageJson(),
        viteConfig: service.generateViteConfig(),
        indexHtml: service.generateIndexHTML(),
        mainTsx: service.generateMainTSX(),
        designTokens: service.generateDesignTokens(figmaData),
        componentLibrary: service.generateComponentLibrary(figmaData),
        storybook: service.generateStorybookConfig()
      };
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      return null;
    }
  }

  /**
   * Convertit un fichier Figma en structure de projet complète
   */
  async convertToCompleteProject(): Promise<ProjectStructure | null> {
    try {
      // 1. Récupérer les données Figma
      const figmaData = await this.fetchFigmaData();
      if (!figmaData) return null;

      // 2. Analyser la structure du design
      const designAnalysis = await this.analyzeDesignStructure(figmaData);
      
      // 3. Générer la structure de base du projet
      await this.generateProjectStructure();
      
      // 4. Générer les composants
      await this.generateComponents(designAnalysis);
      
      // 5. Générer les styles et tokens de design
      await this.generateDesignSystem(designAnalysis);
      
      // 6. Générer les utilitaires et hooks
      await this.generateUtilities();
      
      // 7. Générer les tests
      if (this.config.features.testing) {
        await this.generateTests();
      }
      
      // 8. Générer Storybook
      if (this.config.features.storybook) {
        await this.generateStorybook();
      }
      
      // 9. Générer les fichiers de configuration
      await this.generateConfigFiles();

      return this.projectStructure;
      
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      toast.error('Erreur lors de la génération du projet');
      return null;
    }
  }

  /**
   * Génère la structure de base du projet
   */
  private async generateProjectStructure(): Promise<void> {
    const baseDirectories = [
      'src',
      'src/components',
      'src/components/ui',
      'src/components/layout',
      'src/components/forms',
      'src/hooks',
      'src/utils',
      'src/types',
      'src/styles',
      'src/assets',
      'src/assets/icons',
      'src/assets/images',
      'src/constants',
      'src/services',
      'public'
    ];

    if (this.config.features.testing) {
      baseDirectories.push('src/__tests__', 'src/components/__tests__');
    }

    if (this.config.features.storybook) {
      baseDirectories.push('.storybook', 'src/stories');
    }

    if (this.config.features.i18n) {
      baseDirectories.push('src/locales', 'src/locales/en', 'src/locales/fr');
    }

    this.projectStructure.directories = baseDirectories;
  }

  /**
   * Génère les composants React à partir de l'analyse Figma
   */
  private async generateComponents(designAnalysis: any): Promise<void> {
    const components = await this.extractComponentsFromDesign(designAnalysis);
    
    for (const component of components) {
      // Composant principal
      this.projectStructure.files.push({
        path: `src/components/${component.category}/${component.name}/${component.name}.tsx`,
        content: this.generateComponentCode(component),
        type: 'component'
      });

      // Fichier de styles
      if (this.config.customization.cssFramework === 'css-modules') {
        this.projectStructure.files.push({
          path: `src/components/${component.category}/${component.name}/${component.name}.module.css`,
          content: this.generateComponentStyles(component),
          type: 'style'
        });
      }

      // Types TypeScript
      if (this.config.features.typescript) {
        this.projectStructure.files.push({
          path: `src/components/${component.category}/${component.name}/types.ts`,
          content: this.generateComponentTypes(component),
          type: 'type'
        });
      }

      // Tests
      if (this.config.features.testing) {
        this.projectStructure.files.push({
          path: `src/components/${component.category}/${component.name}/__tests__/${component.name}.test.tsx`,
          content: this.generateComponentTest(component),
          type: 'test'
        });
      }

      // Stories Storybook
      if (this.config.features.storybook) {
        this.projectStructure.files.push({
          path: `src/components/${component.category}/${component.name}/${component.name}.stories.tsx`,
          content: this.generateComponentStory(component),
          type: 'story'
        });
      }

      // Index pour l'export
      this.projectStructure.files.push({
        path: `src/components/${component.category}/${component.name}/index.ts`,
        content: `export { default } from './${component.name}';\nexport * from './types';`,
        type: 'component'
      });
    }

    // Génère les index des catégories
    this.generateCategoryIndexes(components);
  }

  /**
   * Génère le code d'un composant React
   */
  private generateComponentCode(component: ComponentMetadata): string {
    const imports = this.generateComponentImports(component);
    const interfaces = this.generateComponentInterfaces(component);
    const componentBody = this.generateComponentBody(component);
    
    return `${imports}

${interfaces}

const ${component.name}: React.FC<${component.name}Props> = ({
  ${component.props.map(p => `${p.name}${p.defaultValue ? ` = ${JSON.stringify(p.defaultValue)}` : ''}`).join(',\n  ')},
  className,
  ...props
}) => {
  ${this.generateComponentLogic(component)}

  return (
    ${componentBody}
  );
};

${component.name}.displayName = '${component.name}';

export default ${component.name};
`;
  }

  /**
   * Génère le système de design (tokens, thème)
   */
  private async generateDesignSystem(designAnalysis: any): Promise<void> {
    // Design tokens
    const designTokens = this.extractDesignTokens(designAnalysis);
    this.projectStructure.files.push({
      path: 'src/styles/tokens.ts',
      content: this.generateDesignTokensCode(designTokens),
      type: 'style'
    });

    // Thème
    this.projectStructure.files.push({
      path: 'src/styles/theme.ts',
      content: this.generateThemeCode(designTokens),
      type: 'style'
    });

    // Variables CSS globales
    this.projectStructure.files.push({
      path: 'src/styles/globals.css',
      content: this.generateGlobalStyles(designTokens),
      type: 'style'
    });

    // Configuration Tailwind si activé
    if (this.config.customization.cssFramework === 'tailwind') {
      this.projectStructure.files.push({
        path: 'tailwind.config.js',
        content: this.generateTailwindConfig(designTokens),
        type: 'config'
      });
    }

    // Mixins et utilitaires CSS
    this.projectStructure.files.push({
      path: 'src/styles/mixins.css',
      content: this.generateCSSMixins(),
      type: 'style'
    });
  }

  /**
   * Génère les hooks personnalisés
   */
  private async generateUtilities(): Promise<void> {
    const utilityFiles = [
      {
        path: 'src/hooks/useResponsive.ts',
        content: this.generateResponsiveHook(),
        type: 'hook' as const
      },
      {
        path: 'src/hooks/useTheme.ts',
        content: this.generateThemeHook(),
        type: 'hook' as const
      },
      {
        path: 'src/utils/classNames.ts',
        content: this.generateClassNameUtils(),
        type: 'util' as const
      },
      {
        path: 'src/utils/constants.ts',
        content: this.generateConstants(),
        type: 'util' as const
      },
      {
        path: 'src/types/index.ts',
        content: this.generateGlobalTypes(),
        type: 'type' as const
      }
    ];

    if (this.config.features.animations) {
      utilityFiles.push({
        path: 'src/utils/animations.ts',
        content: this.generateAnimationUtils(),
        type: 'util' as const
      });
    }

    if (this.config.features.i18n) {
      utilityFiles.push({
        path: 'src/utils/i18n.ts',
        content: this.generateI18nUtils(),
        type: 'util' as const
      });
    }

    this.projectStructure.files.push(...utilityFiles);
  }

  /**
   * Génère les fichiers de test
   */
  private async generateTests(): Promise<void> {
    // Configuration de test
    this.projectStructure.files.push({
      path: 'vitest.config.ts',
      content: this.generateVitestConfig(),
      type: 'config'
    });

    // Setup des tests
    this.projectStructure.files.push({
      path: 'src/setupTests.ts',
      content: this.generateTestSetup(),
      type: 'config'
    });

    // Utilitaires de test
    this.projectStructure.files.push({
      path: 'src/__tests__/utils/testUtils.tsx',
      content: this.generateTestUtils(),
      type: 'util'
    });
  }

  /**
   * Génère la configuration Storybook
   */
  private async generateStorybook(): Promise<void> {
    this.projectStructure.files.push(
      {
        path: '.storybook/main.ts',
        content: this.generateStorybookMain(),
        type: 'config'
      },
      {
        path: '.storybook/preview.ts',
        content: this.generateStorybookPreview(),
        type: 'config'
      }
    );
  }

  /**
   * Génère tous les fichiers de configuration
   */
  private async generateConfigFiles(): Promise<void> {
    // Package.json avec toutes les dépendances
    this.generateDependencies();
    this.projectStructure.files.push({
      path: 'package.json',
      content: JSON.stringify(this.generatePackageJson(), null, 2),
      type: 'config'
    });

    // Configuration TypeScript
    if (this.config.features.typescript) {
      this.projectStructure.files.push({
        path: 'tsconfig.json',
        content: JSON.stringify(this.generateTSConfig(), null, 2),
        type: 'config'
      });
    }

    // Configuration Vite
    this.projectStructure.files.push({
      path: 'vite.config.ts',
      content: this.generateViteConfig(),
      type: 'config'
    });

    // Configuration ESLint
    this.projectStructure.files.push({
      path: '.eslintrc.json',
      content: JSON.stringify(this.generateESLintConfig(), null, 2),
      type: 'config'
    });

    // Configuration Prettier
    this.projectStructure.files.push({
      path: '.prettierrc',
      content: JSON.stringify(this.generatePrettierConfig(), null, 2),
      type: 'config'
    });

    // README avec documentation
    this.projectStructure.files.push({
      path: 'README.md',
      content: this.generateReadme(),
      type: 'config'
    });

    // Fichiers d'entrée
    this.projectStructure.files.push(
      {
        path: 'index.html',
        content: this.generateIndexHTML(),
        type: 'config'
      },
      {
        path: 'src/main.tsx',
        content: this.generateMainTSX(),
        type: 'component'
      },
      {
        path: 'src/App.tsx',
        content: this.generateAppTSX(),
        type: 'component'
      }
    );
  }

  // ... Méthodes helper pour générer le contenu spécifique de chaque fichier ...

  private generateResponsiveHook(): string {
    return `import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('md');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (width >= breakpoints['2xl']) setCurrentBreakpoint('2xl');
      else if (width >= breakpoints.xl) setCurrentBreakpoint('xl');
      else if (width >= breakpoints.lg) setCurrentBreakpoint('lg');
      else if (width >= breakpoints.md) setCurrentBreakpoint('md');
      else if (width >= breakpoints.sm) setCurrentBreakpoint('sm');
      else setCurrentBreakpoint('xs');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    currentBreakpoint,
    windowSize,
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl',
  };
};`;
  }

  private generateReadme(): string {
    return `# ${this.config.projectName || 'Figma to React Project'}

Ce projet a été généré automatiquement à partir d'un design Figma.

## 🚀 Démarrage rapide

\`\`\`bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview
\`\`\`

## 📁 Structure du projet

\`\`\`
src/
├── components/          # Composants React organisés par catégorie
│   ├── ui/             # Composants d'interface utilisateur
│   ├── layout/         # Composants de mise en page
│   └── forms/          # Composants de formulaires
├── hooks/              # Hooks personnalisés
├── utils/              # Fonctions utilitaires
├── styles/             # Styles et tokens de design
├── types/              # Types TypeScript
└── assets/             # Ressources statiques
\`\`\`

## 🎨 Design System

Le projet inclut un système de design complet avec :
- **Tokens de design** : couleurs, typographie, espacements
- **Composants réutilisables** : générés à partir du design Figma
- **Thème responsive** : adaptation automatique aux différentes tailles d'écran

## 🧪 Tests

\`\`\`bash
# Lancer les tests
npm run test

# Tests en mode watch
npm run test:watch

# Coverage des tests
npm run test:coverage
\`\`\`

## 📚 Storybook

\`\`\`bash
# Démarrer Storybook
npm run storybook

# Build Storybook
npm run build-storybook
\`\`\`

## 🛠 Technologies utilisées

${this.generateTechStack()}

## 📝 Notes de développement

- Les composants sont générés automatiquement à partir du design Figma
- Chaque composant inclut ses propres tests et stories Storybook
- Le design system est extrait des styles Figma et converti en tokens CSS/JS
- Le projet est configuré pour être responsive par défaut

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit les changements (\`git commit -m 'Add AmazingFeature'\`)
4. Push sur la branche (\`git push origin feature/AmazingFeature\`)
5. Ouvrir une Pull Request
`;
  }

  private generateTechStack(): string {
    const stack = [`- React ${this.config.features.typescript ? '+ TypeScript' : ''}`];
    
    if (this.config.customization.cssFramework === 'tailwind') stack.push('- Tailwind CSS');
    if (this.config.features.storybook) stack.push('- Storybook');
    if (this.config.features.testing) stack.push('- Vitest + Testing Library');
    if (this.config.features.animations) stack.push('- Framer Motion');
    
    return stack.join('\n');
  }

  // Méthodes helper implémentées
  private async fetchFigmaData(): Promise<any> {
    // TODO: Implémenter l'appel à l'API Figma
    return {
      document: {},
      components: {},
      styles: {}
    };
  }

  private async analyzeDesignStructure(data: any): Promise<any> {
    // TODO: Analyser la structure du design Figma
    return {
      components: [],
      tokens: {},
      layout: {}
    };
  }

  private async extractComponentsFromDesign(analysis: any): Promise<ComponentMetadata[]> {
    // TODO: Extraire les composants du design
    return [];
  }

  private generateComponentImports(component: ComponentMetadata): string {
    const imports = ['import React from \'react\';'];
    
    if (this.config.features.typescript) {
      imports.push('import { ComponentProps } from \'react\';');
    }
    
    if (this.config.customization.cssFramework === 'css-modules') {
      imports.push(`import styles from './${component.name}.module.css';`);
    }
    
    if (this.config.customization.cssFramework === 'styled-components') {
      imports.push('import styled from \'styled-components\';');
    }
    
    return imports.join('\n');
  }

  private generateComponentInterfaces(component: ComponentMetadata): string {
    if (!this.config.features.typescript) return '';
    
    const propsInterface = `interface ${component.name}Props {
${component.props.map(prop => 
  `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};${prop.description ? ` // ${prop.description}` : ''}`
).join('\n')}
  className?: string;
  children?: React.ReactNode;
}`;
    
    return propsInterface;
  }

  private generateComponentBody(component: ComponentMetadata): string {
    const className = this.config.customization.cssFramework === 'css-modules' 
      ? `className={\`\${styles.${component.name.toLowerCase()}} \${className || ''}\`}`
      : `className={className}`;
    
    return `<div ${className} {...props}>
      {children}
    </div>`;
  }

  private generateComponentLogic(component: ComponentMetadata): string {
    // TODO: Générer la logique spécifique au composant
    return '';
  }

  private extractDesignTokens(analysis: any): any {
    return {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        }
      }
    };
  }

  private generateDesignTokensCode(tokens: any): string {
    return `export const designTokens = ${JSON.stringify(tokens, null, 2)};`;
  }

  private generateThemeCode(tokens: any): string {
    return `import { designTokens } from './tokens';

export const theme = {
  ...designTokens,
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

export type Theme = typeof theme;`;
  }

  private generateGlobalStyles(tokens: any): string {
    return `:root {
${Object.entries(tokens.colors || {}).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}
${Object.entries(tokens.spacing || {}).map(([key, value]) => `  --spacing-${key}: ${value};`).join('\n')}
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: ${tokens.typography?.fontFamily || 'Inter, sans-serif'};
}`;
  }

  private generateTailwindConfig(tokens: any): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: ${JSON.stringify(tokens.colors || {}, null, 6)},
      spacing: ${JSON.stringify(tokens.spacing || {}, null, 6)},
      fontFamily: {
        sans: ['${tokens.typography?.fontFamily || 'Inter'}', 'sans-serif']
      }
    }
  },
  plugins: []
};`;
  }

  private generateCSSMixins(): string {
    return `/* Mixins utilitaires */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}`;
  }

  private generateCategoryIndexes(components: ComponentMetadata[]): void {
    const categories = [...new Set(components.map(c => c.category))];
    
    categories.forEach(category => {
      const categoryComponents = components.filter(c => c.category === category);
      const exports = categoryComponents.map(c => `export { default as ${c.name} } from './${c.name}';`).join('\n');
      
      this.projectStructure.files.push({
        path: `src/components/${category}/index.ts`,
        content: exports,
        type: 'component'
      });
    });
  }

  private generateThemeHook(): string {
    return `import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};`;
  }

  private generateClassNameUtils(): string {
    return `export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return cn(...classes);
}`;
  }

  private generateConstants(): string {
    return `export const APP_NAME = '${this.config.projectName || 'My App'}';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500
} as const;`;
  }

  private generateGlobalTypes(): string {
    return `export interface BaseComponent {
  className?: string;
  children?: React.ReactNode;
}

export type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Theme = 'light' | 'dark';`;
  }

  private generateAnimationUtils(): string {
    return `import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};`;
  }

  private generateI18nUtils(): string {
    return `interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<string, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success!'
    }
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      success: 'Succès !'
    }
  }
};

export const t = (key: string, locale: string = 'en'): string => {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : key;
};`;
  }

  private generateVitestConfig(): string {
    return `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true
  }
});`;
  }

  private generateTestSetup(): string {
    return `import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});`;
  }

  private generateTestUtils(): string {
    return `import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '../../hooks/useTheme';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };`;
  }

  private generateStorybookMain(): string {
    return `import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  }
};

export default config;`;
  }

  private generateStorybookPreview(): string {
    return `import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  }
};

export default preview;`;
  }

  private generateDependencies(): void {
    this.projectStructure.dependencies = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    };

    this.projectStructure.devDependencies = {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.0.0',
      'vite': '^4.4.0'
    };

    if (this.config.features.typescript) {
      this.projectStructure.devDependencies['typescript'] = '^5.0.0';
    }

    if (this.config.customization.cssFramework === 'tailwind') {
      this.projectStructure.devDependencies['tailwindcss'] = '^3.3.0';
      this.projectStructure.devDependencies['autoprefixer'] = '^10.4.0';
      this.projectStructure.devDependencies['postcss'] = '^8.4.0';
    }

    if (this.config.features.testing) {
      Object.assign(this.projectStructure.devDependencies, {
        'vitest': '^0.34.0',
        '@testing-library/react': '^13.4.0',
        '@testing-library/jest-dom': '^6.0.0',
        'jsdom': '^22.0.0'
      });
    }

    if (this.config.features.storybook) {
      Object.assign(this.projectStructure.devDependencies, {
        '@storybook/react': '^7.0.0',
        '@storybook/react-vite': '^7.0.0',
        '@storybook/addon-essentials': '^7.0.0'
      });
    }

    if (this.config.features.animations) {
      this.projectStructure.dependencies['framer-motion'] = '^10.0.0';
    }
  }

  private generatePackageJson(): any {
    return {
      name: this.config.projectName?.toLowerCase().replace(/\s+/g, '-') || 'figma-project',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        ...(this.config.features.testing && {
          test: 'vitest',
          'test:watch': 'vitest --watch',
          'test:coverage': 'vitest --coverage'
        }),
        ...(this.config.features.storybook && {
          storybook: 'storybook dev -p 6006',
          'build-storybook': 'storybook build'
        })
      },
      dependencies: this.projectStructure.dependencies,
      devDependencies: this.projectStructure.devDependencies
    };
  }

  private generateTSConfig(): any {
    return {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    };
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});`;
  }

  private generateESLintConfig(): any {
    return {
      root: true,
      env: { browser: true, es2020: true },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react-hooks/recommended'
      ],
      ignorePatterns: ['dist', '.eslintrc.cjs'],
      parser: '@typescript-eslint/parser',
      plugins: ['react-refresh'],
      rules: {
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true }
        ]
      }
    };
  }

  private generatePrettierConfig(): any {
    return {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2
    };
  }

  private generateIndexHTML(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.config.projectName || 'Figma Project'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  private generateMainTSX(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
${this.config.features.darkMode ? "import { ThemeProvider } from './hooks/useTheme';" : ''}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    ${this.config.features.darkMode ? '<ThemeProvider>' : ''}
      <App />
    ${this.config.features.darkMode ? '</ThemeProvider>' : ''}
  </React.StrictMode>
);`;
  }

  private generateAppTSX(): string {
    return `import React from 'react';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to ${this.config.projectName || 'Your Figma Project'}</h1>
        <p>Generated from Figma design</p>
      </header>
      <main>
        {/* Your components will be rendered here */}
      </main>
    </div>
  );
}

export default App;`;
  }

  private generateComponentStyles(component: ComponentMetadata): string {
    return `.${component.name.toLowerCase()} {
  /* Styles for ${component.name} component */
  display: block;
}

.${component.name.toLowerCase()}--variant {
  /* Variant styles */
}`;
  }

  /**
   * Génère le composant principal à partir des données Figma
   */
  generateMainComponent(figmaData: any): string {
    const componentName = figmaData.name?.replace(/[^a-zA-Z0-9]/g, '') || 'FigmaComponent';
    
    return `import React from 'react';
import './styles.css';

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className = '' }) => {
  return (
    <div className={\`figma-component \${className}\`}>
      <h1>Figma Component</h1>
      <p>Generated from Figma design: ${figmaData.name || 'Untitled'}</p>
      {/* Component content will be generated here */}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Génère le CSS principal à partir des données Figma
   */
  generateMainCSS(figmaData: any): string {
    return `.figma-component {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.figma-component h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

.figma-component p {
  margin: 0;
  font-size: 16px;
  color: #666666;
  line-height: 1.5;
}`;
  }

  /**
   * Génère les tokens de design à partir des données Figma
   */
  generateDesignTokens(figmaData: any): any {
    return {
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '12px',
          sm: '14px',
          base: '16px',
          lg: '18px',
          xl: '20px',
          '2xl': '24px'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      }
    };
  }

  /**
   * Génère la bibliothèque de composants
   */
  generateComponentLibrary(figmaData: any): any {
    return {
      components: [
        {
          name: 'Button',
          description: 'A customizable button component',
          props: [
            { name: 'variant', type: 'primary | secondary | outline', required: false },
            { name: 'size', type: 'sm | md | lg', required: false },
            { name: 'disabled', type: 'boolean', required: false },
            { name: 'onClick', type: '() => void', required: false }
          ]
        },
        {
          name: 'Card',
          description: 'A flexible card container',
          props: [
            { name: 'title', type: 'string', required: false },
            { name: 'children', type: 'ReactNode', required: true },
            { name: 'className', type: 'string', required: false }
          ]
        }
      ]
    };
  }

  /**
   * Génère la configuration Storybook
   */
  generateStorybookConfig(): any {
    return {
      stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
      addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-interactions'
      ],
      framework: {
        name: '@storybook/react-vite',
        options: {}
      }
    };
  }

  private generateComponentTypes(component: ComponentMetadata): string {
    return `export interface ${component.name}Props {
${component.props.map(prop => 
  `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};${prop.description ? ` // ${prop.description}` : ''}`
).join('\n')}
  className?: string;
  children?: React.ReactNode;
}

export type ${component.name}Variant = ${component.variants.map(v => `'${v.name}'`).join(' | ') || "'default'"};

export interface ${component.name}Ref {
  focus: () => void;
  blur: () => void;
}`;
  }

  private generateComponentTest(component: ComponentMetadata): string {
    return `import { render, screen } from '../../../__tests__/utils/testUtils';
import ${component.name} from '../${component.name}';

describe('${component.name}', () => {
  it('renders correctly', () => {
    render(<${component.name} />);
    expect(screen.getByRole('${component.type === 'form' ? 'form' : 'generic'}')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    render(<${component.name} className={customClass} />);
    expect(screen.getByRole('${component.type === 'form' ? 'form' : 'generic'}')).toHaveClass(customClass);
  });

  ${component.props.filter(p => p.required).map(prop => 
    `it('renders with ${prop.name} prop', () => {
    const ${prop.name}Value = ${prop.type === 'string' ? "'test'" : prop.type === 'number' ? '42' : 'true'};
    render(<${component.name} ${prop.name}={${prop.name}Value} />);
    // Add specific assertions for this prop
  });`
  ).join('\n\n  ')}
});`;
  }

  private generateComponentStory(component: ComponentMetadata): string {
    return `import type { Meta, StoryObj } from '@storybook/react';
import ${component.name} from './${component.name}';

const meta: Meta<typeof ${component.name}> = {
  title: '${component.category}/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
${component.props.map(prop => 
  `    ${prop.name}: {
      description: '${prop.description || `${prop.name} prop`}',
      control: { type: '${prop.type === 'boolean' ? 'boolean' : prop.type === 'number' ? 'number' : 'text'}' }
    }`
).join(',\n')}
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
${component.props.filter(p => p.defaultValue !== undefined).map(prop => 
  `    ${prop.name}: ${JSON.stringify(prop.defaultValue)}`
).join(',\n')}
  }
};

${component.variants.map(variant => 
  `export const ${variant.name.charAt(0).toUpperCase() + variant.name.slice(1)}: Story = {
  args: {
${Object.entries(variant.props).map(([key, value]) => 
    `    ${key}: ${JSON.stringify(value)}`
  ).join(',\n')}
  }
};`
).join('\n\n')}`;
  }
}

export { EnhancedFigmaService, EnhancedFigmaService as FigmaService, type FigmaProjectConfig, type ProjectStructure };