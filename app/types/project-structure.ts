// Types pour la gestion de la structure de projet

export interface ProjectStructure {
  framework: string;
  features: string[];
  architecture: string[];
  dependencies: string[];
  folders: ProjectFolder[];
}

export interface ProjectFolder {
  name: string;
  path: string;
  description?: string;
  files?: ProjectFile[];
  subfolders?: ProjectFolder[];
}

export interface ProjectFile {
  name: string;
  extension: string;
  template?: string;
  description?: string;
}

export interface CustomProjectTemplate {
  id: string;
  name: string;
  description?: string;
  structure: ProjectStructure;
  createdAt: string;
  updatedAt: string;
  isCustom: true;
}

export const defaultProjectStructure: ProjectStructure = {
  framework: 'react',
  features: ['typescript', 'tailwind'],
  architecture: ['components', 'hooks', 'utils'],
  dependencies: ['react', 'typescript'],
  folders: [
    {
      name: 'src',
      path: '/src',
      description: 'Code source principal',
      subfolders: [
        {
          name: 'components',
          path: '/src/components',
          description: 'Composants React réutilisables'
        },
        {
          name: 'hooks',
          path: '/src/hooks',
          description: 'Hooks personnalisés'
        },
        {
          name: 'utils',
          path: '/src/utils',
          description: 'Fonctions utilitaires'
        }
      ]
    },
    {
      name: 'public',
      path: '/public',
      description: 'Fichiers statiques publics'
    }
  ]
};

export const frameworkOptions = [
  {
    key: 'react',
    label: 'React',
    description: 'Bibliothèque JavaScript pour construire des interfaces utilisateur',
    icon: 'i-bolt:react'
  },
  {
    key: 'vue',
    label: 'Vue.js',
    description: 'Framework JavaScript progressif',
    icon: 'i-bolt:vue'
  },
  {
    key: 'angular',
    label: 'Angular',
    description: 'Plateforme de développement pour applications web',
    icon: 'i-bolt:angular'
  },
  {
    key: 'svelte',
    label: 'Svelte',
    description: 'Framework de compilation pour interfaces utilisateur',
    icon: 'i-bolt:svelte'
  },
  {
    key: 'nextjs',
    label: 'Next.js',
    description: 'Framework React pour production',
    icon: 'i-bolt:nextjs'
  },
  {
    key: 'astro',
    label: 'Astro',
    description: 'Framework pour sites web statiques rapides',
    icon: 'i-bolt:astro'
  }
];

export const projectFeatures = [
  { key: 'typescript', label: 'TypeScript', description: 'Typage statique pour JavaScript' },
  { key: 'tailwind', label: 'Tailwind CSS', description: 'Framework CSS utilitaire' },
  { key: 'eslint', label: 'ESLint', description: 'Linter pour JavaScript/TypeScript' },
  { key: 'prettier', label: 'Prettier', description: 'Formateur de code' },
  { key: 'testing', label: 'Tests', description: 'Configuration de tests unitaires' },
  { key: 'storybook', label: 'Storybook', description: 'Outil de développement de composants' },
  { key: 'pwa', label: 'PWA', description: 'Progressive Web App' },
  { key: 'ssr', label: 'SSR', description: 'Server-Side Rendering' },
  { key: 'api', label: 'API Routes', description: 'Routes API intégrées' },
  { key: 'auth', label: 'Authentication', description: 'Système d\'authentification' },
  { key: 'database', label: 'Database', description: 'Intégration base de données' },
  { key: 'docker', label: 'Docker', description: 'Conteneurisation' }
];

export const architecturePatterns = [
  { key: 'mvc', label: 'MVC', description: 'Model-View-Controller' },
  { key: 'mvvm', label: 'MVVM', description: 'Model-View-ViewModel' },
  { key: 'component-based', label: 'Component-Based', description: 'Architecture basée sur les composants' },
  { key: 'atomic-design', label: 'Atomic Design', description: 'Méthodologie de design atomique' },
  { key: 'feature-sliced', label: 'Feature-Sliced', description: 'Architecture par fonctionnalités' },
  { key: 'layered', label: 'Layered', description: 'Architecture en couches' },
  { key: 'hexagonal', label: 'Hexagonal', description: 'Architecture hexagonale' },
  { key: 'microservices', label: 'Microservices', description: 'Architecture microservices' }
];

export const projectTemplatePresets = [
  {
    name: 'React Starter',
    description: 'Template React basique avec TypeScript et Tailwind',
    structure: {
      framework: 'react',
      features: ['typescript', 'tailwind', 'eslint', 'prettier'],
      architecture: ['component-based'],
      dependencies: ['react', 'typescript', 'tailwindcss'],
      folders: [
        {
          name: 'src',
          path: '/src',
          description: 'Code source',
          subfolders: [
            { name: 'components', path: '/src/components', description: 'Composants React' },
            { name: 'hooks', path: '/src/hooks', description: 'Hooks personnalisés' },
            { name: 'utils', path: '/src/utils', description: 'Utilitaires' },
            { name: 'types', path: '/src/types', description: 'Types TypeScript' }
          ]
        },
        { name: 'public', path: '/public', description: 'Fichiers statiques' }
      ]
    }
  },
  {
    name: 'Full-Stack Next.js',
    description: 'Application Next.js complète avec API et base de données',
    structure: {
      framework: 'nextjs',
      features: ['typescript', 'tailwind', 'api', 'database', 'auth'],
      architecture: ['feature-sliced', 'layered'],
      dependencies: ['next', 'typescript', 'prisma', 'next-auth'],
      folders: [
        {
          name: 'app',
          path: '/app',
          description: 'App Router Next.js 13+',
          subfolders: [
            { name: 'api', path: '/app/api', description: 'Routes API' },
            { name: '(auth)', path: '/app/(auth)', description: 'Pages d\'authentification' }
          ]
        },
        {
          name: 'components',
          path: '/components',
          description: 'Composants réutilisables',
          subfolders: [
            { name: 'ui', path: '/components/ui', description: 'Composants UI de base' },
            { name: 'forms', path: '/components/forms', description: 'Composants de formulaires' }
          ]
        },
        { name: 'lib', path: '/lib', description: 'Utilitaires et configurations' },
        { name: 'prisma', path: '/prisma', description: 'Schéma et migrations de base de données' }
      ]
    }
  },
  {
    name: 'Vue 3 Composition',
    description: 'Application Vue 3 avec Composition API et Pinia',
    structure: {
      framework: 'vue',
      features: ['typescript', 'tailwind', 'testing'],
      architecture: ['component-based', 'feature-sliced'],
      dependencies: ['vue', 'pinia', 'vue-router'],
      folders: [
        {
          name: 'src',
          path: '/src',
          description: 'Code source',
          subfolders: [
            { name: 'components', path: '/src/components', description: 'Composants Vue' },
            { name: 'composables', path: '/src/composables', description: 'Fonctions composables' },
            { name: 'stores', path: '/src/stores', description: 'Stores Pinia' },
            { name: 'views', path: '/src/views', description: 'Pages/Vues' },
            { name: 'router', path: '/src/router', description: 'Configuration du routeur' }
          ]
        }
      ]
    }
  }
];

// Utilitaires pour la gestion des templates personnalisés
export const customProjectTemplatesUtils = {
  loadCustomTemplates: (): CustomProjectTemplate[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('custom_project_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveCustomTemplates: (templates: CustomProjectTemplate[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('custom_project_templates', JSON.stringify(templates));
  },

  createCustomTemplate: (name: string, description: string, structure: ProjectStructure): CustomProjectTemplate => {
    const template: CustomProjectTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      structure,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true
    };

    const templates = customProjectTemplatesUtils.loadCustomTemplates();
    templates.push(template);
    customProjectTemplatesUtils.saveCustomTemplates(templates);
    
    return template;
  },

  updateCustomTemplate: (id: string, updates: Partial<Omit<CustomProjectTemplate, 'id' | 'createdAt' | 'isCustom'>>): void => {
    const templates = customProjectTemplatesUtils.loadCustomTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index !== -1) {
      templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      customProjectTemplatesUtils.saveCustomTemplates(templates);
    }
  },

  deleteCustomTemplate: (id: string): void => {
    const templates = customProjectTemplatesUtils.loadCustomTemplates();
    const filtered = templates.filter(t => t.id !== id);
    customProjectTemplatesUtils.saveCustomTemplates(filtered);
  },

  duplicateCustomTemplate: (id: string): CustomProjectTemplate | null => {
    const templates = customProjectTemplatesUtils.loadCustomTemplates();
    const template = templates.find(t => t.id === id);
    
    if (template) {
      return customProjectTemplatesUtils.createCustomTemplate(
        `${template.name} (Copie)`,
        template.description || '',
        template.structure
      );
    }
    
    return null;
  },

  validateTemplateName: (name: string, excludeId?: string): { isValid: boolean; error?: string } => {
    if (!name.trim()) {
      return { isValid: false, error: 'Le nom du template est requis' };
    }
    
    if (name.length < 3) {
      return { isValid: false, error: 'Le nom doit contenir au moins 3 caractères' };
    }
    
    if (name.length > 50) {
      return { isValid: false, error: 'Le nom ne peut pas dépasser 50 caractères' };
    }
    
    const templates = customProjectTemplatesUtils.loadCustomTemplates();
    const exists = templates.some(t => t.name === name && t.id !== excludeId);
    
    if (exists) {
      return { isValid: false, error: 'Un template avec ce nom existe déjà' };
    }
    
    return { isValid: true };
  },

  exportCustomTemplates: (): void => {
    const templates = customProjectTemplatesUtils.loadCustomTemplates();
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project-templates.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importCustomTemplates: async (file: File): Promise<CustomProjectTemplate[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (!Array.isArray(imported)) {
            throw new Error('Format de fichier invalide');
          }
          
          const existingTemplates = customProjectTemplatesUtils.loadCustomTemplates();
          const newTemplates = imported.map(template => ({
            ...template,
            id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          const allTemplates = [...existingTemplates, ...newTemplates];
          customProjectTemplatesUtils.saveCustomTemplates(allTemplates);
          resolve(newTemplates);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
};

// Fonction de validation de la structure de projet
export const validateProjectStructure = (structure: ProjectStructure): string[] => {
  const errors: string[] = [];
  
  if (!structure.framework) {
    errors.push('Un framework doit être sélectionné');
  }
  
  if (structure.folders.length === 0) {
    errors.push('Au moins un dossier doit être défini');
  }
  
  // Vérifier les noms de dossiers en double
  const folderNames = structure.folders.map(f => f.name);
  const duplicates = folderNames.filter((name, index) => folderNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Noms de dossiers en double: ${duplicates.join(', ')}`);
  }
  
  return errors;
};