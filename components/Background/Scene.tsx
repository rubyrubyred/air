import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import FluidShader from './FluidShader';
import { useStore } from '../../store';
import { AppPhase } from '../../types';

const Scene: React.FC = () => {
  const phase = useStore(s => s.phase);

  return (
    <div className={`fixed inset-0 z-0 transition-opacity duration-[1500ms] ${phase === AppPhase.MORPHING ? 'opacity-0' : 'opacity-100'}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Suspense fallback={null}>
          <FluidShader />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;