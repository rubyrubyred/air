import { create } from 'zustand';
import { AppPhase, Recipe } from './types';

interface AppState {
  phase: AppPhase;
  coordinates: { x: number; y: number };
  recipe: Recipe | null;
  
  setPhase: (phase: AppPhase) => void;
  setCoordinates: (x: number, y: number) => void;
  setRecipe: (recipe: Recipe) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  phase: AppPhase.TUNING,
  coordinates: { x: 0, y: 0 },
  recipe: null,
  
  setPhase: (phase) => set({ phase }),
  setCoordinates: (x, y) => set({ coordinates: { x, y } }),
  setRecipe: (recipe) => set({ recipe }),
  reset: () => set({ phase: AppPhase.TUNING, coordinates: { x: 0, y: 0 }, recipe: null }),
}));