import React from 'react';

const Overlay: React.FC = () => {
  return (
    <>
      {/* Top Left Branding */}
      <div className="fixed top-6 left-6 z-30 mix-blend-difference pointer-events-none">
        <h1 className="font-mono-data text-xs text-white tracking-widest">
          [ETHER_V1.0]
        </h1>
        <div className="w-8 h-px bg-white mt-2"></div>
      </div>

      {/* Bottom Right Credits */}
      <div className="fixed bottom-6 right-6 z-30 mix-blend-difference pointer-events-none flex flex-col items-end gap-2">
        <div className="font-mono-data text-[10px] text-white/60 uppercase text-right leading-tight">
          Visual Synthesis<br/>
          Generative Poetry
        </div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </div>
    </>
  );
};

export default Overlay;