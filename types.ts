
export enum GameState {
  SPLASH = 'SPLASH',
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  MAP_MAKER = 'MAP_MAKER',
  CAR_MAKER = 'CAR_MAKER',
}

export type GameMode = 'INFINITE' | 'LEVELS';

export interface LevelConfig {
  id: number;
  distance: number; // Target distance in meters
  name: string;
}

export interface GameScore {
  distance: number;
  bestDistance: number;
}

export type CarShape = 'coupe' | 'buggy' | 'jeep' | 'racer' | 'van' | 'supercar' | 'truck' | 'bike';

export interface CarModel {
  id: string;
  name: string;
  color: string; // Main display color (UI)
  bodyColor: string; // Hex for the chassis base
  texture: 'plain' | 'striped' | 'dots' | 'checker' | 'gradient';
  textureColor2: string; // Secondary color for pattern/gradient
  wheelColor: string;
  speed: number; // Max angular velocity
  acceleration: number; // Torque increment
  density: number; // Weight/Stability
  friction: number; // Grip
  driveTrain: 'FWD' | 'RWD' | 'AWD'; // New property for powered wheels
  shape: CarShape; // New property for visual geometry
  
  // Custom Dimensions
  width?: number;  // Overrides GAME_CONFIG.CAR_WIDTH
  height?: number; // Overrides GAME_CONFIG.CAR_HEIGHT
  wheelSize?: number; // Overrides GAME_CONFIG.WHEEL_SIZE

  // Custom Image Support
  imageUrl?: string;
  imageScale?: number;
  imageYOffset?: number;
}

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  backgroundType: 'earth' | 'moon' | 'highway' | 'caves' | 'mars' | 'arctic';
  skyColorStart: string;
  skyColorEnd: string;
  groundColor: string;
  groundDarkColor: string;
  particleColor: string;
  configOverrides: Partial<GameConfig>;
}

export interface GameConfig {
  // Rendering
  RESOLUTION: number; // 0.1 to 1.0
  PIXELATED: boolean;

  CAR_WIDTH: number;
  CAR_HEIGHT: number;
  WHEEL_SIZE: number;
  GRAVITY: number;
  CAR_SPEED: number;
  ACCELERATION: number;
  GROUND_ROTATION_SPEED: number;
  AIR_ROTATION_SPEED: number;
  MAX_ROTATION_SPEED: number;
  CHUNK_SIZE: number;
  RENDER_DISTANCE: number;
  INITIAL_BUFFER_DISTANCE: number; // New config
  TERRAIN_SEGMENT_WIDTH: number;
  WALL_DISTANCE: number;
  BASE_VIEWPORT_WIDTH: number;
  BASE_VIEWPORT_HEIGHT: number;
  MAX_ZOOM_FACTOR: number;
  COIN_SIZE: number;
  COIN_VALUE: number;
  
  // Fuel System
  MAX_FUEL: number;
  FUEL_CONSUMPTION: number;
  FUEL_CAN_VALUE: number;
  FUEL_CAN_SIZE: number;

  PARTICLE_POOL_SIZE: number;
  PARTICLE_LIFETIME: number;
  DAY_CYCLE_FRAMES: number;
  LAMP_SPACING: number;
  
  // Terrain Generation Config
  TERRAIN_NOISE_FREQ_1: number;
  TERRAIN_AMP_1: number;
  TERRAIN_NOISE_FREQ_2: number;
  TERRAIN_AMP_2: number;
  TERRAIN_NOISE_FREQ_3: number;
  TERRAIN_AMP_3: number;
  
  // Physics
  FRICTION: number;
}

// Minimal Matter.js types needed for TS compilation without the full @types package
export interface Vector {
  x: number;
  y: number;
}

export interface Body {
  position: Vector;
  angle: number;
  vertices: Vector[];
  label?: string;
}

export interface Composite {
  bodies: Body[];
  constraints: any[];
  composites: Composite[];
}

export interface Engine {
  world: any;
  // Add other properties as needed
}
