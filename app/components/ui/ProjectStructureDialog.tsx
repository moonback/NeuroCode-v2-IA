import { useState, useEffect, useCallback, useMemo } from 'react';
import { IconButton } from './IconButton';
import { 
  ProjectStructureModal, 
  ProjectStructureModalRoot, 
  ProjectStructureModalHeader,
  ProjectStructureModalTabs,
  ProjectStructureModalContent,
  ProjectStructureModalFooter,
  ProjectStructureModalStyles
} from './ProjectStructureModal';
import type { ProjectStructure, CustomProjectTemplate, ProjectFolder } from '~/types/project-structure';
import { 
  defaultProjectStructure, 
  frameworkOptions, 
  projectFeatures, 
  architecturePatterns,
  projectTemplatePresets,
  customProjectTemplatesUtils,
  validateProjectStructure
} from '~/types/project-structure';

export interface ProjectStructureDialogProps {
  projectStructure?: ProjectStructure;
  setProjectStructure?: (structure: ProjectStructure) => void;
}

export const ProjectStructureDialog: React.FC<ProjectStructureDialogProps> = ({ 
  setProjectStructure, 
  projectStructure 
}) => {
  const [framework, setFramework] = useState<string>(
    projectStructure?.framework || defaultProjectStructure.framework
  );
  const [features, setFeatures] = useState<string[]>(
    projectStructure?.features || defaultProjectStructure.features
  );
  const [architecture, setArchitecture] = useState<string[]>(
    projectStructure?.architecture || defaultProjectStructure.architecture
  );
  const [dependencies, setDependencies] = useState<string[]>(
    projectStructure?.dependencies || defaultProjectStructure.dependencies
  );
  const [folders, setFolders] = useState<ProjectFolder[]>(
    projectStructure?.folders || defaultProjectStructure.folders
  );
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'framework' | 'features' | 'architecture' | 'folders' | 'presets' | 'custom'>('framework');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // États pour les templates personnalisés
  const [customTemplates, setCustomTemplates] = useState<CustomProjectTemplate[]>([]);
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<CustomProjectTemplate | null>(null);
  const [templateNameError, setTemplateNameError] = useState<string>('');
  
  // États pour l'édition de dossiers
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPath, setNewFolderPath] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);

  useEffect(() => {
    if (projectStructure) {
      setFramework(projectStructure.framework || defaultProjectStructure.framework);
      setFeatures(projectStructure.features || defaultProjectStructure.features);
      setArchitecture(projectStructure.architecture || defaultProjectStructure.architecture);
      setDependencies(projectStructure.dependencies || defaultProjectStructure.dependencies);
      setFolders(projectStructure.folders || defaultProjectStructure.folders);
    } else {
      setFramework(defaultProjectStructure.framework);
      setFeatures(defaultProjectStructure.features);
      setArchitecture(defaultProjectStructure.architecture);
      setDependencies(defaultProjectStructure.dependencies);
      setFolders(defaultProjectStructure.folders);
    }
  }, [projectStructure]);

  // Charger les templates personnalisés au montage du composant
  useEffect(() => {
    setCustomTemplates(customProjectTemplatesUtils.loadCustomTemplates());
  }, []);

  const handleFrameworkChange = (selectedFramework: string) => {
    setFramework(selectedFramework);
    
    // Adapter les fonctionnalités selon le framework
    const frameworkFeatures: Record<string, string[]> = {
      'react': ['typescript', 'tailwind', 'testing'],
      'vue': ['typescript', 'tailwind', 'testing'],
      'angular': ['typescript', 'testing'],
      'svelte': ['typescript', 'tailwind'],
      'nextjs': ['typescript', 'tailwind', 'api', 'ssr'],
      'astro': ['typescript', 'tailwind']
    };
    
    if (frameworkFeatures[selectedFramework]) {
      setFeatures(frameworkFeatures[selectedFramework]);
    }
  };

  const handleFeatureToggle = (key: string) => {
    setFeatures((prev) => 
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleArchitectureToggle = (key: string) => {
    setArchitecture((prev) => 
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim() || !newFolderPath.trim()) return;
    
    const newFolder: ProjectFolder = {
      name: newFolderName,
      path: newFolderPath,
      description: newFolderDescription || undefined
    };
    
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setNewFolderPath('');
    setNewFolderDescription('');
    setShowAddFolderDialog(false);
  };

  const handleRemoveFolder = (index: number) => {
    setFolders(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const structure: ProjectStructure = {
      framework,
      features,
      architecture,
      dependencies,
      folders
    };
    setProjectStructure?.(structure);
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    setFramework(defaultProjectStructure.framework);
    setFeatures(defaultProjectStructure.features);
    setArchitecture(defaultProjectStructure.architecture);
    setDependencies(defaultProjectStructure.dependencies);
    setFolders(defaultProjectStructure.folders);
  };

  const handlePresetSelect = (preset: typeof projectTemplatePresets[0]) => {
    setFramework(preset.structure.framework);
    setFeatures(preset.structure.features);
    setArchitecture(preset.structure.architecture);
    setDependencies(preset.structure.dependencies);
    setFolders(preset.structure.folders);
  };

  const handleExportStructure = useCallback(() => {
    const structure = { framework, features, architecture, dependencies, folders };
    const dataStr = JSON.stringify(structure, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project-structure.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [framework, features, architecture, dependencies, folders]);

  const handleImportStructure = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.framework) setFramework(imported.framework);
        if (imported.features) setFeatures(imported.features);
        if (imported.architecture) setArchitecture(imported.architecture);
        if (imported.dependencies) setDependencies(imported.dependencies);
        if (imported.folders) setFolders(imported.folders);
      } catch (error) {
        console.error('Erreur lors de l\'importation:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Fonctions pour la gestion des templates personnalisés
  const handleCreateCustomTemplate = useCallback(() => {
    const validation = customProjectTemplatesUtils.validateTemplateName(newTemplateName);
    if (!validation.isValid) {
      setTemplateNameError(validation.error || '');
      return;
    }

    customProjectTemplatesUtils.createCustomTemplate(
      newTemplateName,
      newTemplateDescription,
      { framework, features, architecture, dependencies, folders }
    );
    
    setCustomTemplates(customProjectTemplatesUtils.loadCustomTemplates());
    setNewTemplateName('');
    setNewTemplateDescription('');
    setTemplateNameError('');
    setShowCreateTemplateDialog(false);
  }, [newTemplateName, newTemplateDescription, framework, features, architecture, dependencies, folders]);

  const handleUpdateCustomTemplate = useCallback((template: CustomProjectTemplate) => {
    if (!editingTemplate) return;
    
    const validation = customProjectTemplatesUtils.validateTemplateName(template.name, editingTemplate.id);
    if (!validation.isValid) {
      setTemplateNameError(validation.error || '');
      return;
    }

    customProjectTemplatesUtils.updateCustomTemplate(editingTemplate.id, {
      name: template.name,
      description: template.description,
      structure: template.structure,
    });
    
    setCustomTemplates(customProjectTemplatesUtils.loadCustomTemplates());
    setEditingTemplate(null);
    setTemplateNameError('');
  }, [editingTemplate]);

  const handleDeleteCustomTemplate = useCallback((id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      customProjectTemplatesUtils.deleteCustomTemplate(id);
      setCustomTemplates(customProjectTemplatesUtils.loadCustomTemplates());
    }
  }, []);

  const handleDuplicateCustomTemplate = useCallback((id: string) => {
    const duplicated = customProjectTemplatesUtils.duplicateCustomTemplate(id);
    if (duplicated) {
      setCustomTemplates(customProjectTemplatesUtils.loadCustomTemplates());
    }
  }, []);

  const handleSelectCustomTemplate = useCallback((template: CustomProjectTemplate) => {
    setFramework(template.structure.framework);
    setFeatures(template.structure.features);
    setArchitecture(template.structure.architecture);
    setDependencies(template.structure.dependencies);
    setFolders(template.structure.folders);
  }, []);

  const handleSaveCurrentAsCustomTemplate = useCallback(() => {
    setShowCreateTemplateDialog(true);
    setActiveSection('custom');
  }, []);

  const handleImportCustomTemplates = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    customProjectTemplatesUtils.importCustomTemplates(file)
      .then((importedTemplates) => {
        setCustomTemplates(customProjectTemplatesUtils.loadCustomTemplates());
        console.log(`${importedTemplates.length} templates importés avec succès`);
      })
      .catch((error) => {
        console.error('Erreur lors de l\'importation des templates:', error);
      });
  }, []);

  // Filtrage des options basé sur la recherche
  const filteredFrameworks = useMemo(() => {
    if (!searchTerm) return frameworkOptions;
    return frameworkOptions.filter(fw => 
      fw.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fw.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredFeatures = useMemo(() => {
    if (!searchTerm) return projectFeatures;
    return projectFeatures.filter(feature => 
      feature.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Validation de la structure
  const structureWarnings = useMemo(() => {
    return validateProjectStructure({ framework, features, architecture, dependencies, folders });
  }, [framework, features, architecture, dependencies, folders]);

  // Fonction pour vérifier si un preset est actuellement sélectionné
  const isPresetSelected = (preset: typeof projectTemplatePresets[0]): boolean => {
    return (
      framework === preset.structure.framework &&
      JSON.stringify(features.sort()) === JSON.stringify(preset.structure.features.sort()) &&
      JSON.stringify(architecture.sort()) === JSON.stringify(preset.structure.architecture.sort()) &&
      JSON.stringify(folders) === JSON.stringify(preset.structure.folders)
    );
  };

  // Fonction pour vérifier si un template personnalisé est actuellement sélectionné
  const isCustomTemplateSelected = (template: CustomProjectTemplate): boolean => {
    return (
      framework === template.structure.framework &&
      JSON.stringify(features.sort()) === JSON.stringify(template.structure.features.sort()) &&
      JSON.stringify(architecture.sort()) === JSON.stringify(template.structure.architecture.sort()) &&
      JSON.stringify(folders) === JSON.stringify(template.structure.folders)
    );
  };

  const renderFrameworkSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Framework Principal
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFrameworks.map((fw) => {
          const isSelected = framework === fw.key;
          
          return (
            <div
              key={fw.key}
              className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-md'
                  : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border-transparent hover:border-bolt-elements-borderColor'
              }`}
              onClick={() => handleFrameworkChange(fw.key)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center shadow-sm">
                  <span className="i-ph:check text-white text-xs" />
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-2">
                <div className={`${fw.icon} text-2xl ${isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'}`} />
                <h4 className={`font-semibold text-sm ${
                  isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
                }`}>
                  {fw.label}
                </h4>
              </div>
              
              <p className={`text-xs ${
                isSelected ? 'text-bolt-elements-item-contentAccent/80' : 'text-bolt-elements-textSecondary'
              }`}>
                {fw.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Fonctionnalités du Projet
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFeatures.map((feature) => {
          const isSelected = features.includes(feature.key);
          
          return (
            <div
              key={feature.key}
              className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-md'
                  : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border-transparent hover:border-bolt-elements-borderColor'
              }`}
              onClick={() => handleFeatureToggle(feature.key)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center">
                  <span className="i-ph:check text-white text-xs" />
                </div>
              )}
              
              <h4 className={`font-semibold text-sm mb-1 ${
                isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
              }`}>
                {feature.label}
              </h4>
              
              <p className={`text-xs ${
                isSelected ? 'text-bolt-elements-item-contentAccent/80' : 'text-bolt-elements-textSecondary'
              }`}>
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderArchitectureSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Patterns d'Architecture
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {architecturePatterns.map((pattern) => {
          const isSelected = architecture.includes(pattern.key);
          
          return (
            <div
              key={pattern.key}
              className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-md'
                  : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border-transparent hover:border-bolt-elements-borderColor'
              }`}
              onClick={() => handleArchitectureToggle(pattern.key)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center">
                  <span className="i-ph:check text-white text-xs" />
                </div>
              )}
              
              <h4 className={`font-semibold text-sm mb-1 ${
                isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
              }`}>
                {pattern.label}
              </h4>
              
              <p className={`text-xs ${
                isSelected ? 'text-bolt-elements-item-contentAccent/80' : 'text-bolt-elements-textSecondary'
              }`}>
                {pattern.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFoldersSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Structure des Dossiers
        </h3>
        <button
          onClick={() => setShowAddFolderDialog(true)}
          className="text-xs bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
        >
          <span className="i-ph:plus text-xs" />
          Ajouter
        </button>
      </div>

      <div className="bg-bolt-elements-bg-depth-3 rounded-lg p-4 folder-tree">
        <div className="text-bolt-elements-textPrimary font-mono text-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="i-ph:folder text-bolt-elements-item-contentAccent" />
            <span className="font-semibold">project/</span>
          </div>
          
          {folders.map((folder, index) => (
            <div key={index} className="folder-item relative">
              <div className="flex items-center justify-between group hover:bg-bolt-elements-bg-depth-2 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="i-ph:folder text-bolt-elements-textSecondary" />
                  <span className="text-bolt-elements-textPrimary">{folder.name}/</span>
                  {folder.description && (
                    <span className="text-bolt-elements-textTertiary text-xs">({folder.description})</span>
                  )}
                </div>
                
                <button
                  onClick={() => handleRemoveFolder(index)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200"
                  title="Supprimer"
                >
                  <span className="i-ph:trash text-xs" />
                </button>
              </div>
              
              {folder.subfolders?.map((subfolder, subIndex) => (
                <div key={subIndex} className="ml-6 flex items-center gap-2 py-1">
                  <span className="i-ph:folder text-bolt-elements-textTertiary" />
                  <span className="text-bolt-elements-textSecondary">{subfolder.name}/</span>
                  {subfolder.description && (
                    <span className="text-bolt-elements-textTertiary text-xs">({subfolder.description})</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog d'ajout de dossier */}
      {showAddFolderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-bolt-elements-bg-depth-1 rounded-lg p-6 w-full max-w-md border border-bolt-elements-borderColor">
            <h4 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Ajouter un Dossier</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Nom du dossier
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent"
                  placeholder="ex: components"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Chemin
                </label>
                <input
                  type="text"
                  value={newFolderPath}
                  onChange={(e) => setNewFolderPath(e.target.value)}
                  className="w-full px-3 py-2 bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent"
                  placeholder="ex: /src/components"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent"
                  placeholder="ex: Composants React réutilisables"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddFolderDialog(false);
                  setNewFolderName('');
                  setNewFolderPath('');
                  setNewFolderDescription('');
                }}
                className="px-4 py-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddFolder}
                disabled={!newFolderName.trim() || !newFolderPath.trim()}
                className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPresetsSection = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Templates Prédéfinis
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {projectTemplatePresets.map((preset, index) => {
          const isSelected = isPresetSelected(preset);
          
          return (
            <div
              key={index}
              className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer compact-card ${
                isSelected
                  ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-md'
                  : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border-transparent hover:border-bolt-elements-borderColor'
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center shadow-sm">
                  <span className="i-ph:check text-white text-xs" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-semibold text-sm transition-colors truncate ${
                  isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
                }`}>
                  {preset.name}
                </h4>
              </div>
              
              <p className={`text-xs mb-2 line-clamp-2 compact-text ${
                isSelected ? 'text-bolt-elements-item-contentAccent/80' : 'text-bolt-elements-textSecondary'
              }`}>
                {preset.description}
              </p>
              
              <div className={`text-xs transition-colors compact-text ${
                isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'
              }`}>
                {preset.structure.framework} • {preset.structure.features.length} fonctionnalités
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCustomTemplatesSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Mes Templates
        </h3>
        <button
          onClick={() => setShowCreateTemplateDialog(true)}
          className="text-xs bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
        >
          <span className="i-ph:plus text-xs" />
          Nouveau
        </button>
      </div>
      
      {customTemplates.length === 0 ? (
        <div className="text-center py-8">
          <span className="i-ph:folder-simple text-4xl text-bolt-elements-textTertiary mb-3 block" />
          <p className="text-bolt-elements-textSecondary text-sm mb-1">
            Aucun template personnalisé créé
          </p>
          <p className="text-bolt-elements-textTertiary text-xs">
            Créez votre premier template de structure de projet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {customTemplates.map((template) => {
            const isSelected = isCustomTemplateSelected(template);
            return (
              <div
                key={template.id}
                className={`group relative overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer compact-card ${
                  isSelected
                    ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-md'
                    : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border-bolt-elements-borderColor/30 hover:border-bolt-elements-borderColor'
                }`}
                onClick={() => handleSelectCustomTemplate(template)}
              >
                {/* Actions compactes */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateCustomTemplate(template.id);
                    }}
                    className="w-6 h-6 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-bg-depth-1 rounded text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-all duration-200 flex items-center justify-center"
                    title="Dupliquer"
                  >
                    <span className="i-ph:copy text-xs" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTemplate(template);
                      setNewTemplateName(template.name);
                      setNewTemplateDescription(template.description || '');
                      setShowCreateTemplateDialog(true);
                    }}
                    className="w-6 h-6 bg-blue-500/20 hover:bg-blue-500/30 rounded text-bolt-elements-textSecondary hover:text-blue-400 transition-all duration-200 flex items-center justify-center"
                    title="Modifier"
                  >
                    <span className="i-ph:pencil text-xs" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomTemplate(template.id);
                    }}
                    className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 rounded text-bolt-elements-textSecondary hover:text-red-400 transition-all duration-200 flex items-center justify-center"
                    title="Supprimer"
                  >
                    <span className="i-ph:trash text-xs" />
                  </button>
                </div>

                {/* Indicateur de sélection */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center shadow-sm">
                    <span className="i-ph:check text-white text-xs" />
                  </div>
                )}

                {/* Contenu */}
                <div className="p-3">
                  <h4 className={`font-semibold text-sm mb-1 truncate ${
                    isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
                  }`}>
                    {template.name}
                  </h4>
                  
                  {template.description && (
                    <p className={`text-xs mb-2 line-clamp-2 compact-text ${
                      isSelected ? 'text-bolt-elements-item-contentAccent/80' : 'text-bolt-elements-textSecondary'
                    }`}>
                      {template.description}
                    </p>
                  )}
                  
                  <div className={`text-xs transition-colors compact-text ${
                    isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'
                  }`}>
                    {template.structure.framework} • {template.structure.features.length} fonctionnalités
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de création/modification de template */}
      {showCreateTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-bolt-elements-bg-depth-1 rounded-lg p-6 w-full max-w-md border border-bolt-elements-borderColor">
            <h4 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">
              {editingTemplate ? 'Modifier le Template' : 'Créer un Template'}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Nom du template
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => {
                    setNewTemplateName(e.target.value);
                    setTemplateNameError('');
                  }}
                  className={`w-full px-3 py-2 bg-bolt-elements-bg-depth-3 border rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent ${
                    templateNameError ? 'border-red-500' : 'border-bolt-elements-borderColor'
                  }`}
                  placeholder="ex: Mon Template React"
                />
                {templateNameError && (
                  <p className="text-red-400 text-xs mt-1">{templateNameError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent resize-none"
                  rows={3}
                  placeholder="Description de votre template..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateTemplateDialog(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                  setEditingTemplate(null);
                  setTemplateNameError('');
                }}
                className="px-4 py-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingTemplate ? 
                  () => handleUpdateCustomTemplate({
                    ...editingTemplate,
                    name: newTemplateName,
                    description: newTemplateDescription,
                    structure: { framework, features, architecture, dependencies, folders }
                  }) : 
                  handleCreateCustomTemplate
                }
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {editingTemplate ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ProjectStructureModalStyles />
      
      {/* Bouton d'ouverture */}
      <IconButton
        onClick={() => setIsDialogOpen(true)}
        className="transition-theme"
        title="Configurer la structure du projet"
      >
        <span className="i-ph:folder-simple-dashed text-lg" />
      </IconButton>

      {/* Modal */}
      {isDialogOpen && (
        <ProjectStructureModal>
          <ProjectStructureModalRoot>
            <ProjectStructureModalHeader>
              <div className="flex items-center gap-3">
                <span className="i-ph:folder-simple-dashed text-xl text-bolt-elements-item-contentAccent" />
                <div>
                  <h2 className="text-xl font-bold text-bolt-elements-textPrimary">
                    Configuration de la Structure du Projet
                  </h2>
                  <p className="text-sm text-bolt-elements-textSecondary">
                    Définissez l'architecture et l'organisation de votre projet
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Boutons d'import/export */}
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportStructure}
                    className="hidden"
                    id="import-structure"
                  />
                  <label
                    htmlFor="import-structure"
                    className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-3 rounded-md transition-all duration-200 cursor-pointer"
                    title="Importer une structure"
                  >
                    <span className="i-ph:upload text-sm" />
                  </label>
                  
                  <button
                    onClick={handleExportStructure}
                    className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-3 rounded-md transition-all duration-200"
                    title="Exporter la structure"
                  >
                    <span className="i-ph:download text-sm" />
                  </button>
                  
                  <button
                    onClick={handleSaveCurrentAsCustomTemplate}
                    className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-3 rounded-md transition-all duration-200"
                    title="Sauvegarder comme template"
                  >
                    <span className="i-ph:bookmark text-sm" />
                  </button>
                </div>
                
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-3 rounded-md transition-all duration-200"
                >
                  <span className="i-ph:x text-lg" />
                </button>
              </div>
            </ProjectStructureModalHeader>

            <ProjectStructureModalTabs>
              {[
                { key: 'framework', label: 'Framework', icon: 'i-ph:code' },
                { key: 'features', label: 'Fonctionnalités', icon: 'i-ph:puzzle-piece' },
                { key: 'architecture', label: 'Architecture', icon: 'i-ph:buildings' },
                { key: 'folders', label: 'Dossiers', icon: 'i-ph:folder' },
                { key: 'presets', label: 'Presets', icon: 'i-ph:star' },
                { key: 'custom', label: 'Mes Templates', icon: 'i-ph:heart' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeSection === tab.key
                      ? 'text-bolt-elements-item-contentAccent border-bolt-elements-item-contentAccent bg-bolt-elements-item-backgroundAccent/20'
                      : 'text-bolt-elements-textSecondary border-transparent hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-2'
                  }`}
                >
                  <span className={`${tab.icon} text-base`} />
                  {tab.label}
                </button>
              ))}
            </ProjectStructureModalTabs>

            <ProjectStructureModalContent>
              {/* Barre de recherche */}
              {(activeSection === 'framework' || activeSection === 'features') && (
                <div className="mb-6">
                  <div className="relative">
                    <span className="i-ph:magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-bolt-elements-textTertiary" />
                    <input
                      type="text"
                      placeholder={`Rechercher ${activeSection === 'framework' ? 'un framework' : 'des fonctionnalités'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Contenu des sections */}
              {activeSection === 'framework' && renderFrameworkSection()}
              {activeSection === 'features' && renderFeaturesSection()}
              {activeSection === 'architecture' && renderArchitectureSection()}
              {activeSection === 'folders' && renderFoldersSection()}
              {activeSection === 'presets' && renderPresetsSection()}
              {activeSection === 'custom' && renderCustomTemplatesSection()}

              {/* Avertissements de validation */}
              {structureWarnings.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="i-ph:warning text-yellow-500" />
                    <h4 className="font-semibold text-yellow-500">Avertissements</h4>
                  </div>
                  <ul className="text-sm text-yellow-400 space-y-1">
                    {structureWarnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </ProjectStructureModalContent>

            <ProjectStructureModalFooter>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                >
                  Réinitialiser
                </button>
                
                <div className="text-xs text-bolt-elements-textTertiary">
                  Framework: {framework} • {features.length} fonctionnalités • {folders.length} dossiers
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md transition-all duration-200 font-medium"
                >
                  Appliquer
                </button>
              </div>
            </ProjectStructureModalFooter>
          </ProjectStructureModalRoot>
        </ProjectStructureModal>
      )}
    </>
  );
};