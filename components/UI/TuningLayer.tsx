import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../../store';
import { generateRecipe } from '../../utils/recipeGenerator';
import { AppPhase } from '../../types';
import gsap from 'gsap';

const TuningLayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const { setCoordinates, setPhase, setRecipe } = useStore();
  
  const [isPressing, setIsPressing] = useState(false);
  
  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const { width, height, left, top } = containerRef.current.getBoundingClientRect();
    
    // Normalize -1 to 1
    const x = ((clientX - left) / width) * 2 - 1;
    const y = -(((clientY - top) / height) * 2 - 1); // Invert Y
    
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));

    setCoordinates(clampedX, clampedY);

    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        x: clientX - left,
        y: clientY - top,
        duration: 0.15, // Slightly faster for clearer "flat" feel
        ease: 'power2.out'
      });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onPointerDown = () => {
    setIsPressing(true);
  };

  const onPointerUp = () => {
    setIsPressing(false);
    if (progressRef.current) {
      gsap.to(progressRef.current, { strokeDashoffset: 126, duration: 0.3, overwrite: true });
    }
  };

  useEffect(() => {
    let animation: gsap.core.Tween;

    if (isPressing) {
      animation = gsap.to(progressRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: 'power1.inOut',
        onComplete: () => {
          const { coordinates } = useStore.getState();
          const newRecipe = generateRecipe(coordinates.x, coordinates.y);
          setRecipe(newRecipe);
          setPhase(AppPhase.MORPHING);
          setTimeout(() => {
            setPhase(AppPhase.MANIFESTATION);
          }, 1500);
        }
      });
    }

    return () => {
      if (animation) animation.kill();
    };
  }, [isPressing, setPhase, setRecipe]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-10 touch-none cursor-none select-none"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Background Grid Guide - Flat Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center">
        <div className="w-[1px] h-full bg-white"></div>
        <div className="h-[1px] w-full bg-white absolute"></div>
        <span className="absolute top-6 left-6 font-mono-data text-xs tracking-widest text-white/40">XY_POS_TRACKING</span>
      </div>

      {/* Axis Labels - Horizontal, Flat, Bigger */}
      <div className="absolute inset-0 pointer-events-none font-serif-title tracking-[0.25em] text-white/90">
        {/* Top - Y Max */}
        <div className="absolute top-12 left-0 right-0 text-center text-lg md:text-xl">
          MANIC <span className="text-white/40 text-sm ml-2">/ 躁动</span>
        </div>
        
        {/* Bottom - Y Min */}
        <div className="absolute bottom-12 left-0 right-0 text-center text-lg md:text-xl">
          VOID <span className="text-white/40 text-sm ml-2">/ 虚无</span>
        </div>
        
        {/* Left - X Min */}
        <div className="absolute top-1/2 left-12 -translate-y-1/2 text-left text-lg md:text-xl">
          <div>STORM</div>
          <div className="text-white/40 text-sm mt-1">/ 风暴</div>
        </div>

        {/* Right - X Max */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 text-right text-lg md:text-xl">
          <div>SUN</div>
          <div className="text-white/40 text-sm mt-1">/ 如初</div>
        </div>
      </div>

      {/* Custom Cursor - Flat Design */}
      <div 
        ref={cursorRef} 
        className="absolute w-0 h-0 pointer-events-none"
      >
        <div className={`relative -left-[26px] -top-[26px] w-[52px] h-[52px] flex items-center justify-center transition-transform duration-300 ${isPressing ? 'scale-110' : 'scale-100'}`}>
          {/* Flat Outer Ring - No Blur, No Shadow, Solid Border */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-white opacity-40"></div>
          
          {/* Interaction SVG */}
          <svg className="absolute w-full h-full rotate-[-90deg]" viewBox="0 0 42 42">
            <circle 
              cx="21" cy="21" r="20" 
              fill="none" 
              stroke="white" 
              strokeWidth="1.5"
              strokeDasharray="126"
              strokeDashoffset="126"
              ref={progressRef}
            />
          </svg>

          {/* Core - Solid Square for Digital/Avant-garde feel, or simple solid dot */}
          <div className="w-2 h-2 bg-white rounded-none"></div>
          
          {/* Hint Text */}
          <span className={`absolute top-16 whitespace-nowrap font-mono-data text-[10px] text-white uppercase tracking-[0.2em] transition-opacity duration-300 ${isPressing ? 'opacity-100' : 'opacity-0'}`}>
            INITIALIZING...
          </span>
        </div>
      </div>
    </div>
  );
};

export default TuningLayer;