import React, { useEffect } from 'react';
import Scene from './components/Background/Scene';
import TuningLayer from './components/UI/TuningLayer';
import ReceiptCard from './components/UI/ReceiptCard';
import Overlay from './components/UI/Overlay';
import TransitionLayer from './components/TransitionLayer';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store';
import { AppPhase } from './types';

const App: React.FC = () => {
  const phase = useStore((state) => state.phase);

  useEffect(() => {
    // Ensure root element has full height
    const root = document.getElementById('root');
    if (root) {
      root.style.width = '100%';
      root.style.height = '100%';
    }
    
    // Ensure body and html have full height
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
  }, []);

  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen bg-black overflow-hidden select-none" style={{ width: '100vw', height: '100vh' }}>
        {/* 1. WebGL Background (Persistent) */}
        <Scene />

        {/* 2. Global Static UI */}
        <Overlay />

        {/* 3. Phase Controller */}
        {phase === AppPhase.TUNING && <TuningLayer />}
        
        {/* 4. Transition Effect */}
        <TransitionLayer />

        {/* 5. Result */}
        {phase === AppPhase.MANIFESTATION && <ReceiptCard />}
      </div>
    </ErrorBoundary>
  );
};

export default App;