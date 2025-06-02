import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogRoot } from './Dialog';
import { Button } from './Button';
import { IconButton } from './IconButton';
import type { DesignScheme } from '~/types/design-scheme';
import { defaultDesignScheme, designFeatures, designFonts, paletteRoles } from '~/types/design-scheme';

export interface ColorSchemeDialogProps {
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
}

// Préréglages de couleurs populaires
const colorPresets = [
  {
    name: 'Dark Modern',
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
    }
  },
  {
    name: 'Light Clean',
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
    }
  },
  {
    name: 'Ocean Blue',
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
    }
  },
  {
    name: 'Warm Sunset',
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
    }
  },
  {
    name: 'Forest Green',
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
    }
  }
];

// Utilitaires pour la validation des couleurs
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

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
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'features' | 'presets'>('colors');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

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
    setPalette(preset.palette);
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

  const generateRandomPalette = useCallback(() => {
    const generateRandomColor = () => {
      return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    };

    const newPalette = { ...palette };
    Object.keys(newPalette).forEach(key => {
      newPalette[key] = generateRandomColor();
    });
    setPalette(newPalette);
  }, [palette]);

  // Filtrage des rôles de couleur basé sur la recherche
  const filteredPaletteRoles = useMemo(() => {
    if (!searchTerm) return paletteRoles;
    return paletteRoles.filter(role => 
      role.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Validation des contrastes
  const contrastWarnings = useMemo(() => {
    const warnings: string[] = [];
    const textContrast = getContrastRatio(palette.text, palette.background);
    const primaryContrast = getContrastRatio(palette.primary, palette.background);
    
    if (textContrast < 4.5) {
      warnings.push('Le contraste du texte principal est insuffisant (< 4.5:1)');
    }
    if (primaryContrast < 3) {
      warnings.push('Le contraste de la couleur primaire est insuffisant (< 3:1)');
    }
    
    return warnings;
  }, [palette]);

  const renderPresetsSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Préréglages de Couleurs
        </h3>
        <div className="flex gap-2">
          <button
            onClick={generateRandomPalette}
            className="text-sm bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg flex items-center gap-2 px-3 py-2 transition-all duration-200"
          >
            <span className="i-ph:shuffle text-sm" />
            Aléatoire
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {colorPresets.map((preset, index) => (
          <div
            key={index}
            className="group p-4 rounded-xl bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border border-transparent hover:border-bolt-elements-borderColor transition-all duration-200 cursor-pointer"
            onClick={() => handlePresetSelect(preset)}
          >
            <div className="flex items-center gap-3 mb-3">
              <h4 className="font-semibold text-bolt-elements-textPrimary">{preset.name}</h4>
            </div>
            <div className="flex gap-1 mb-2">
              {Object.entries(preset.palette).slice(0, 6).map(([key, color]) => (
                <div
                  key={key}
                  className="w-6 h-6 rounded-md shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`${key}: ${color}`}
                />
              ))}
            </div>
            <div className="text-xs text-bolt-elements-textSecondary">
              {Object.keys(preset.palette).length} couleurs
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderColorSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-bolt-elements-item-contentAccent"></div>
          Palette de Couleurs
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg flex items-center gap-2 px-3 py-2 transition-all duration-200"
          >
            <span className={`i-ph:${showAdvanced ? 'eye-slash' : 'eye'} text-sm`} />
            {showAdvanced ? 'Simple' : 'Avancé'}
          </button>
          <button
            onClick={handleReset}
            className="text-sm bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg flex items-center gap-2 px-3 py-2 transition-all duration-200"
          >
            <span className="i-ph:arrow-clockwise text-sm" />
            Reset
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une couleur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary placeholder-bolt-elements-textSecondary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 i-ph:magnifying-glass text-bolt-elements-textSecondary" />
      </div>

      {/* Avertissements de contraste */}
      {showAdvanced && contrastWarnings.length > 0 && (
        <div className="p-3 bg-bolt-elements-bg-depth-3 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="i-ph:warning text-yellow-500" />
            <span className="text-sm font-medium text-bolt-elements-textPrimary">Avertissements de Contraste</span>
          </div>
          {contrastWarnings.map((warning, index) => (
            <div key={index} className="text-xs text-bolt-elements-textSecondary">
              • {warning}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {filteredPaletteRoles.map((role) => {
          const contrastRatio = role.key === 'text' ? getContrastRatio(palette[role.key], palette.background) : null;
          const hasGoodContrast = contrastRatio ? contrastRatio >= 4.5 : true;
          
          return (
            <div
              key={role.key}
              className="group flex items-center gap-4 p-4 rounded-xl bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 border border-transparent hover:border-bolt-elements-borderColor transition-all duration-200"
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:scale-110 ring-2 ring-transparent hover:ring-bolt-elements-borderColorActive"
                  style={{ backgroundColor: palette[role.key] }}
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
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-bolt-elements-bg-depth-1 rounded-full flex items-center justify-center shadow-sm">
                  <span className="i-ph:pencil-simple text-xs text-bolt-elements-textSecondary" />
                </div>
                {showAdvanced && contrastRatio && (
                  <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    hasGoodContrast ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    <span className={`i-ph:${hasGoodContrast ? 'check' : 'x'} text-white text-xs`} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-bolt-elements-textPrimary transition-colors">{role.label}</div>
                <div className="text-sm text-bolt-elements-textSecondary line-clamp-2 leading-relaxed">
                  {role.description}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs text-bolt-elements-textTertiary font-mono px-2 py-1 bg-bolt-elements-bg-depth-1 rounded-md inline-block">
                    {palette[role.key]}
                  </div>
                  {showAdvanced && contrastRatio && (
                    <div className="text-xs text-bolt-elements-textTertiary">
                      Contraste: {contrastRatio.toFixed(1)}:1
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTypographySection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-bolt-elements-item-contentAccent"></div>
        Typography
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {designFonts.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFontToggle(f.key)}
            className={`group p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive ${
              font.includes(f.key)
                ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-lg'
                : 'bg-bolt-elements-background-depth-3 border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-bg-depth-2'
            }`}
          >
            <div className="text-center space-y-2">
              <div
                className={`text-2xl font-medium transition-colors ${
                  font.includes(f.key) ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
                }`}
                style={{ fontFamily: f.key }}
              >
                {f.preview}
              </div>
              <div
                className={`text-sm font-medium transition-colors ${
                  font.includes(f.key) ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'
                }`}
              >
                {f.label}
              </div>
              {font.includes(f.key) && (
                <div className="w-6 h-6 mx-auto bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center">
                  <span className="i-ph:check text-white text-sm" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-bolt-elements-item-contentAccent"></div>
        Design Features
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {designFeatures.map((f) => {
          const isSelected = features.includes(f.key);

          return (
            <div key={f.key} className="feature-card-container p-2">
              <button
                type="button"
                onClick={() => handleFeatureToggle(f.key)}
                className={`group relative w-full p-6 text-sm font-medium transition-all duration-200 bg-bolt-elements-background-depth-3 text-bolt-elements-item-textSecondary ${
                  f.key === 'rounded'
                    ? isSelected
                      ? 'rounded-3xl'
                      : 'rounded-xl'
                    : f.key === 'border'
                      ? 'rounded-lg'
                      : 'rounded-xl'
                } ${
                  f.key === 'border'
                    ? isSelected
                      ? 'border-3 border-bolt-elements-borderColorActive bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent'
                      : 'border-2 border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive text-bolt-elements-textSecondary'
                    : f.key === 'gradient'
                      ? ''
                      : isSelected
                        ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent shadow-lg'
                        : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                } ${f.key === 'shadow' ? (isSelected ? 'shadow-xl' : 'shadow-lg') : 'shadow-md'}`}
                style={{
                  ...(f.key === 'gradient' && {
                    background: isSelected
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'var(--bolt-elements-bg-depth-3)',
                    color: isSelected ? 'white' : 'var(--bolt-elements-textSecondary)',
                  }),
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-bolt-elements-bg-depth-1 bg-opacity-20">
                    {f.key === 'rounded' && (
                      <div
                        className={`w-6 h-6 bg-current transition-all duration-200 ${
                          isSelected ? 'rounded-full' : 'rounded'
                        } opacity-80`}
                      />
                    )}
                    {f.key === 'border' && (
                      <div
                        className={`w-6 h-6 rounded-lg transition-all duration-200 ${
                          isSelected ? 'border-3 border-current opacity-90' : 'border-2 border-current opacity-70'
                        }`}
                      />
                    )}
                    {f.key === 'gradient' && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 opacity-90" />
                    )}
                    {f.key === 'shadow' && (
                      <div className="relative">
                        <div
                          className={`w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
                            isSelected ? 'opacity-90' : 'opacity-70'
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
                            isSelected ? 'opacity-40' : 'opacity-30'
                          }`}
                        />
                      </div>
                    )}
                    {f.key === 'frosted-glass' && (
                      <div className="relative">
                        <div
                          className={`w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-sm bg-white/20 border border-white/30 ${
                            isSelected ? 'opacity-90' : 'opacity-70'
                          }`}
                        />
                        <div
                          className={`absolute inset-0 w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-md bg-gradient-to-br from-white/10 to-transparent ${
                            isSelected ? 'opacity-60' : 'opacity-40'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="font-semibold">{f.label}</div>
                    {isSelected && <div className="mt-2 w-8 h-1 bg-current rounded-full mx-auto opacity-60" />}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <IconButton title="Design Palette" className="transition-all" onClick={() => setIsDialogOpen(!isDialogOpen)}>
        <div className="i-ph:palette text-xl"></div>
      </IconButton>

      <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog>
          <div className="py-4 px-4 min-w-[720px] max-w-[98vw] max-h-[95vh] flex flex-col gap-6 overflow-hidden">
            <div className="">
              <DialogTitle className="text-2xl font-bold text-bolt-elements-textPrimary">
                Palette de Conception & Fonctionnalités
              </DialogTitle>
              <DialogDescription className="text-bolt-elements-textSecondary leading-relaxed">
                Personnalisez votre palette de couleurs, typographie et fonctionnalités de conception. Ces préférences guideront l'IA dans la création de designs qui correspondent à votre style.
              </DialogDescription>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-bolt-elements-bg-depth-3 rounded-xl">
              {[
                { key: 'presets', label: 'Préréglages', icon: 'i-ph:swatches' },
                { key: 'colors', label: 'Couleurs', icon: 'i-ph:palette' },
                { key: 'typography', label: 'Typographie', icon: 'i-ph:text-aa' },
                { key: 'features', label: 'Fonctionnalités', icon: 'i-ph:magic-wand' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeSection === tab.key
                      ? 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary shadow-md'
                      : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-2'
                  }`}
                >
                  <span className={`${tab.icon} text-lg`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="min-h-92 overflow-y-auto">
              {activeSection === 'presets' && renderPresetsSection()}
              {activeSection === 'colors' && renderColorSection()}
              {activeSection === 'typography' && renderTypographySection()}
              {activeSection === 'features' && renderFeaturesSection()}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm text-bolt-elements-textSecondary">
                  {Object.keys(palette).length} couleurs • {font.length} polices • {features.length} fonctionnalités
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportScheme}
                    className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg flex items-center gap-1 px-2 py-1 transition-all duration-200"
                    title="Exporter le schéma"
                  >
                    <span className="i-ph:download-simple text-xs" />
                    Exporter
                  </button>
                  <label className="text-xs bg-transparent hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg flex items-center gap-1 px-2 py-1 transition-all duration-200 cursor-pointer">
                    <span className="i-ph:upload-simple text-xs" />
                    Importer
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportScheme}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSave}
                  className="bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </DialogRoot>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--bolt-elements-textTertiary) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--bolt-elements-textTertiary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--bolt-elements-textSecondary);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .feature-card-container {
          min-height: 140px;
          display: flex;
          align-items: stretch;
        }
        .feature-card-container button {
          flex: 1;
        }
      `}</style>
    </div>
  );
};