import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface XrAssistantProps {
  active: boolean;
}

export const XrAssistant: React.FC<XrAssistantProps> = ({ active }) => {
  const meshRef = useRef<Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scale = 1 + (active ? Math.sin(t * 4) * 0.2 : 0);
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 1.6, -2]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#58a6ff" />
    </mesh>
  );
};
