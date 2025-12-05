export enum AppPhase {
  TUNING = 'TUNING',
  MORPHING = 'MORPHING',
  MANIFESTATION = 'MANIFESTATION'
}

export enum WeatherType {
  RAIN = 'RAIN',     // Heavy Rain
  SUN = 'SUN',       // First Light / Sun
  FOG = 'FOG',       // Mist / Fog
  STORM = 'STORM',   // Typhoon Eye
  AURORA = 'AURORA'  // Aurora
}

export enum MoodType {
  VOID = 'VOID',      // 虚无
  MANIC = 'MANIC',    // 躁动
  JOY = 'JOY',        // 确幸
  BROKEN = 'BROKEN',  // 破碎
  QUIET = 'QUIET'     // 静谧
}

export interface Ingredient {
  name: string;
  percentage: number;
  type: 'CORE' | 'MOOD' | 'NOISE';
}

export interface Recipe {
  id: string;
  timestamp: string;
  weather: WeatherType;
  mood: MoodType;
  ingredients: Ingredient[];
  quote: string;
  coordinates: { x: number; y: number };
}

export interface CorpusData {
  core: Record<WeatherType, string[]>;
  mood: Record<MoodType, string[]>;
  noise: string[];
  quotes: string[];
}