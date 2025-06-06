import { useState, useEffect, useCallback, useMemo } from 'react';
import { IconButton } from './IconButton';
import { 
  ColorSchemeModal, 
  ColorSchemeModalRoot, 
  ColorSchemeModalHeader,
  ColorSchemeModalTabs,
  ColorSchemeModalContent,
  ColorSchemeModalFooter,
  ColorSchemeModalStyles
} from './ColorSchemeModal';
import type { DesignScheme, CustomColorGroup } from '~/types/design-scheme';
import { 
  defaultDesignScheme, 
  designFeatures, 
  designFonts, 
  paletteRoles,
  themePresets,
  colorUtils,
  validateDesignScheme,
  checkWCAGCompliance,
  ACCESSIBILITY_STANDARDS,
  customColorGroupsUtils
} from '~/types/design-scheme';

export interface ColorSchemeDialogProps {
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
}

// Utilisation des préréglages de thèmes depuis design-scheme.ts
const colorPresets = themePresets;

export const ColorSchemeDialog: React.FC<ColorSchemeDialogProps> = ({ setDesignScheme, designScheme }) => {
  const [palette, setPalette] = useState<{ [key: string]: string }>(() => {
    if (designScheme?.palette) {
      return { ...defaultDesignScheme.palette, ...designScheme.palette };
    }

    return defaultDesignScheme.palette;
  });

  const [features, setFeatures] = useState<string[]>(designScheme?.features || defaultDesignScheme.features);
  const [font, setFont] = useState<string[]>(designScheme?.font || defaultDesignScheme.font);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'features' | 'presets' | 'custom'>('colors');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // États pour les groupes personnalisés
  const [customGroups, setCustomGroups] = useState<CustomColorGroup[]>([]);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState<CustomColorGroup | null>(null);
  const [groupNameError, setGroupNameError] = useState<string>('');


  useEffect(() => {
    if (designScheme) {
      setPalette(() => ({ ...defaultDesignScheme.palette, ...designScheme.palette }));
      setFeatures(designScheme.features || defaultDesignScheme.features);
      setFont(designScheme.font || defaultDesignScheme.font);
    } else {
      setPalette(defaultDesignScheme.palette);
      setFeatures(defaultDesignScheme.features);
      setFont(defaultDesignScheme.font);
    }
  }, [designScheme]);

  // Charger les groupes personnalisés au montage du composant
  useEffect(() => {
    setCustomGroups(customColorGroupsUtils.loadCustomGroups());
  }, []);

  const handleColorChange = (role: string, value: string) => {
    setPalette((prev) => ({ ...prev, [role]: value }));
  };

  const handleFeatureToggle = (key: string) => {
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleFontToggle = (key: string) => {
    setFont((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleSave = () => {
    setDesignScheme?.({ palette, features, font });
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    setPalette(defaultDesignScheme.palette);
    setFeatures(defaultDesignScheme.features);
    setFont(defaultDesignScheme.font);
  };

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setPalette(preset.scheme.palette);
    setFeatures(preset.scheme.features);
    setFont(preset.scheme.font);
  };

  const handleExportScheme = useCallback(() => {
    const scheme = { palette, features, font };
    const dataStr = JSON.stringify(scheme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design-scheme.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [palette, features, font]);

  const handleImportScheme = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.palette) setPalette({ ...defaultDesignScheme.palette, ...imported.palette });
        if (imported.features) setFeatures(imported.features);
        if (imported.font) setFont(imported.font);
      } catch (error) {
        console.error('Erreur lors de l\'importation:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Fonctions pour la gestion des groupes personnalisés
  const handleCreateCustomGroup = useCallback(() => {
    const validation = customColorGroupsUtils.validateGroupName(newGroupName);
    if (!validation.isValid) {
      setGroupNameError(validation.error || '');
      return;
    }

    
    setCustomGroups(customColorGroupsUtils.loadCustomGroups());
    setNewGroupName('');
    setNewGroupDescription('');
    setGroupNameError('');
    setShowCreateGroupDialog(false);
  }, [newGroupName, newGroupDescription, palette, features, font]);

  const handleUpdateCustomGroup = useCallback((group: CustomColorGroup) => {
    if (!editingGroup) return;
    
    const validation = customColorGroupsUtils.validateGroupName(group.name, editingGroup.id);
    if (!validation.isValid) {
      setGroupNameError(validation.error || '');
      return;
    }

    customColorGroupsUtils.updateCustomGroup(editingGroup.id, {
      name: group.name,
      description: group.description,
      scheme: group.scheme,
    });
    
    setCustomGroups(customColorGroupsUtils.loadCustomGroups());
    setEditingGroup(null);
    setGroupNameError('');
  }, [editingGroup]);

  const handleDeleteCustomGroup = useCallback((id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe de couleurs ?')) {
      customColorGroupsUtils.deleteCustomGroup(id);
      setCustomGroups(customColorGroupsUtils.loadCustomGroups());
    }
  }, []);

  const handleDuplicateCustomGroup = useCallback((id: string) => {
    const duplicated = customColorGroupsUtils.duplicateCustomGroup(id);
    if (duplicated) {
      setCustomGroups(customColorGroupsUtils.loadCustomGroups());
    }
  }, []);

  const handleSelectCustomGroup = useCallback((group: CustomColorGroup) => {
    setPalette(group.scheme.palette);
    setFeatures(group.scheme.features);
    setFont(group.scheme.font);
  }, []);

  const handleSaveCurrentAsCustomGroup = useCallback(() => {
    setShowCreateGroupDialog(true);
    setActiveSection('custom');
  }, []);

  const handleImportCustomGroups = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    customColorGroupsUtils.importCustomGroups(file)
      .then((importedGroups) => {
        setCustomGroups(customColorGroupsUtils.loadCustomGroups());
        console.log(`${importedGroups.length} groupes importés avec succès`);
      })
      .catch((error) => {
        console.error('Erreur lors de l\'importation des groupes:', error);
      });
  }, []);


  // Filtrage des rôles de couleur basé sur la recherche
  const filteredPaletteRoles = useMemo(() => {
    if (!searchTerm) return paletteRoles;
    return paletteRoles.filter(role => 
      role.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Validation des contrastes avec les nouvelles fonctions
  const contrastWarnings = useMemo(() => {
    const warnings: string[] = [];
    const validationErrors = validateDesignScheme({ palette, features, font });
    
    // Ajouter les erreurs de validation
    warnings.push(...validationErrors);
    
    // Vérifications WCAG supplémentaires
    if (!checkWCAGCompliance(palette.text, palette.background, 'AA', 'normal')) {
      warnings.push('Le texte principal ne respecte pas les standards WCAG AA');
    }
    
    if (!checkWCAGCompliance(palette.primary, palette.background, 'AA', 'normal')) {
      warnings.push('La couleur primaire ne respecte pas les standards WCAG AA');
    }
    
    return warnings;
  }, [palette, features, font]);





  // Fonction pour vérifier si un préréglage est actuellement sélectionné
  const isPresetSelected = (preset: typeof colorPresets[0]): boolean => {
    const paletteMatch = Object.keys(preset.scheme.palette).every(key => 
      palette[key] === preset.scheme.palette[key as keyof typeof preset.scheme.palette]
    );
    const featuresMatch = JSON.stringify(features.sort()) === JSON.stringify(preset.scheme.features.sort());
    const fontMatch = JSON.stringify(font.sort()) === JSON.stringify(preset.scheme.font.sort());
    
    return paletteMatch && featuresMatch && fontMatch;
  };

  // Fonction pour vérifier si un groupe personnalisé est actuellement sélectionné
  const isCustomGroupSelected = (group: CustomColorGroup): boolean => {
    const paletteMatch = Object.keys(group.scheme.palette).every(key => 
      palette[key] === group.scheme.palette[key]
    );
    const featuresMatch = JSON.stringify(features.sort()) === JSON.stringify(group.scheme.features.sort());
    const fontMatch = JSON.stringify(font.sort()) === JSON.stringify(group.scheme.font.sort());
    
    return paletteMatch && featuresMatch && fontMatch;
  };

  const renderPresetsSection = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Préréglages de Couleurs
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {colorPresets.map((preset, index) => {
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
              {/* Indicateur de sélection compact */}
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
              
              <div className="flex gap-1 mb-2">
                {Object.entries(preset.scheme.palette).slice(0, 5).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-5 h-5 rounded shadow-sm"
                    style={{ backgroundColor: color }}
                    title={`${key}: ${color}`}
                  />
                ))}
                {Object.keys(preset.scheme.palette).length > 5 && (
                  <div className="w-5 h-5 rounded bg-bolt-elements-bg-depth-1 border border-dashed border-bolt-elements-borderColor flex items-center justify-center text-bolt-elements-textTertiary text-xs font-medium">
                    +{Object.keys(preset.scheme.palette).length - 5}
                  </div>
                )}
              </div>
              
              <div className={`text-xs transition-colors compact-text ${
                isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'
              }`}>
                {Object.keys(preset.scheme.palette).length} couleurs • {preset.scheme.features.length} fonctionnalités
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCustomGroupsSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Mes Groupes de Couleurs
        </h3>
        <button
          onClick={() => setShowCreateGroupDialog(true)}
          className="text-xs bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
        >
          <span className="i-ph:plus text-xs" />
          Nouveau
        </button>
      </div>
      
      {customGroups.length === 0 ? (
        <div className="text-center py-8">
          <span className="i-ph:heart text-4xl text-bolt-elements-textTertiary mb-3 block" />
          <p className="text-bolt-elements-textSecondary text-sm mb-1">
            Aucun groupe personnalisé créé
          </p>
          <p className="text-bolt-elements-textTertiary text-xs">
            Créez votre premier groupe de couleurs personnalisé
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {customGroups.map((group) => {
            const isSelected = isCustomGroupSelected(group);
            return (
              <div
                key={group.id}
                className={`group relative overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer compact-card ${
                  isSelected
                    ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-md'
                    : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border-bolt-elements-borderColor/30 hover:border-bolt-elements-borderColor'
                }`}
                onClick={() => handleSelectCustomGroup(group)}
              >
                {/* Actions compactes */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateCustomGroup(group.id);
                    }}
                    className="w-6 h-6 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-bg-depth-1 rounded text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-all duration-200 flex items-center justify-center"
                    title="Dupliquer"
                  >
                    <span className="i-ph:copy text-xs" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setNewGroupName(group.name);
                      setNewGroupDescription(group.description || '');
                      setShowCreateGroupDialog(true);
                    }}
                    className="w-6 h-6 bg-blue-500/20 hover:bg-blue-500/30 rounded text-bolt-elements-textSecondary hover:text-blue-400 transition-all duration-200 flex items-center justify-center"
                    title="Modifier"
                  >
                    <span className="i-ph:pencil text-xs" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomGroup(group.id);
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
                    {group.name}
                  </h4>
                  
                  {group.description && (
                    <p className={`text-xs mb-2 line-clamp-2 compact-text ${
                      isSelected ? 'text-bolt-elements-item-contentAccent/80' : 'text-bolt-elements-textSecondary'
                    }`}>
                      {group.description}
                    </p>
                  )}
                  
                  {/* Palette compacte */}
                  <div className="flex gap-1 mb-2">
                    {Object.entries(group.scheme.palette).slice(0, 6).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-4 h-4 rounded shadow-sm"
                        style={{ backgroundColor: color }}
                        title={`${key}: ${color}`}
                      />
                    ))}
                    {Object.keys(group.scheme.palette).length > 6 && (
                      <div className="w-4 h-4 rounded bg-bolt-elements-bg-depth-1 border border-dashed border-bolt-elements-borderColor flex items-center justify-center text-bolt-elements-textTertiary text-xs font-medium">
                        +{Object.keys(group.scheme.palette).length - 6}
                      </div>
                    )}
                  </div>
                  
                  {/* Statistiques compactes */}
                  <div className={`text-xs compact-text ${
                    isSelected ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'
                  }`}>
                    {Object.keys(group.scheme.palette).length} couleurs • {group.scheme.features.length} fonctionnalités
                  </div>
                  
                  <div className={`text-xs mt-1 compact-text ${
                    isSelected ? 'text-bolt-elements-item-contentAccent/70' : 'text-bolt-elements-textTertiary'
                  }`}>
                    {new Date(group.createdAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions d'import/export compactes */}
      <div className="flex justify-center gap-2 pt-2 border-t border-bolt-elements-borderColor">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(customGroups, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `custom-color-groups-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
          className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
        >
          <span className="i-ph:download-simple text-xs" />
          Exporter Groupes
        </button>
        
        <label className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200 cursor-pointer">
          <span className="i-ph:upload-simple text-xs" />
          Importer Groupes
          <input
            type="file"
            accept=".json"
            onChange={handleImportCustomGroups}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );

  const renderColorSection = () => (
    <div className="space-y-6">
  {/* Header avec titre et contrôles */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-bolt-elements-item-contentAccent to-bolt-elements-item-contentAccent/70 shadow-lg"></div>
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-bolt-elements-item-contentAccent animate-ping opacity-30"></div>
      </div>
      <h3 className="text-xl font-bold text-bolt-elements-textPrimary bg-gradient-to-r from-bolt-elements-textPrimary to-bolt-elements-textSecondary bg-clip-text">
        Palette de Couleurs
      </h3>
      <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-bolt-elements-bg-depth-3 rounded-full">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
        <span className="text-xs text-bolt-elements-textTertiary font-medium">
          {filteredPaletteRoles?.length || 0} couleurs
        </span>
      </div>
    </div>
    
    <div className="flex gap-2 w-full sm:w-auto">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`group relative overflow-hidden flex-1 sm:flex-initial text-sm rounded-xl flex items-center justify-center gap-2 px-4 py-2.5 transition-all duration-300 transform hover:scale-105 ${
          showAdvanced
            ? 'bg-gradient-to-r from-bolt-elements-item-contentAccent/20 to-bolt-elements-item-contentAccent/10 text-bolt-elements-item-contentAccent border border-bolt-elements-item-contentAccent/30 shadow-lg shadow-bolt-elements-item-contentAccent/20'
            : 'bg-bolt-elements-button-primary-background hover:from-bolt-elements-bg-depth-1 hover:to-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor/30 hover:border-bolt-elements-borderColor'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className={`i-ph:${showAdvanced ? 'eye-slash' : 'eye'} text-base group-hover:scale-110 transition-transform duration-200`} />
        <span className="font-medium">{showAdvanced ? 'Mode Simple' : 'Mode Avancé'}</span>
      </button>
      
      <button
        onClick={handleReset}
        className="group relative overflow-hidden flex-1 sm:flex-initial text-sm bg-red-500 text-white hover:from-red-500/20 hover:to-orange-500/20 text-red-400 hover:text-red-300 rounded-xl flex items-center justify-center gap-2 px-4 py-2.5 transition-all duration-300 border border-red-500/30 hover:border-red-400/50 shadow-sm hover:shadow-md hover:shadow-red-500/20 transform hover:scale-105"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="i-ph:arrow-clockwise text-base group-hover:rotate-180 transition-transform duration-300" />
        <span className="font-medium">Réinitialiser</span>
      </button>
    </div>
  </div>

  {/* Barre de recherche améliorée */}
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-bolt-elements-borderColorActive/20 to-bolt-elements-borderColorActive/10 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <input
        type="text"
        placeholder="Rechercher une couleur par nom, hex, ou rôle..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-5 py-3.5 pl-12 bg-gradient-to-r from-bolt-elements-bg-depth-3 to-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor/50 rounded-xl text-bolt-elements-textPrimary placeholder-bolt-elements-textSecondary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive/50 focus:border-bolt-elements-borderColorActive transition-all duration-300 shadow-sm focus:shadow-lg"
      />
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
        <span className="i-ph:magnifying-glass text-lg text-bolt-elements-textSecondary group-focus-within:text-bolt-elements-borderColorActive transition-colors duration-200" />
      </div>
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-bolt-elements-bg-depth-1 rounded-lg transition-colors duration-200"
        >
          <span className="i-ph:x text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary" />
        </button>
      )}
    </div>
  </div>

  {/* Avertissements de contraste redesignés */}
  {showAdvanced && contrastWarnings.length > 0 && (
    <div className="relative overflow-hidden p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <span className="i-ph:warning text-lg text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-bolt-elements-textPrimary">Problèmes d'Accessibilité Détectés</h4>
            <p className="text-xs text-bolt-elements-textSecondary">Ces couleurs ne respectent pas les standards WCAG</p>
          </div>
        </div>
        <div className="space-y-2">
          {contrastWarnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-bolt-elements-textSecondary bg-bolt-elements-bg-depth-3/50 rounded-lg p-2">
              <span className="i-ph:dot text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{warning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Grille de couleurs améliorée */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
    {filteredPaletteRoles.map((role, index) => {
      const contrastRatio = role.key === 'text' ? colorUtils.getContrastRatio(palette[role.key], palette.background) : null;
      const hasGoodContrast = contrastRatio ? contrastRatio >= ACCESSIBILITY_STANDARDS.WCAG_AA_NORMAL : true;
      
      return (
        <div
          key={role.key}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bolt-elements-bg-depth-3 to-bolt-elements-bg-depth-2 hover:from-bolt-elements-bg-depth-2 hover:to-bolt-elements-bg-depth-1 border border-bolt-elements-borderColor/30 hover:border-bolt-elements-borderColor transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="relative flex items-center gap-4 p-5">
            {/* Color picker amélioré */}
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 ring-2 ring-transparent hover:ring-bolt-elements-borderColorActive/50 hover:shadow-xl"
                style={{ 
                  backgroundColor: palette[role.key],
                  boxShadow: `0 8px 25px ${palette[role.key]}30, 0 0 0 1px rgba(255,255,255,0.1)`
                }}
                onClick={() => document.getElementById(`color-input-${role.key}`)?.click()}
                role="button"
                tabIndex={0}
                aria-label={`Changer la couleur ${role.label}`}
              />
              <input
                id={`color-input-${role.key}`}
                type="color"
                value={palette[role.key]}
                onChange={(e) => handleColorChange(role.key, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
              />
              
              {/* Icône d'édition */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-bolt-elements-bg-depth-1 rounded-full flex items-center justify-center shadow-md border border-bolt-elements-borderColor/50 group-hover:scale-110 transition-transform duration-200">
                <span className="i-ph:pencil-simple text-xs text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary" />
              </div>
              
              {/* Indicateur de contraste */}
              {showAdvanced && contrastRatio && (
                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white/20 ${
                  hasGoodContrast ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'
                }`}>
                  <span className={`i-ph:${hasGoodContrast ? 'check' : 'x'} text-white text-xs drop-shadow-sm`} />
                </div>
              )}
            </div>
            
            {/* Informations de la couleur */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-bolt-elements-textPrimary transition-colors truncate">
                  {role.label}
                </h4>
                {role.key === 'primary' && (
                  <div className="px-2 py-0.5 bg-bolt-elements-item-contentAccent/20 text-bolt-elements-item-contentAccent text-xs font-medium rounded-full">
                    Principal
                  </div>
                )}
              </div>
              
              <p className="text-sm text-bolt-elements-textSecondary leading-relaxed line-clamp-2">
                {role.description}
              </p>
              
              {/* Métadonnées */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="text-xs text-bolt-elements-textTertiary font-mono px-2.5 py-1 bg-bolt-elements-bg-depth-1 rounded-lg border border-bolt-elements-borderColor/30 hover:border-bolt-elements-borderColor transition-colors cursor-pointer" 
                     onClick={() => navigator.clipboard?.writeText(palette[role.key])}
                     title="Cliquer pour copier">
                  {palette[role.key]}
                </div>
                
                {showAdvanced && contrastRatio && (
                  <div className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    hasGoodContrast 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    Contraste: {contrastRatio.toFixed(1)}:1
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>

  {/* Message si aucun résultat */}
  {filteredPaletteRoles.length === 0 && searchTerm && (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-bolt-elements-bg-depth-3 rounded-full flex items-center justify-center">
        <span className="i-ph:magnifying-glass text-2xl text-bolt-elements-textTertiary" />
      </div>
      <h4 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Aucune couleur trouvée</h4>
      <p className="text-sm text-bolt-elements-textSecondary mb-4">
        Aucune couleur ne correspond à "{searchTerm}"
      </p>
      <button
        onClick={() => setSearchTerm('')}
        className="text-sm text-bolt-elements-item-contentAccent hover:text-bolt-elements-item-contentAccent/80 font-medium transition-colors"
      >
        Effacer la recherche
      </button>
    </div>
  )}
</div>
  );

  const renderTypographySection = () => (
    <div className="space-y-6">
      {/* Header avec titre et statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg"></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-purple-500 animate-ping opacity-30"></div>
          </div>
          <h3 className="text-xl font-bold text-bolt-elements-textPrimary bg-gradient-to-r from-bolt-elements-textPrimary to-purple-500 bg-clip-text">
            Typographie
          </h3>
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-purple-400 font-medium">
              {font.length} sélectionnée{font.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {font.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
            <span className="i-ph:check-circle text-sm text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              {font.length} police{font.length > 1 ? 's' : ''} active{font.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
  
      {/* Aperçu des polices sélectionnées */}
      {font.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-bolt-elements-bg-depth-3 to-bolt-elements-bg-depth-2 rounded-2xl border border-bolt-elements-borderColor/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="i-ph:eye text-sm text-bolt-elements-textSecondary" />
            <span className="text-sm font-medium text-bolt-elements-textPrimary">Aperçu des polices sélectionnées</span>
          </div>
          <div className="space-y-2">
            {font.map((fontKey) => {
              const fontData = designFonts.find(f => f.key === fontKey);
              return fontData ? (
                <div key={fontKey} className="flex items-center gap-3 p-2 bg-bolt-elements-bg-depth-1 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span 
                    className="text-lg text-bolt-elements-textPrimary font-medium"
                    style={{ fontFamily: fontData.key }}
                  >
                    {fontData.preview}
                  </span>
                  <span className="text-sm text-bolt-elements-textSecondary">
                    ({fontData.label})
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
  
      {/* Grille de polices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {designFonts.map((f, index) => {
          const isSelected = font.includes(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => handleFontToggle(f.key)}
              className={`group relative overflow-hidden p-5 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transform hover:scale-[1.02] ${
                isSelected
                  ? 'bg-bolt-elements-button-primary-background border-purple-500/50 shadow-xl shadow-purple-500/20'
                  : 'bg-bolt-elements-button-primary-background to-bolt-elements-bg-depth-2 border-bolt-elements-borderColor/30 hover:border-purple-500/40 hover:from-bolt-elements-bg-depth-2 hover:to-bolt-elements-bg-depth-1 shadow-lg hover:shadow-xl'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="i-ph:check text-white text-xs drop-shadow-sm" />
                </div>
              )}
  
              <div className="relative text-center space-y-3">
                {/* Aperçu de la police */}
                <div
                  className={`text-3xl font-medium transition-all duration-300 leading-tight ${
                    isSelected 
                      ? 'text-purple-400 drop-shadow-sm' 
                      : 'text-bolt-elements-textPrimary group-hover:text-purple-400'
                  }`}
                  style={{ fontFamily: f.key }}
                >
                  {f.preview}
                </div>
                
                {/* Nom de la police */}
                <div
                  className={`text-sm font-semibold transition-all duration-300 ${
                    isSelected 
                      ? 'text-purple-400' 
                      : 'text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary'
                  }`}
                >
                  {f.label}
                </div>
  
                {/* Exemple de texte */}
                <div
                  className={`text-xs transition-all duration-300 leading-relaxed ${
                    isSelected 
                      ? 'text-purple-300/80' 
                      : 'text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary'
                  }`}
                  style={{ fontFamily: f.key }}
                >
                  The quick brown fox jumps
                </div>
  
                {/* Badge de catégorie (si disponible) */}
                {(f as any).category && (
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    isSelected
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
                      : 'bg-bolt-elements-bg-depth-1 text-bolt-elements-textTertiary border border-bolt-elements-borderColor/30 group-hover:border-purple-500/30 group-hover:text-purple-400'
                  }`}>
                    {f.label}
                  </div>
                )}
              </div>
  
              {/* Barre de progression en bas */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500 ${
                isSelected
                  ? 'from-purple-500 via-purple-400 to-indigo-500'
                  : 'from-transparent via-bolt-elements-borderColor/20 to-transparent group-hover:from-purple-500/40 group-hover:via-purple-400/60 group-hover:to-indigo-500/40'
              }`} />
            </button>
          );
        })}
      </div>
  
      {/* Message si aucune police sélectionnée */}
      {font.length === 0 && (
        <div className="text-center py-8 px-4 bg-gradient-to-br from-bolt-elements-bg-depth-3/50 to-bolt-elements-bg-depth-2/50 rounded-2xl border border-dashed border-bolt-elements-borderColor/50">
          <div className="w-16 h-16 mx-auto mb-4 bg-bolt-elements-bg-depth-3 rounded-full flex items-center justify-center">
            <span className="i-ph:text-aa text-2xl text-bolt-elements-textTertiary" />
          </div>
          <h4 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Aucune police sélectionnée</h4>
          <p className="text-sm text-bolt-elements-textSecondary">
            Choisissez une ou plusieurs polices pour personnaliser votre thème
          </p>
        </div>
      )}
  
      {/* Conseils typography */}
      <div className="p-4 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
            <span className="i-ph:lightbulb text-lg text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-bolt-elements-textPrimary mb-1">Conseils typographiques</h4>
            <ul className="text-xs text-bolt-elements-textSecondary space-y-1 leading-relaxed">
              <li>• Combinez une police serif pour les titres et une sans-serif pour le corps</li>
              <li>• Limitez-vous à 2-3 polices maximum pour maintenir la cohérence</li>
              <li>• Testez la lisibilité sur différentes tailles d'écran</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="space-y-6">
      {/* Header avec titre et statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg"></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-indigo-500 animate-ping opacity-30"></div>
          </div>
          <h3 className="text-xl font-bold text-bolt-elements-textPrimary bg-gradient-to-r from-bolt-elements-textPrimary to-indigo-500 bg-clip-text">
            Design Features
          </h3>
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-indigo-400 font-medium">
              {features.length} sélectionnée{features.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {features.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
            <span className="i-ph:check-circle text-sm text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              {features.length} feature{features.length > 1 ? 's' : ''} active{features.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Aperçu des features sélectionnées */}
      {features.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-bolt-elements-bg-depth-3 to-bolt-elements-bg-depth-2 rounded-2xl border border-bolt-elements-borderColor/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="i-ph:eye text-sm text-bolt-elements-textSecondary" />
            <span className="text-sm font-medium text-bolt-elements-textPrimary">Aperçu des features sélectionnées</span>
          </div>
          <div className="space-y-2">
            {features.map((featureKey) => {
              const featureData = designFeatures.find(f => f.key === featureKey);
              return featureData ? (
                <div key={featureKey} className="flex items-center gap-3 p-2 bg-bolt-elements-bg-depth-1 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <span className="text-sm text-bolt-elements-textPrimary font-medium">
                    {featureData.label}
                  </span>
                  <span className="text-xs text-bolt-elements-textSecondary">
                    (Activée)
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Grille de features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {designFeatures.map((f, index) => {
          const isSelected = features.includes(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => handleFeatureToggle(f.key)}
              className={`group relative overflow-hidden p-5 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transform hover:scale-[1.02] ${
                isSelected
                  ? 'bg-bolt-elements-button-primary-background border-indigo-500/50 shadow-xl shadow-indigo-500/20'
                  : 'bg-bolt-elements-button-primary-background to-bolt-elements-bg-depth-2 border-bolt-elements-borderColor/30 hover:border-indigo-500/40 hover:from-bolt-elements-bg-depth-2 hover:to-bolt-elements-bg-depth-1 shadow-lg hover:shadow-xl'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                ...(f.key === 'gradient' && {
                  background: isSelected
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : undefined,
                }),
              }}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="i-ph:check text-white text-xs drop-shadow-sm" />
                </div>
              )}

              <div className="relative text-center space-y-3">
                {/* Icône de la feature */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-bolt-elements-bg-depth-1/50 backdrop-blur-sm">
                  {f.key === 'rounded' && (
                    <div
                      className={`w-8 h-8 bg-current transition-all duration-300 ${
                        isSelected ? 'rounded-full' : 'rounded-lg'
                      } opacity-80`}
                      style={{ color: isSelected ? '#6366f1' : 'currentColor' }}
                    />
                  )}
                  {f.key === 'border' && (
                    <div
                      className={`w-8 h-8 rounded-lg transition-all duration-300 ${
                        isSelected ? 'border-4 border-indigo-500 opacity-90' : 'border-3 border-current opacity-70'
                      }`}
                    />
                  )}
                  {f.key === 'gradient' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 opacity-90" />
                  )}
                  {f.key === 'shadow' && (
                    <div className="relative">
                      <div
                        className={`w-8 h-8 bg-current rounded-lg transition-all duration-300 ${
                          isSelected ? 'opacity-90 shadow-lg' : 'opacity-70'
                        }`}
                        style={{ color: isSelected ? '#6366f1' : 'currentColor' }}
                      />
                      <div
                        className={`absolute top-1 left-1 w-8 h-8 bg-current rounded-lg transition-all duration-300 ${
                          isSelected ? 'opacity-40' : 'opacity-30'
                        }`}
                        style={{ color: isSelected ? '#6366f1' : 'currentColor' }}
                      />
                    </div>
                  )}
                  {f.key === 'frosted-glass' && (
                    <div className="relative">
                      <div
                        className={`w-8 h-8 rounded-lg transition-all duration-300 backdrop-blur-sm bg-white/20 border border-white/30 ${
                          isSelected ? 'opacity-90' : 'opacity-70'
                        }`}
                      />
                      <div
                        className={`absolute inset-0 w-8 h-8 rounded-lg transition-all duration-300 backdrop-blur-md bg-gradient-to-br from-white/10 to-transparent ${
                          isSelected ? 'opacity-60' : 'opacity-40'
                        }`}
                      />
                    </div>
                  )}
                </div>
                
                {/* Nom de la feature */}
                <div
                  className={`text-sm font-semibold transition-all duration-300 ${
                    isSelected 
                      ? 'text-indigo-400' 
                      : 'text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary'
                  }`}
                >
                  {f.label}
                </div>

                {/* Description courte (si disponible) */}
                {(f as any).description && (
                  <div
                    className={`text-xs transition-all duration-300 leading-relaxed px-2 ${
                      isSelected 
                        ? 'text-indigo-300/80' 
                        : 'text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary'
                    }`}
                  >
                    {(f as any).description}
                  </div>
                )}

                {/* Barre de progression en bas */}
                <div className="w-full bg-bolt-elements-bg-depth-1 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      isSelected 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 w-full' 
                        : 'bg-bolt-elements-borderColor w-0 group-hover:w-1/3'
                    }`}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Message d'état vide */}
      {designFeatures.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto bg-bolt-elements-bg-depth-2 rounded-2xl flex items-center justify-center">
            <span className="i-ph:palette text-2xl text-bolt-elements-textTertiary" />
          </div>
          <div className="space-y-2">
            <p className="text-bolt-elements-textSecondary font-medium">Aucune feature disponible</p>
            <p className="text-sm text-bolt-elements-textTertiary max-w-md mx-auto">
              Les features de design seront bientôt disponibles pour personnaliser l'apparence de votre interface.
            </p>
          </div>
        </div>
      )}

      {/* Conseils sur les features */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="i-ph:lightbulb text-blue-400 text-lg mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-400">Conseils pour les features</h4>
            <ul className="text-xs text-bolt-elements-textSecondary space-y-1 leading-relaxed">
              <li>• Combinez plusieurs features pour créer des designs uniques</li>
              <li>• Les features de bordure et d'ombre se complètent bien</li>
              <li>• Le verre dépoli fonctionne mieux avec des arrière-plans colorés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { key: 'presets', label: 'Préréglages', icon: 'i-ph:swatches' },
    { key: 'custom', label: 'Mes Groupes', icon: 'i-ph:heart' },
    { key: 'colors', label: 'Couleurs', icon: 'i-ph:palette' },
    { key: 'typography', label: 'Typographie', icon: 'i-ph:text-aa' },
    { key: 'features', label: 'Fonctionnalités', icon: 'i-ph:magic-wand' },
  ];

  return (
    <div>
      <IconButton title="Design Palette" className="transition-all" onClick={() => setIsDialogOpen(!isDialogOpen)}>
        <div className="i-ph:palette text-xl"></div>
      </IconButton>

      <ColorSchemeModalRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ColorSchemeModal onClose={() => setIsDialogOpen(false)}>
          <ColorSchemeModalHeader
            title="Palette de Conception & Fonctionnalités"
            description="Personnalisez votre palette de couleurs, typographie et fonctionnalités de conception. Ces préférences guideront l'IA dans la création de designs qui correspondent à votre style."
          />
          
          <ColorSchemeModalTabs
            activeTab={activeSection}
            onTabChange={(tab) => setActiveSection(tab as any)}
            tabs={tabs}
          />
          
          <ColorSchemeModalContent>
            {activeSection === 'presets' && renderPresetsSection()}
            {activeSection === 'custom' && renderCustomGroupsSection()}
            {activeSection === 'colors' && renderColorSection()}
            {activeSection === 'typography' && renderTypographySection()}
            {activeSection === 'features' && renderFeaturesSection()}
          </ColorSchemeModalContent>
          
          <ColorSchemeModalFooter
            stats={{
              colors: Object.keys(palette).length,
              fonts: font.length,
              features: features.length
            }}
            onSaveAsCustom={handleSaveCurrentAsCustomGroup}
            onExport={handleExportScheme}
            onImport={handleImportScheme}
            onCancel={() => setIsDialogOpen(false)}
            onSave={handleSave}
          />
        </ColorSchemeModal>
      </ColorSchemeModalRoot>

      <ColorSchemeModalStyles />
      
      {/* Modal de création/édition de groupe compact */}
      {showCreateGroupDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-xl border border-bolt-elements-borderColor w-[90vw] max-w-md p-4">
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-3">
              {editingGroup ? 'Modifier le Groupe' : 'Créer un Nouveau Groupe'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Nom du groupe
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => {
                    setNewGroupName(e.target.value);
                    setGroupNameError('');
                  }}
                  className="w-full px-3 py-2 text-sm bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive"
                  placeholder="Mon groupe de couleurs"
                />
                {groupNameError && (
                  <p className="text-red-500 text-xs mt-1">{groupNameError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive resize-none"
                  placeholder="Description de ce groupe de couleurs..."
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCreateGroupDialog(false);
                  setEditingGroup(null);
                  setNewGroupName('');
                  setNewGroupDescription('');
                  setGroupNameError('');
                }}
                className="px-3 py-1.5 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (editingGroup) {
                    handleUpdateCustomGroup({
                      ...editingGroup,
                      name: newGroupName,
                      description: newGroupDescription,
                      scheme: { palette, features, font }
                    });
                  } else {
                    handleCreateCustomGroup();
                  }
                }}
                className="bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text px-3 py-1.5 text-sm rounded-md transition-colors"
              >
                {editingGroup ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};