import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { XrChat } from '~/xr/XrChat';
import { useStore } from '@nanostores/react';
import { xrMode } from '~/lib/stores/xr';
import { streamingState } from '~/lib/stores/streaming';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'NeuroCode' }, { name: 'description', content: 'Talk with NeuroCode, an AI assistant' }];
};

export const loader = () => json({});

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  const isXR = useStore(xrMode);
  const isStreaming = useStore(streamingState);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      {isXR ? (
        <ClientOnly fallback={null}>{() => <XrChat activeResponse={isStreaming} />}</ClientOnly>
      ) : (
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      )}
    </div>
  );
}
