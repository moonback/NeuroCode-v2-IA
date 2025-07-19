import React from 'react';
import { useStore } from '@nanostores/react';
import { toggleXRMode, xrMode } from '~/lib/stores/xr';
import { IconButton } from '~/components/ui/IconButton';

export const XrModeToggle: React.FC = () => {
  const enabled = useStore(xrMode);
  return (
    <IconButton
      title="Activer le mode VR"
      onClick={() => toggleXRMode()}
      className={enabled ? 'text-accent' : ''}
    >
      <div className="i-ph:vr-cardboard text-xl" />
    </IconButton>
  );
};
