import React from 'react';
import { useStore } from '../store';
import { AppPhase } from '../types';

const TransitionLayer: React.FC = () => {
  const phase = useStore(s => s.phase);

  if (phase !== AppPhase.MORPHING) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Simulation of pixel sorting or data breakdown using CSS/SVG */}
      <div className="absolute inset-0 flex flex-col opacity-50">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 bg-white/5 animate-pulse" 
            style={{ 
              animationDelay: `${Math.random() * 0.5}s`,
              transform: `translateX(${Math.random() > 0.5 ? '100%' : '-100%'})`,
              animation: 'slideIn 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            }}
          ></div>
        ))}
      </div>
      
      <div className="font-mono-data text-xs text-white tracking-[0.5em] animate-pulse z-10">
        MORPHING SEQUENCE...
      </div>

      <style>{`
        @keyframes slideIn {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TransitionLayer;