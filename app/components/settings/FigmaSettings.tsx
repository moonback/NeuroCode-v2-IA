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
      toast.error('Please enter a valid access token');
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
        toast.success(`Figma token saved successfully! Welcome, ${userData.handle || 'User'}`);
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      toast.error('Invalid Figma access token. Please check and try again.');
      setIsTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearToken = () => {
    figmaConfigManager.clear();
    setAccessToken('');
    setIsTokenValid(false);
    toast.success('Figma token cleared successfully');
  };

  const handleTestConnection = async () => {
    if (!accessToken.trim()) {
      toast.error('Please enter an access token first');
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
        toast.success(`Connection successful! Connected as ${userData.handle || userData.email}`);
        setIsTokenValid(true);
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Connection failed. Please check your token.');
      setIsTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">
          Figma Integration
        </h3>
        <p className="text-sm text-bolt-elements-textSecondary mb-4">
          Connect your Figma account to import designs directly into NeuroCode.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
            Personal Access Token
          </label>
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Enter your Figma personal access token"
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSaveToken}
            disabled={isLoading || !accessToken.trim()}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Token'}
          </Button>
          
          <Button
            onClick={handleTestConnection}
            disabled={isLoading || !accessToken.trim()}
            variant="secondary"
            className="flex-1"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>

          {isTokenValid && (
            <Button
              onClick={handleClearToken}
              variant="ghost"
              className="text-red-500 hover:text-red-600"
            >
              Clear
            </Button>
          )}
        </div>

        {isTokenValid && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Token is valid and ready to use
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-bolt-elements-background-depth-2 rounded-lg">
        <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">
          How to get your Figma access token:
        </h4>
        <ol className="text-sm text-bolt-elements-textSecondary space-y-1 list-decimal list-inside">
          <li>Go to your Figma account settings</li>
          <li>Navigate to "Personal access tokens"</li>
          <li>Click "Create a new personal access token"</li>
          <li>Give it a name (e.g., "NeuroCode Integration")</li>
          <li>Copy the generated token and paste it above</li>
        </ol>
        <p className="text-xs text-bolt-elements-textTertiary mt-2">
          Note: Keep your token secure and never share it publicly.
        </p>
      </div>
    </div>
  );
}