import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import gsap from 'gsap';
import { RefreshCw, Download } from 'lucide-react';
import { AppPhase } from '../../types';

const ReceiptCard: React.FC = () => {
  const recipe = useStore((state) => state.recipe);
  const cardRef = useRef<HTMLDivElement>(null);
  const reset = useStore((state) => state.reset);

  useEffect(() => {
    if (cardRef.current && recipe) {
      gsap.fromTo(cardRef.current, 
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, [recipe]);

  if (!recipe) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <div 
        ref={cardRef}
        className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 max-w-md w-full shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Subtle Gradient Border Effect via pseudo-element not easily done in tailwind alone without complex config, so using simple border */}
        
        {/* Header */}
        <div className="text-center mb-8 border-b border-white/10 pb-6">
          <h2 className="font-serif-title text-2xl tracking-[0.2em] text-white mb-2">ETHER</h2>
          <p className="font-mono-data text-[10px] text-white/40 uppercase tracking-widest">
            Atmospheric Analysis Report
          </p>
          <p className="font-mono-data text-[10px] text-white/40 mt-1">
            ID: {recipe.id}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 mb-8">
          <div className="flex justify-between items-end">
            <span className="font-mono-data text-xs text-white/50">TIMESTAMP</span>
            <span className="font-mono-data text-xs text-white">{recipe.timestamp}</span>
          </div>

          <div className="py-4 border-y border-dashed border-white/10 space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <div key={idx} className="flex justify-between items-baseline group">
                <span className="font-serif-display text-lg text-white/90 group-hover:text-white transition-colors">
                  {ing.name}
                </span>
                <span className="font-mono-data text-xs text-white/60">
                  {ing.percentage}%
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <p className="font-serif-display italic text-center text-white/80 leading-relaxed text-sm">
              "{recipe.quote}"
            </p>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="flex justify-center gap-6 pt-4">
           <button 
            onClick={reset}
            className="group flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors"
          >
            <div className="p-2 border border-white/10 rounded-full group-hover:border-white/40 transition-colors">
               <RefreshCw size={16} />
            </div>
            <span className="font-mono-data text-[9px] uppercase tracking-widest">Resample</span>
          </button>
          
          <button className="group flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
            <div className="p-2 border border-white/10 rounded-full group-hover:border-white/40 transition-colors">
               <Download size={16} />
            </div>
            <span className="font-mono-data text-[9px] uppercase tracking-widest">Save</span>
          </button>
        </div>

        {/* Decorative Barcode-ish lines */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="bg-white" style={{ width: Math.random() * 10 + '%', opacity: Math.random() }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceiptCard;