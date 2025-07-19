import { Canvas } from '@react-three/fiber';
import { VRButton, XR } from '@react-three/xr';
import React from 'react';

interface XrCanvasProps {
  children: React.ReactNode;
}

export const XrCanvas: React.FC<XrCanvasProps> = ({ children }) => {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          {children}
        </XR>
      </Canvas>
    </>
  );
};
