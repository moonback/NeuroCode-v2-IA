import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { workbenchStore } from '~/lib/stores/workbench';
import { streamingState } from '~/lib/stores/streaming';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { NetlifyDeploymentLink } from '~/components/chat/NetlifyDeploymentLink.client';
import { VercelDeploymentLink } from '~/components/chat/VercelDeploymentLink.client';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';

interface DeployButtonProps {
  onVercelDeploy?: () => Promise<void>;
  onNetlifyDeploy?: () => Promise<void>;
}

export const DeployButton = ({ onVercelDeploy, onNetlifyDeploy }: DeployButtonProps) => {
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | null>(null);
  const isStreaming = useStore(streamingState);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();

  const handleVercelDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('vercel');

    try {
      if (onVercelDeploy) {
        await onVercelDeploy();
      } else {
        await handleVercelDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleNetlifyDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('netlify');

    try {
      if (onNetlifyDeploy) {
        await onNetlifyDeploy();
      } else {
        await handleNetlifyDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  return (
    <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden text-sm">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          disabled={isDeploying || !activePreview || isStreaming}
          className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.7"
        >
          {isDeploying ? `Deploying to ${deployingTo}...` : 'Deployer'}
          <span className={classNames('i-ph:caret-down transition-transform')} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={classNames(
            'z-[250]',
            'bg-bolt-elements-background-depth-2',
            'rounded-lg shadow-lg',
            'border border-bolt-elements-borderColor',
            'animate-in fade-in-0 zoom-in-95',
            'py-1',
          )}
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview || !netlifyConn.user,
              },
            )}
            disabled={isDeploying || !activePreview || !netlifyConn.user}
            onClick={handleNetlifyDeployClick}
          >
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/netlify"
            />
            <span className="mx-auto">{!netlifyConn.user ? 'Aucun compte Netlify connecté' : 'Déployer sur Netlify'}</span>
            {netlifyConn.user && <NetlifyDeploymentLink />}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview || !vercelConn.user,
              },
            )}
            disabled={isDeploying || !activePreview || !vercelConn.user}
            onClick={handleVercelDeployClick}
          >
            <img
              className="w-5 h-5 bg-black p-1 rounded"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/vercel/white"
              alt="vercel"
            />
            <span className="mx-auto">{!vercelConn.user ? 'Aucun compte Vercel connecté' : 'Déployer sur Vercel'}</span>
            {vercelConn.user && <VercelDeploymentLink />}
          </DropdownMenu.Item>

          {/* <DropdownMenu.Item
            disabled
            className="flex items-center w-full rounded-md px-4 py-2 text-sm text-bolt-elements-textTertiary gap-2 opacity-60 cursor-not-allowed"
          >
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/cloudflare"
              alt="cloudflare"
            />
            <span className="mx-auto">Déployer sur Cloudflare (Bientôt disponible)</span>
          </DropdownMenu.Item> */}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};