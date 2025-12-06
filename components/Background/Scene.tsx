import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import FluidShader from './FluidShader';
import { useStore } from '../../store';
import { AppPhase } from '../../types';

const Scene: React.FC = () => {
  const phase = useStore(s => s.phase);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Early WebGL support check
  useEffect(() => {
    // Quick check if WebGL is supported at all
    const testCanvas = document.createElement('canvas');
    const testGl = testCanvas.getContext('webgl') || 
                   testCanvas.getContext('webgl2') || 
                   testCanvas.getContext('experimental-webgl');
    
    if (!testGl) {
      console.warn('⚠️ WebGL may not be supported in this browser');
      // Don't set error immediately, let Canvas try first
    } else {
      console.log('✅ WebGL support detected');
    }
  }, []);

  // Only show error if Canvas failed to initialize after a reasonable timeout
  useEffect(() => {
    if (!canvasInitialized && !webglError) {
      // Give Canvas 8 seconds to initialize before showing error
      // This gives more time for React Three Fiber to set up
      const timeout = setTimeout(() => {
        if (!canvasInitialized) {
          // Check if Canvas actually exists and has context
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (!gl) {
              console.error('❌ Canvas exists but no WebGL context found');
              setWebglError('WebGL context creation failed');
            } else {
              // Canvas exists and has context, but onCreated wasn't called
              // This might be a timing issue - don't show error yet
              console.warn('⚠️ Canvas exists with context but onCreated not called yet - waiting...');
              // Give it another 3 seconds
              setTimeout(() => {
                if (!canvasInitialized) {
                  console.error('❌ onCreated still not called after extended wait');
                  setWebglError('Canvas initialization timeout - onCreated not called');
                }
              }, 3000);
            }
          } else {
            console.error('❌ No canvas element found');
            setWebglError('Canvas initialization timeout - no canvas element');
          }
        }
      }, 8000); // Increased timeout to 8 seconds
      
      return () => clearTimeout(timeout);
    }
  }, [canvasInitialized, webglError]);

  if (webglError) {
    return (
      <div className="fixed inset-0 z-0 bg-black flex items-center justify-center">
        <div className="text-white text-center p-8">
          <p className="text-lg mb-2">WebGL 初始化失败</p>
          <p className="text-sm text-white/60 mb-4">
            {webglError === 'WebGL context creation failed' 
              ? '无法创建 WebGL 上下文，请检查浏览器设置'
              : 'WebGL 初始化超时，请刷新页面重试'}
          </p>
          <p className="text-xs text-white/40 mb-4">
            建议使用 Chrome、Firefox、Edge 或 Safari 的最新版本
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm transition-colors"
          >
            刷新页面
          </button>
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
          depth: true,
          stencil: false,
          preserveDrawingBuffer: true, // Enable to capture WebGL content for screenshots
          failIfMajorPerformanceCaveat: false
        }}
        dpr={Math.min(window.devicePixelRatio || 1, 2)}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={({ gl, scene, camera }) => {
          try {
            // gl is Three.js WebGLRenderer, not native WebGL context
            // Verify renderer is valid
            if (!gl || typeof gl.setClearColor !== 'function') {
              throw new Error('Invalid WebGL renderer');
            }
            
            // Mark Canvas as initialized - THIS IS CRITICAL
            setCanvasInitialized(true);
            setWebglError(null); // Clear any previous error
            
            // Set clear color using Three.js API
            gl.setClearColor('#000000', 1);
            
            // Get the actual WebGL context from the renderer for logging
            const webglContext = gl.getContext() as WebGLRenderingContext | null;
            
            // Log WebGL info for debugging
            try {
              if (webglContext) {
                try {
                  const version = webglContext.getParameter(webglContext.VERSION);
                  const shadingLanguageVersion = webglContext.getParameter(webglContext.SHADING_LANGUAGE_VERSION);
                  console.log('✅ WebGL Version:', version);
                  console.log('✅ GLSL Version:', shadingLanguageVersion);
                  
                  // Try to get debug info (may not be available in all browsers)
                  try {
                    const debugInfo = webglContext.getParameter(webglContext.DEBUG_RENDERER_INFO);
                    if (debugInfo) {
                      const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                      const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                      console.log('✅ WebGL Renderer:', renderer);
                      console.log('✅ WebGL Vendor:', vendor);
                    }
                  } catch (debugError) {
                    // Debug info not available, that's okay
                    console.log('ℹ️ Debug info unavailable (normal in some browsers)');
                  }
                } catch (webglError) {
                  console.warn('⚠️ Could not access WebGL context info:', webglError);
                }
              }
              
              console.log('✅ Canvas initialized successfully');
              console.log('✅ Three.js Renderer:', gl.constructor.name);
              console.log('✅ Scene objects:', scene.children.length);
              console.log('✅ Camera position:', camera.position);
              console.log('✅ Background fluid effect should render now');
            } catch (logError) {
              console.warn('⚠️ Could not log renderer info:', logError);
            }
          } catch (error) {
            console.error('❌ Canvas initialization error:', error);
            setCanvasInitialized(false);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setWebglError('Canvas 初始化失败: ' + errorMessage);
          }
        }}
        frameloop="always"
        onError={(error) => {
          console.error('❌ Canvas error:', error);
          setWebglError('Canvas 错误: ' + (error?.message || '未知错误'));
        }}
        onContextLost={(event) => {
          console.error('❌ WebGL context lost:', event);
          event.preventDefault(); // Try to prevent default behavior
          setWebglError('WebGL 上下文丢失，请刷新页面');
        }}
        onContextRestored={() => {
          console.log('✅ WebGL context restored');
          setWebglError(null);
          setCanvasInitialized(true);
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