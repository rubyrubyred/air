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
      // Give Canvas 5 seconds to initialize before showing error (increased from 3)
      const timeout = setTimeout(() => {
        if (!canvasInitialized) {
          // Check if Canvas actually exists and has context
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (!gl) {
              setWebglError('WebGL context creation failed');
            } else {
              // Canvas exists and has context, but onCreated wasn't called
              // This might be a timing issue, give it more time
              console.warn('⚠️ Canvas exists but not initialized yet');
            }
          } else {
            setWebglError('Canvas initialization timeout');
          }
        }
      }, 5000); // Increased timeout to 5 seconds
      
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
        gl={(canvas) => {
          try {
            // Manual WebGL context creation with fallbacks
            const contextAttributes: WebGLContextAttributes = {
              antialias: true,
              alpha: false,
              depth: true,
              stencil: false,
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: false,
              premultipliedAlpha: false,
              desynchronized: false
            };
            
            // Try WebGL2 first
            let gl: WebGLRenderingContext | null = canvas.getContext('webgl2', contextAttributes);
            
            // Fallback to WebGL1
            if (!gl) {
              gl = canvas.getContext('webgl', contextAttributes);
            }
            
            // Fallback to experimental-webgl
            if (!gl) {
              gl = canvas.getContext('experimental-webgl', contextAttributes);
            }
            
            // Try with minimal settings
            if (!gl) {
              const minimalAttrs: WebGLContextAttributes = {
                alpha: false,
                depth: true,
                failIfMajorPerformanceCaveat: false
              };
              gl = canvas.getContext('webgl', minimalAttrs) || 
                   canvas.getContext('experimental-webgl', minimalAttrs);
            }
            
            if (!gl) {
              const errorMsg = '无法创建 WebGL 上下文';
              console.error('❌', errorMsg);
              // Use setTimeout to update state after render
              setTimeout(() => {
                setWebglError(errorMsg);
              }, 0);
              throw new Error(errorMsg);
            }
            
            console.log('✅ WebGL context created:', gl.getParameter(gl.VERSION));
            return gl;
          } catch (error) {
            console.error('❌ WebGL context creation error:', error);
            setTimeout(() => {
              setWebglError('WebGL 上下文创建失败: ' + (error instanceof Error ? error.message : String(error)));
            }, 0);
            throw error;
          }
        }}
        dpr={Math.min(window.devicePixelRatio || 1, 2)}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={({ gl, scene, camera }) => {
          try {
            // Verify WebGL context is valid
            if (!gl || !gl.getParameter) {
              throw new Error('Invalid WebGL context');
            }
            
            // Mark Canvas as initialized
            setCanvasInitialized(true);
            setWebglError(null); // Clear any previous error
            
            // Set clear color and clear the canvas
            gl.setClearColor('#000000', 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // Log WebGL info for debugging
            try {
              const version = gl.getParameter(gl.VERSION);
              const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
              console.log('✅ WebGL Version:', version);
              console.log('✅ GLSL Version:', shadingLanguageVersion);
              
              // Try to get debug info (may not be available in all browsers)
              try {
                const debugInfo = gl.getParameter(gl.DEBUG_RENDERER_INFO);
                if (debugInfo) {
                  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                  console.log('✅ WebGL Renderer:', renderer);
                  console.log('✅ WebGL Vendor:', vendor);
                }
              } catch (debugError) {
                // Debug info not available, that's okay
                console.log('ℹ️ Debug info unavailable (normal in some browsers)');
              }
              
              console.log('✅ Canvas initialized successfully');
            } catch (logError) {
              console.warn('⚠️ Could not log WebGL info:', logError);
            }
          } catch (error) {
            console.error('❌ Canvas initialization error:', error);
            setCanvasInitialized(false);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setWebglError('Canvas 初始化失败: ' + errorMessage);
          }
        }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <FluidShader />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;