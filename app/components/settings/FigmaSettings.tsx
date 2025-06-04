import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { figmaConfigManager } from '~/lib/config/figmaConfig';
import { FigmaService } from '~/lib/services/figmaService';

interface FigmaSettingsProps {
  className?: string;
}

export function FigmaSettings({ className }: FigmaSettingsProps) {
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    // Load existing token on component mount
    const existingToken = figmaConfigManager.getAccessToken();
    if (existingToken) {
      setAccessToken(existingToken);
      setIsTokenValid(true);
    }
  }, []);

  const handleSaveToken = async () => {
    if (!accessToken.trim()) {
      toast.error('Veuillez saisir un jeton d\'accès valide');
      return;
    }

    setIsLoading(true);
    try {
      // Test the token by making a simple API call
      FigmaService.setAccessToken(accessToken);
      
      // Try to fetch user info to validate the token
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': accessToken,
        },
      });

      if (response.ok) {
        const userData = await response.json() as { handle?: string; email?: string };
        figmaConfigManager.setAccessToken(accessToken);
        setIsTokenValid(true);
        toast.success(`Jeton Figma enregistré avec succès ! Bienvenue, ${userData.handle || 'Utilisateur'}`);
      } else {
        throw new Error('Jeton invalide');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      toast.error('Jeton d\'accès Figma invalide. Veuillez vérifier et réessayer.');
      setIsTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearToken = () => {
    figmaConfigManager.clear();
    setAccessToken('');
    setIsTokenValid(false);
    toast.success('Jeton Figma supprimé avec succès');
  };

  const handleTestConnection = async () => {
    if (!accessToken.trim()) {
      toast.error('Veuillez d\'abord saisir un jeton d\'accès');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': accessToken,
        },
      });

      if (response.ok) {
        const userData = await response.json() as { handle?: string; email?: string };
        toast.success(`Connexion réussie ! Connecté en tant que ${userData.handle || userData.email}`);
        setIsTokenValid(true);
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Échec de la connexion. Veuillez vérifier votre jeton.');
      setIsTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="mb-2">
        <h3 className="text-xl font-semibold text-bolt-elements-textPrimary mb-3">
          Intégration Figma
        </h3>
        <p className="text-sm text-bolt-elements-textSecondary">
          Connectez votre compte Figma pour importer des designs directement dans NeuroCode.
        </p>
      </div>

      <div className="space-y-4 p-5 bg-bolt-elements-background-depth-1 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
            Jeton d'Accès Personnel
          </label>
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Saisissez votre jeton d'accès personnel Figma"
            className="w-full"
          />
        </div>

        <div className="flex  gap-3 pt-2">
          <Button
            onClick={handleSaveToken}
            disabled={isLoading || !accessToken.trim()}
            className="flex-1 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 py-2"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer le Jeton'}
          </Button>
          
          <Button
            onClick={handleTestConnection}
            disabled={isLoading || !accessToken.trim()}
            variant="secondary"
            className="flex-1 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 py-2"
          >
            {isLoading ? 'Test en cours...' : 'Tester la Connexion'}
          </Button>

          {isTokenValid && (
            <Button
              onClick={handleClearToken}
              variant="ghost"
              className="text-red-500 hover:text-red-600 py-2"
            >
              Effacer
            </Button>
          )}
        </div>

        {isTokenValid && (
          <div className="flex items-center gap-2 text-sm text-green-600 mt-2 p-2 bg-green-50 rounded-md">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Jeton valide et prêt à être utilisé
          </div>
        )}
      </div>

      <div className="p-5 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-border">
        <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-3">
          Comment obtenir votre jeton d'accès Figma :
        </h4>
        <ol className="text-sm text-bolt-elements-textSecondary space-y-2 list-decimal list-inside pl-2">
          <li>Accédez aux paramètres de votre compte Figma</li>
          <li>Naviguez vers "Jetons d'accès personnels"</li>
          <li>Cliquez sur "Créer un nouveau jeton d'accès personnel"</li>
          <li>Donnez-lui un nom (ex: "Intégration NeuroCode")</li>
          <li>Copiez le jeton généré et collez-le ci-dessus</li>
        </ol>
        <p className="text-xs text-bolt-elements-textTertiary mt-4 p-2 bg-bolt-elements-background-depth-3 rounded-md">
          Remarque : Gardez votre jeton en sécurité et ne le partagez jamais publiquement.
        </p>
      </div>
    </div>
  );
}