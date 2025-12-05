import React from 'react';
import Scene from './components/Background/Scene';
import TuningLayer from './components/UI/TuningLayer';
import ReceiptCard from './components/UI/ReceiptCard';
import Overlay from './components/UI/Overlay';
import TransitionLayer from './components/TransitionLayer';
import { useStore } from './store';
import { AppPhase } from './types';

const App: React.FC = () => {
  const phase = useStore((state) => state.phase);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
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
  );
};

export default App;