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
  const [isMoving, setIsMoving] = useState(false);
  const [isStationary, setIsStationary] = useState(false);
  
  // Track movement for velocity calculation
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const stationaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimationRef = useRef<gsap.core.Tween | null>(null);
  const isMovingRef = useRef(false);
  const isStationaryRef = useRef(false);
  const touchStartTimeRef = useRef<number | null>(null);
  
  // Velocity threshold (pixels per millisecond) - adjust as needed
  const VELOCITY_THRESHOLD = 0.5; // pixels/ms
  const STATIONARY_TIME = 200; // milliseconds of no movement to be considered stationary
  
  const handleMove = (clientX: number, clientY: number, isClick = false) => {
    if (!containerRef.current) return;
    const { width, height, left, top } = containerRef.current.getBoundingClientRect();
    
    // Normalize -1 to 1
    const x = ((clientX - left) / width) * 2 - 1;
    const y = -(((clientY - top) / height) * 2 - 1); // Invert Y
    
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));

    setCoordinates(clampedX, clampedY);

    // Calculate velocity if we have previous position
    const now = Date.now();
    let velocity = 0;
    
    if (lastPositionRef.current && !isClick) {
      const dx = clientX - lastPositionRef.current.x;
      const dy = clientY - lastPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeDelta = now - lastPositionRef.current.time;
      velocity = timeDelta > 0 ? distance / timeDelta : 0;
    }
    
    // Update last position
    lastPositionRef.current = { x: clientX, y: clientY, time: now };
    
    // Check if moving (only if not a click)
    if (!isClick) {
      const moving = velocity > VELOCITY_THRESHOLD;
      setIsMoving(moving);
      isMovingRef.current = moving;
      
      // If moving, reset stationary timer and stop progress
      if (moving) {
        setIsStationary(false);
        isStationaryRef.current = false;
        setIsPressing(false); // Stop pressing if moving
        if (stationaryTimerRef.current) {
          clearTimeout(stationaryTimerRef.current);
          stationaryTimerRef.current = null;
        }
        // Stop progress if moving
        if (progressAnimationRef.current) {
          progressAnimationRef.current.kill();
          progressAnimationRef.current = null;
          if (progressRef.current) {
            gsap.to(progressRef.current, { strokeDashoffset: 126, duration: 0.3, overwrite: true });
          }
        }
      } else {
        // Not moving, start stationary timer
        if (stationaryTimerRef.current) {
          clearTimeout(stationaryTimerRef.current);
        }
        stationaryTimerRef.current = setTimeout(() => {
          setIsStationary(true);
          isStationaryRef.current = true;
          // If pressing and now stationary, allow progress
          if (isPressing) {
            // Progress will start automatically via useEffect
          }
        }, STATIONARY_TIME);
      }
    } else {
      // For clicks, assume stationary immediately
      setIsMoving(false);
      isMovingRef.current = false;
      setIsStationary(true);
      isStationaryRef.current = true;
    }

    // Move cursor - faster for clicks, smooth for drags
    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        x: clientX - left,
        y: clientY - top,
        duration: isClick ? 0.1 : 0.15,
        ease: isClick ? 'power2.out' : 'power2.out'
      });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientX, e.clientY, false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // On touch/click, immediately move cursor to that position
    touchStartTimeRef.current = Date.now();
    
    // Reset movement tracking for new touch
    lastPositionRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    
    // Move cursor immediately to clicked position
    handleMove(e.clientX, e.clientY, true);
    
    // Check current state using refs for latest values
    const wasStationary = isStationaryRef.current;
    const wasMoving = isMovingRef.current;
    
    // If was stationary and not moving, allow pressing immediately
    if (wasStationary && !wasMoving) {
      setIsPressing(true);
    } else {
      // Otherwise, wait a bit to check if we're stationary
      setIsPressing(false);
      setTimeout(() => {
        // Check if still stationary after delay (using refs for latest values)
        if (isStationaryRef.current && !isMovingRef.current) {
          setIsPressing(true);
        }
      }, STATIONARY_TIME);
    }
  };

  const onPointerUp = () => {
    setIsPressing(false);
    setIsMoving(false);
    setIsStationary(false);
    isMovingRef.current = false;
    isStationaryRef.current = false;
    touchStartTimeRef.current = null;
    
    if (stationaryTimerRef.current) {
      clearTimeout(stationaryTimerRef.current);
      stationaryTimerRef.current = null;
    }
    
    if (progressAnimationRef.current) {
      progressAnimationRef.current.kill();
      progressAnimationRef.current = null;
    }
    
    if (progressRef.current) {
      gsap.to(progressRef.current, { strokeDashoffset: 126, duration: 0.3, overwrite: true });
    }
  };

  useEffect(() => {
    // Only start progress if pressing AND stationary AND not moving
    if (isPressing && isStationary && !isMoving) {
      if (progressAnimationRef.current) {
        progressAnimationRef.current.kill();
      }
      
      progressAnimationRef.current = gsap.to(progressRef.current, {
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
          progressAnimationRef.current = null;
        }
      });
    } else {
      // Stop progress if conditions not met
      if (progressAnimationRef.current) {
        progressAnimationRef.current.kill();
        progressAnimationRef.current = null;
        if (progressRef.current) {
          gsap.to(progressRef.current, { strokeDashoffset: 126, duration: 0.3, overwrite: true });
        }
      }
    }

    return () => {
      if (progressAnimationRef.current) {
        progressAnimationRef.current.kill();
        progressAnimationRef.current = null;
      }
    };
  }, [isPressing, isStationary, isMoving, setPhase, setRecipe]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stationaryTimerRef.current) {
        clearTimeout(stationaryTimerRef.current);
      }
      if (progressAnimationRef.current) {
        progressAnimationRef.current.kill();
      }
    };
  }, []);

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