import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import FluidShader from './FluidShader';
import { useStore } from '../../store';
import { AppPhase } from '../../types';

const Scene: React.FC = () => {
  const phase = useStore(s => s.phase);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglError('WebGL not supported');
      console.error('WebGL is not supported in this browser');
    }
  }, []);

  if (webglError) {
    return (
      <div className="fixed inset-0 z-0 bg-black flex items-center justify-center">
        <div className="text-white text-center p-8">
          <p className="text-lg mb-2">WebGL 不支持</p>
          <p className="text-sm text-white/60">您的浏览器不支持 WebGL，请使用现代浏览器访问</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-0 transition-opacity duration-[1500ms] ${phase === AppPhase.MORPHING ? 'opacity-0' : 'opacity-100'}`} style={{ width: '100%', height: '100%' }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={({ gl, scene }) => {
          try {
            gl.setClearColor('#000000', 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // Log WebGL info for debugging
            const debugInfo = gl.getParameter(gl.DEBUG_RENDERER_INFO);
            if (debugInfo) {
              console.log('WebGL Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
              console.log('WebGL Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
            }
            console.log('Canvas initialized successfully');
          } catch (error) {
            console.error('Canvas initialization error:', error);
            setWebglError('Canvas initialization failed');
          }
        }}
      >
        <Suspense fallback={null}>
          <FluidShader />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;