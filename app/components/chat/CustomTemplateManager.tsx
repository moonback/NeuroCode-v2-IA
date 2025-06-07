import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui/IconButton';

// Types pour les templates personnalisés
export interface CustomTemplate {
  id: string;
  title: string;
  description: string;
  category: 'ecommerce' | 'saas' | 'mobile' | 'landing' | 'dashboard' | 'custom';
  icon: string;
  prompt: string;
  gradient: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export interface CustomTemplateManagerProps {
  templates: CustomTemplate[];
  onTemplateCreate: (template: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTemplateUpdate: (id: string, template: Partial<CustomTemplate>) => void;
  onTemplateDelete: (id: string) => void;
  onTemplateSelect: (template: CustomTemplate) => void;
  selectedTemplateId?: string;
}

// Templates prédéfinis par catégorie
const TEMPLATE_CATEGORIES = {
  ecommerce: {
    label: 'E-commerce',
    icon: 'i-ph:shopping-cart',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  saas: {
    label: 'SaaS',
    icon: 'i-ph:cloud',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
  mobile: {
    label: 'Mobile',
    icon: 'i-ph:device-mobile',
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600'
  },
  landing: {
    label: 'Landing Page',
    icon: 'i-ph:rocket-launch',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600'
  },
  dashboard: {
    label: 'Dashboard',
    icon: 'i-ph:chart-line',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  custom: {
    label: 'Personnalisé',
    icon: 'i-ph:gear',
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-gray-600'
  }
};

// Templates prédéfinis
const DEFAULT_TEMPLATES: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Audit E-commerce',
    description: 'Analyse spécialisée pour les interfaces de vente en ligne',
    category: 'ecommerce',
    icon: 'i-ph:shopping-cart',
    gradient: 'from-blue-500 to-blue-600',
    color: 'text-blue-600',
    isDefault: true,
    prompt: `En tant qu'expert UX/UI spécialisé en e-commerce, analysez cette interface de vente en ligne.

**Audit E-commerce Spécialisé**

**1. Tunnel de Conversion**
- **Parcours d'achat:** Fluidité du processus de commande
- **Points de friction:** Obstacles à la conversion
- **Abandon de panier:** Facteurs de réduction
- **Call-to-actions:** Efficacité des boutons d'achat
- **Urgence/Rareté:** Techniques de persuasion

**2. Confiance & Réassurance**
- **Éléments de confiance:** Avis, certifications, garanties
- **Sécurité:** Indicateurs de paiement sécurisé
- **Politique de retour:** Visibilité et clarté
- **Service client:** Accessibilité du support
- **Preuves sociales:** Témoignages, nombre d'acheteurs

**3. Expérience Produit**
- **Fiche produit:** Qualité des images, descriptions
- **Variantes:** Gestion des tailles, couleurs, options
- **Stock:** Indication de disponibilité
- **Recommandations:** Produits similaires/complémentaires
- **Comparaison:** Outils de comparaison produits

**4. Navigation & Recherche**
- **Catégorisation:** Organisation des produits
- **Filtres:** Pertinence et facilité d'usage
- **Recherche:** Efficacité du moteur de recherche
- **Breadcrumbs:** Navigation contextuelle
- **Menu:** Structure et accessibilité

**5. Mobile Commerce**
- **Responsive:** Adaptation mobile
- **Touch targets:** Taille des éléments tactiles
- **Paiement mobile:** Optimisation checkout mobile
- **Performance:** Vitesse de chargement

**Recommandations prioritaires avec impact business estimé.**`
  },
  {
    title: 'Audit SaaS',
    description: 'Analyse dédiée aux applications SaaS et outils B2B',
    category: 'saas',
    icon: 'i-ph:cloud',
    gradient: 'from-purple-500 to-purple-600',
    color: 'text-purple-600',
    isDefault: true,
    prompt: `En tant qu'expert UX/UI spécialisé en SaaS B2B, analysez cette interface applicative.

**Audit SaaS Spécialisé**

**1. Onboarding & Adoption**
- **First-time experience:** Parcours de découverte
- **Progressive disclosure:** Révélation graduelle des fonctionnalités
- **Empty states:** Gestion des états vides
- **Tooltips & guides:** Aide contextuelle
- **Time-to-value:** Rapidité d'obtention de valeur

**2. Productivité & Efficacité**
- **Workflows:** Optimisation des tâches récurrentes
- **Raccourcis clavier:** Accélérateurs pour power users
- **Bulk actions:** Actions en masse
- **Automation:** Possibilités d'automatisation
- **Customization:** Personnalisation de l'interface

**3. Data & Analytics**
- **Dashboards:** Clarté des tableaux de bord
- **Data visualization:** Efficacité des graphiques
- **Filtering & sorting:** Manipulation des données
- **Export:** Capacités d'export
- **Real-time updates:** Actualisation en temps réel

**4. Collaboration & Partage**
- **Multi-user:** Gestion des utilisateurs multiples
- **Permissions:** Système de droits
- **Comments & feedback:** Outils collaboratifs
- **Notifications:** Système d'alertes
- **Sharing:** Fonctionnalités de partage

**5. Scalabilité & Performance**
- **Large datasets:** Gestion de gros volumes
- **Loading states:** États de chargement
- **Error handling:** Gestion d'erreurs robuste
- **Offline capabilities:** Fonctionnement hors ligne
- **Performance:** Réactivité de l'interface

**Recommandations avec focus sur l'adoption utilisateur et la rétention.**`
  },
  {
    title: 'Audit Mobile',
    description: 'Analyse spécialisée pour les interfaces mobiles natives et web',
    category: 'mobile',
    icon: 'i-ph:device-mobile',
    gradient: 'from-green-500 to-green-600',
    color: 'text-green-600',
    isDefault: true,
    prompt: `En tant qu'expert UX/UI spécialisé en design mobile, analysez cette interface mobile.

**Audit Mobile Spécialisé**

**1. Touch & Gestures**
- **Touch targets:** Taille minimale 44px (iOS) / 48dp (Android)
- **Gestures:** Swipe, pinch, long press appropriés
- **Thumb zones:** Accessibilité en usage une main
- **Edge cases:** Gestion des bordures d'écran
- **Haptic feedback:** Retour tactile

**2. Navigation Mobile**
- **Bottom navigation:** Accessibilité des onglets
- **Tab bar:** Organisation et priorités
- **Hamburger menu:** Pertinence et contenu
- **Back navigation:** Cohérence système
- **Deep linking:** Navigation contextuelle

**3. Content & Layout**
- **Responsive breakpoints:** Adaptation multi-écrans
- **Content hierarchy:** Priorisation mobile-first
- **Readability:** Taille de police, contraste
- **Scrolling:** Performance et fluidité
- **Landscape mode:** Adaptation paysage

**4. Performance Mobile**
- **Loading speed:** Temps de chargement
- **Image optimization:** Compression et formats
- **Offline experience:** Fonctionnement hors ligne
- **Battery impact:** Optimisation énergétique
- **Network awareness:** Adaptation connexion

**5. Platform Guidelines**
- **iOS HIG:** Respect des guidelines Apple
- **Material Design:** Conformité Android
- **Native patterns:** Utilisation des patterns natifs
- **System integration:** Intégration OS
- **Accessibility:** Support des technologies d'assistance

**6. Context of Use**
- **One-handed use:** Utilisation à une main
- **Interruptions:** Gestion des interruptions
- **Multitasking:** Comportement en arrière-plan
- **Environmental factors:** Usage en mobilité

**Recommandations avec focus sur l'expérience mobile native.**`
  }
];

// Composant pour afficher un template
const TemplateCard = memo(({ 
  template, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: { 
  template: CustomTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const category = TEMPLATE_CATEGORIES[template.category];
  
  return (
    <motion.div
      className={classNames(
        'relative p-4 rounded-lg border text-left transition-all overflow-hidden group cursor-pointer',
        isSelected
          ? 'border-bolt-elements-item-contentAccent bg-bolt-elements-item-backgroundAccent shadow-lg'
          : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:border-bolt-elements-item-contentAccent hover:bg-bolt-elements-background-depth-3'
      )}
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Actions du template */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {!template.isDefault && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2"
              title="Modifier"
            >
              <div className="i-ph:pencil text-xs" />
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-red-500 hover:bg-red-600 text-white"
              title="Supprimer"
            >
              <div className="i-ph:trash text-xs" />
            </IconButton>
          </>
        )}
      </div>

      <div className="flex items-start gap-3">
        <motion.div 
          className={classNames(
            template.icon,
            'text-xl transition-all duration-300',
            isSelected 
              ? 'text-bolt-elements-item-contentAccent scale-110' 
              : `${category.color} group-hover:text-bolt-elements-item-contentAccent`
          )}
          whileHover={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.4 }}
        />
        
        <div className="flex-1 space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <h4 className={classNames(
              'text-base font-semibold transition-colors duration-300',
              isSelected
                ? 'text-bolt-elements-item-contentAccent'
                : 'text-bolt-elements-textPrimary'
            )}>
              {template.title}
            </h4>
            <span className={classNames(
              'px-2 py-0.5 text-xs rounded-full',
              `bg-${category.color.split('-')[1]}-100 ${category.color}`
            )}>
              {category.label}
            </span>
            {template.isDefault && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent">
                Défaut
              </span>
            )}
          </div>
          <p className={classNames(
            'text-sm leading-relaxed transition-colors duration-300',
            isSelected
              ? 'text-bolt-elements-textSecondary'
              : 'text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary'
          )}>
            {template.description}
          </p>
          <p className="text-xs text-bolt-elements-textTertiary">
            Modifié le {template.updatedAt.toLocaleDateString()}
          </p>
        </div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1 : 0,
            opacity: isSelected ? 1 : 0
          }}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-bolt-elements-item-contentAccent"
        >
          <div className="i-ph:check text-white text-sm" />
        </motion.div>
      </div>
    </motion.div>
  );
});

// Composant pour créer/éditer un template
const TemplateEditor = memo(({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template?: CustomTemplate;
  onSave: (template: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    category: template?.category || 'custom' as const,
    icon: template?.icon || 'i-ph:gear',
    prompt: template?.prompt || ''
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.prompt.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const category = TEMPLATE_CATEGORIES[formData.category];
    
    onSave({
      ...formData,
      gradient: category.gradient,
      color: category.color
    });
  }, [formData, onSave]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bolt-elements-background-depth-1 rounded-lg p-6 border border-bolt-elements-borderColor"
    >
      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">
        {template ? 'Modifier le template' : 'Créer un nouveau template'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none"
              placeholder="Nom du template"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none"
            >
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>{category.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
            Description *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none"
            placeholder="Description courte du template"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
            Icône
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none"
            placeholder="i-ph:gear"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
            Prompt d'analyse *
          </label>
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none resize-y"
            placeholder="Décrivez le prompt d'analyse détaillé..."
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <motion.button
            type="submit"
            className="px-4 py-2 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded-md hover:bg-bolt-elements-item-backgroundAccent/80 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {template ? 'Mettre à jour' : 'Créer le template'}
          </motion.button>
          <motion.button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded-md hover:bg-bolt-elements-background-depth-2 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Annuler
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
});

// Composant principal
export const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = memo(({
  templates,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateSelect,
  selectedTemplateId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage des templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(undefined);
    setIsEditing(true);
  }, []);

  const handleEditTemplate = useCallback((template: CustomTemplate) => {
    setEditingTemplate(template);
    setIsEditing(true);
  }, []);

  const handleSaveTemplate = useCallback((templateData: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTemplate) {
      onTemplateUpdate(editingTemplate.id, templateData);
      toast.success('Template mis à jour avec succès!');
    } else {
      onTemplateCreate(templateData);
      toast.success('Template créé avec succès!');
    }
    setIsEditing(false);
    setEditingTemplate(undefined);
  }, [editingTemplate, onTemplateCreate, onTemplateUpdate]);

  const handleDeleteTemplate = useCallback((template: CustomTemplate) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.title}" ?`)) {
      onTemplateDelete(template.id);
      toast.success('Template supprimé avec succès!');
    }
  }, [onTemplateDelete]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingTemplate(undefined);
  }, []);

  if (isEditing) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
            Templates d'analyse personnalisés
          </h2>
          <p className="text-bolt-elements-textSecondary text-sm mt-1">
            Créez des prompts d'analyse sur mesure pour vos besoins spécifiques
          </p>
        </div>
        <motion.button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent rounded-lg hover:bg-bolt-elements-item-backgroundAccent/80 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="i-ph:plus" />
          Nouveau template
        </motion.button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un template..."
            className="w-full px-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:border-bolt-elements-borderColorActive focus:outline-none"
        >
          <option value="all">Toutes les catégories</option>
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
            <option key={key} value={key}>{category.label}</option>
          ))}
        </select>
      </div>

      {/* Liste des templates */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onTemplateSelect(template)}
              onEdit={() => handleEditTemplate(template)}
              onDelete={() => handleDeleteTemplate(template)}
            />
          ))}
        </AnimatePresence>
        
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-bolt-elements-textSecondary"
          >
            <div className="i-ph:magnifying-glass text-4xl mb-4" />
            <p>Aucun template trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

CustomTemplateManager.displayName = 'CustomTemplateManager';

// Hook pour gérer les templates personnalisés
export const useCustomTemplates = () => {
  const [templates, setTemplates] = useState<CustomTemplate[]>(() => {
    // Charger les templates depuis le localStorage
    const saved = localStorage.getItem('ui-analyzer-custom-templates');
    const savedTemplates = saved ? JSON.parse(saved) : [];
    
    // Ajouter les templates par défaut s'ils n'existent pas
    const defaultTemplates = DEFAULT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `default-${index}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const existingDefaultIds = savedTemplates
      .filter((t: CustomTemplate) => t.isDefault)
      .map((t: CustomTemplate) => t.id);
    
    const newDefaults = defaultTemplates.filter(t => !existingDefaultIds.includes(t.id));
    
    return [...savedTemplates, ...newDefaults];
  });

  // Sauvegarder dans le localStorage à chaque changement
  const saveTemplates = useCallback((newTemplates: CustomTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('ui-analyzer-custom-templates', JSON.stringify(newTemplates));
  }, []);

  const createTemplate = useCallback((templateData: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: CustomTemplate = {
      ...templateData,
      id: `custom-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    saveTemplates([...templates, newTemplate]);
  }, [templates, saveTemplates]);

  const updateTemplate = useCallback((id: string, updates: Partial<CustomTemplate>) => {
    const updatedTemplates = templates.map(template => 
      template.id === id 
        ? { ...template, ...updates, updatedAt: new Date() }
        : template
    );
    
    saveTemplates(updatedTemplates);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    const filteredTemplates = templates.filter(template => template.id !== id);
    saveTemplates(filteredTemplates);
  }, [templates, saveTemplates]);

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};