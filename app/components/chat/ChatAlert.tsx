import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { ActionAlert } from '~/types/actions';
import { classNames } from '~/utils/classNames';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

export default function ChatAlert({ alert, clearAlert, postMessage }: Props) {
  const { description, content, source, errorCategory } = alert;
  const [additionalContext, setAdditionalContext] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Suggestions basées sur la catégorie d'erreur
  const getSuggestions = () => {
    if (!errorCategory) return [];
    
    const suggestionMap: Record<string, string[]> = {
      syntax: [
        "Vérifiez les accolades, parenthèses ou points-virgules manquants",
        "Assurez-vous que toutes les variables sont correctement déclarées",
        "Vérifiez la coloration syntaxique pour détecter les problèmes potentiels",
        "Contrôlez les déclarations de fonctions et de classes"
      ],
      runtime: [
        "Vérifiez les valeurs null ou undefined",
        "Assurez-vous que les fonctions appelées existent",
        "Inspectez les propriétés d'objet avant l'accès",
        "Examinez les limites de tableaux et les itérations"
      ],
      dependency: [
        "Vérifiez que toutes les dépendances sont installées",
        "Exécutez npm install ou yarn pour mettre à jour les dépendances",
        "Vérifiez package.json pour les conflits de versions",
        "Supprimez node_modules et réinstallez si nécessaire"
      ],
      configuration: [
        "Examinez les fichiers de configuration du projet",
        "Assurez-vous que les variables d'environnement sont correctement définies",
        "Validez les paramètres de build et de déploiement",
        "Vérifiez les configurations de chemins"
      ],
      network: [
        "Vérifiez votre connexion internet",
        "Assurez-vous que les API externes sont accessibles",
        "Testez les endpoints API avec Postman ou des outils similaires",
        "Examinez les paramètres de sécurité réseau"
      ],
      unknown: [
        "Consultez la documentation du projet",
        "Recherchez des problèmes similaires sur GitHub",
        "Examinez les changements de code récents",
        "Vérifiez les logs système pour du contexte supplémentaire"
      ]
    };
    
    return suggestionMap[errorCategory] || [];
  };
  
  const isPreview = source === 'preview';
  const title = isPreview ? 'Erreur de prévisualisation' : 'Erreur de terminal';
  const message = isPreview
    ? 'Nous avons rencontré une erreur lors de l\'exécution de la prévisualisation. Souhaitez-vous que Bolt analyse et aide à résoudre ce problème ?'
    : 'Nous avons rencontré une erreur lors de l\'exécution des commandes du terminal. Souhaitez-vous que Bolt analyse et aide à résoudre ce problème ?';

  const handleSubmit = () => {
    const contextMessage = additionalContext.trim() 
      ? `\n\nContexte supplémentaire: ${additionalContext}` 
      : '';
      
    postMessage(
      `*Fix this ${isPreview ? 'preview' : 'terminal'} error* \n\`\`\`${isPreview ? 'js' : 'sh'}\n${content}\n\`\`\`${contextMessage}\n`,
    );
  };
  
  const [guidedMode, setGuidedMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Étapes de résolution guidée basées sur le type d'erreur
  const getGuidedSteps = () => {
    if (isPreview) {
      return [
        { title: "Identifier le problème", description: "Analysez l'erreur pour comprendre sa cause" },
        { title: "Vérifier le code", description: "Examinez le code source mentionné dans l'erreur" },
        { title: "Corriger et tester", description: "Appliquez les corrections nécessaires et testez à nouveau" }
      ];
    }
    
    return [
      { title: "Vérifier la commande", description: "Assurez-vous que la syntaxe de la commande est correcte" },
      { title: "Vérifier les dépendances", description: "Assurez-vous que toutes les dépendances sont installées" },
      { title: "Exécuter à nouveau", description: "Essayez d'exécuter la commande avec des options différentes" }
    ];
  };
  
  
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4 mb-2`}
      >
        <div className="flex items-start">
          {/* Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`i-ph:warning-duotone text-xl text-bolt-elements-button-danger-text`}></div>
          </motion.div>
          {/* Content */}
          <div className="ml-3 flex-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-sm font-medium text-bolt-elements-textPrimary`}
            >
              {title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-2 text-sm text-bolt-elements-textSecondary`}
            >
              <p>{message}</p>
              {description && (
                <div className="text-xs text-bolt-elements-textSecondary p-2 bg-bolt-elements-background-depth-3 rounded mt-4 mb-4">
                  Erreur : {description}
                </div>
              )}
              
              {/* Champ de texte pour le contexte supplémentaire */}
              <div className="mt-4">
                <label htmlFor="additionalContext" className="block text-xs text-bolt-elements-textSecondary mb-1">
                  Contexte supplémentaire (optionnel):
                </label>
                <textarea
                  id="additionalContext"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Décrivez ce que vous essayiez de faire lorsque cette erreur s'est produite..."
                  className="w-full p-2 text-xs rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary"
                  rows={3}
                />
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={classNames(' flex gap-2')}>
                <button
                  onClick={handleSubmit}
                  className={classNames(
                    `px-2 py-1.5 rounded-md text-sm font-medium`,
                    'bg-bolt-elements-button-primary-background',
                    'hover:bg-bolt-elements-button-primary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-danger-background',
                    'text-bolt-elements-button-primary-text',
                    'flex items-center gap-1.5',
                  )}
                >
                  <div className="i-ph:chat-circle-duotone"></div>
                  Demander à IA
                </button>
                <button
                  onClick={clearAlert}
                  className={classNames(
                    `px-2 py-1.5 rounded-md text-sm font-medium`,
                    'bg-bolt-elements-button-secondary-background',
                    'hover:bg-bolt-elements-button-secondary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-secondary-background',
                    'text-bolt-elements-button-secondary-text',
                  )}
                >
                  Ignorer
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Mode de résolution guidée */}
        <div className="mt-3">
          <button 
            onClick={() => setGuidedMode(!guidedMode)}
            className={classNames(
              `px-2 py-1 rounded-md text-xs font-medium`,
              'bg-bolt-elements-button-secondary-background',
              'hover:bg-bolt-elements-button-secondary-backgroundHover',
              'text-bolt-elements-button-secondary-text',
              'flex items-center gap-1.5',
            )}
          >
            <div className="i-ph:path-duotone"></div>
            {guidedMode ? "Quitter le mode guidé" : "Mode de résolution guidée"}
          </button>
          
          {guidedMode && (
            <div className="mt-3 border-l-2 border-bolt-elements-borderColor pl-3">
              {getGuidedSteps().map((step, index) => (
                <div 
                  key={index}
                  className={classNames(
                    "mb-2 p-2 rounded",
                    currentStep === index ? "bg-bolt-elements-background-depth-3" : "",
                    currentStep > index ? "text-bolt-elements-textSecondary opacity-50" : ""
                  )}
                >
                  <h4 className="text-xs font-medium">{index + 1}. {step.title}</h4>
                  {currentStep === index && (
                    <p className="text-xs mt-1">{step.description}</p>
                  )}
                </div>
              ))}
              
              <div className="flex justify-between mt-2">
                <button 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className={classNames(
                    "px-2 py-1 rounded text-xs",
                    currentStep === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-bolt-elements-background-depth-3"
                  )}
                >
                  Précédent
                </button>
                <button 
                  onClick={() => {
                    if (currentStep < getGuidedSteps().length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      // Dernière étape, demander à Bolt
                      handleSubmit();
                    }
                  }}
                  className="px-2 py-1 rounded text-xs hover:bg-bolt-elements-background-depth-3"
                >
                  {currentStep < getGuidedSteps().length - 1 ? "Suivant" : "Terminer et demander à Bolt"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
