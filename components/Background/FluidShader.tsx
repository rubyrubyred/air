import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';

// Fix for missing R3F types in JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      shaderMaterial: any;
    }
  }
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uColorBase;
  uniform vec3 uColorMood;
  uniform float uDistortion;
  varying vec2 vUv;

  // Simplex noise function
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    
    // Slow organic movement
    float noise1 = snoise(uv * 3.0 + uTime * 0.1);
    float noise2 = snoise(uv * 6.0 - uTime * 0.15);
    
    // Mouse interaction distortion
    float dist = distance(uv, uMouse * 0.5 + 0.5);
    float mouseEffect = smoothstep(0.5, 0.0, dist) * uDistortion;
    
    // Combined fluid
    float fluid = noise1 * 0.5 + noise2 * 0.2 + mouseEffect;
    
    // Color mixing logic
    vec3 color = mix(uColorBase, uColorMood, fluid + 0.5);
    
    // Add grain
    float grain = (fract(sin(dot(uv, vec2(12.9898, 78.233) * uTime)) * 43758.5453) - 0.5) * 0.05;
    
    gl_FragColor = vec4(color + grain, 1.0);
  }
`;

const FluidShader: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const coordinates = useStore((state) => state.coordinates);
  
  // Memoize uniforms to prevent recreation
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorBase: { value: new THREE.Color('#1a1a1a') }, // Default dark
    uColorMood: { value: new THREE.Color('#2a2a2a') },
    uDistortion: { value: 0.0 }
  }), []);

  // Calculate colors based on coordinates (HSL logic)
  // X (Weather) controls Hue roughly
  // Y (Mood) controls Saturation/Lightness
  const getTargetColors = (x: number, y: number) => {
    // Map X (-1 to 1) to Hue (0 to 1)
    // -1 (Rain/Storm) -> Blue/Purple (240-270)
    // 0 (Fog) -> Gray/Blue (200)
    // 1 (Sun) -> Orange/Gold (30-50)
    let h = 0.6; 
    if(x < -0.3) h = 0.65; // Blue
    else if(x > 0.3) h = 0.1; // Orange
    else h = 0.55; // Cyan/Grey

    // Map Y (-1 to 1) to Saturation and Lightness
    // -1 (Void) -> Low Sat, Low Light
    // 1 (Manic) -> High Sat, High Light
    const s = THREE.MathUtils.mapLinear(y, -1, 1, 0.2, 0.9);
    const l = THREE.MathUtils.mapLinear(y, -1, 1, 0.1, 0.6);

    const baseColor = new THREE.Color().setHSL(h, s, l);
    const moodColor = new THREE.Color().setHSL((h + 0.1) % 1.0, s * 0.8, l * 0.5); // Secondary color
    
    return { baseColor, moodColor };
  };

  useFrame((state) => {
    if (materialRef.current) {
      // Update time
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

      // Lerp Mouse Position
      const currentMouse = materialRef.current.uniforms.uMouse.value;
      currentMouse.x = THREE.MathUtils.lerp(currentMouse.x, coordinates.x, 0.1);
      currentMouse.y = THREE.MathUtils.lerp(currentMouse.y, coordinates.y, 0.1);

      // Lerp Colors
      const { baseColor, moodColor } = getTargetColors(coordinates.x, coordinates.y);
      materialRef.current.uniforms.uColorBase.value.lerp(baseColor, 0.05);
      materialRef.current.uniforms.uColorMood.value.lerp(moodColor, 0.05);

      // Distortion amount based on distance from center
      const dist = Math.sqrt(coordinates.x * coordinates.x + coordinates.y * coordinates.y);
      materialRef.current.uniforms.uDistortion.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uDistortion.value, 
        dist * 2.0, 
        0.1
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[20, 20, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default FluidShader;