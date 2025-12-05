import { CORPUS, mapCoordinatesToTypes } from '../constants';
import { Recipe, Ingredient } from '../types';

export const generateRecipe = (x: number, y: number): Recipe => {
  const { weather, mood } = mapCoordinatesToTypes(x, y);
  
  // Random helper
  const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Generate percentages (Total 100%)
  // Core (Weather) is usually dominant, Mood second, Noise is trace
  let p1 = randomInt(45, 65); // Core
  let p2 = randomInt(25, 40); // Mood
  let p3 = 100 - p1 - p2;     // Noise
  
  // Safety check if p3 is negative (rare but possible with random ranges)
  if (p3 <= 0) {
      p3 = 5;
      p2 = 100 - p1 - p3;
  }

  const ingredients: Ingredient[] = [
    { name: randomItem(CORPUS.core[weather]), percentage: p1, type: 'CORE' },
    { name: randomItem(CORPUS.mood[mood]), percentage: p2, type: 'MOOD' },
    { name: randomItem(CORPUS.noise), percentage: p3, type: 'NOISE' }
  ];

  // Timestamp format
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

  return {
    id: `ETHER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    timestamp: `${dateStr} // ${timeStr}`,
    weather,
    mood,
    ingredients,
    quote: randomItem(CORPUS.quotes),
    coordinates: { x, y }
  };
};