import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import gsap from 'gsap';
import { RefreshCw, Download } from 'lucide-react';
import { AppPhase } from '../../types';

const ReceiptCard: React.FC = () => {
  const recipe = useStore((state) => state.recipe);
  const cardRef = useRef<HTMLDivElement>(null);
  const reset = useStore((state) => state.reset);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cardRef.current && recipe) {
      gsap.fromTo(cardRef.current, 
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, [recipe]);

  const loadHtml2Canvas = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).html2canvas) {
        resolve((window as any).html2canvas);
        return;
      }
      
      // Load from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).html2canvas) {
          resolve((window as any).html2canvas);
        } else {
          reject(new Error('html2canvas failed to load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas'));
      };
      document.head.appendChild(script);
    });
  };

  const captureAndSave = async () => {
    if (!cardRef.current || !recipe || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // Load html2canvas
      const html2canvas = await loadHtml2Canvas();
      
      // Capture the card as canvas
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2, // Higher quality for retina displays
        useCORS: true,
        logging: false,
        allowTaint: false,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight
      });
      
      // Convert to blob and download
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
      
      if (!blob) {
        console.error('Failed to create blob');
        setIsSaving(false);
        return;
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const fileName = `ETHER_${recipe.id || Date.now()}.png`;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // For mobile devices, try Web Share API first (if supported)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          const shareData: any = {
            title: 'ETHER Recipe',
            text: `ETHER Recipe - ${recipe.id}`
          };
          
          // Check if files sharing is supported
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
          
          await navigator.share(shareData);
          setIsSaving(false);
          URL.revokeObjectURL(url);
          return;
        } catch (shareError) {
          // If share fails or is cancelled, fall back to download
          console.log('Share failed, falling back to download:', shareError);
        }
      }
      
      // Desktop or fallback: trigger download
      triggerDownload(link, url);
      setIsSaving(false);
      
    } catch (error) {
      console.error('Error capturing image:', error);
      setIsSaving(false);
      // Show fallback message
      alert('截图失败，请尝试使用浏览器的截图功能或长按图片保存');
    }
  };

  const triggerDownload = (link: HTMLAnchorElement, url: string) => {
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

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
          
          <button 
            onClick={captureAndSave}
            disabled={isSaving}
            className="group flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-2 border border-white/10 rounded-full group-hover:border-white/40 transition-colors">
               <Download size={16} className={isSaving ? 'animate-spin' : ''} />
            </div>
            <span className="font-mono-data text-[9px] uppercase tracking-widest">
              {isSaving ? 'Saving...' : 'Save'}
            </span>
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