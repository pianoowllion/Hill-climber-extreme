
import { CarModel, GameConfig, MapConfig, LevelConfig } from './types';

export const GAME_CONFIG: GameConfig = {
  RESOLUTION: 1.0,
  PIXELATED: false,

  CAR_WIDTH: 160,
  CAR_HEIGHT: 50, 
  WHEEL_SIZE: 30, 
  GRAVITY: 1.6,
  CAR_SPEED: 0.9,     
  ACCELERATION: 0.02, 
  
  // Rotation Settings
  GROUND_ROTATION_SPEED: 0.002, 
  AIR_ROTATION_SPEED: 0.01,    
  MAX_ROTATION_SPEED: 0.15,    

  // Chunking Settings
  CHUNK_SIZE: 2000, 
  RENDER_DISTANCE: 4000, 
  INITIAL_BUFFER_DISTANCE: 2500, 
  TERRAIN_SEGMENT_WIDTH: 40,
  WALL_DISTANCE: 1000, 
  
  // Dynamic Camera Settings
  BASE_VIEWPORT_WIDTH: 1200,
  BASE_VIEWPORT_HEIGHT: 800,
  MAX_ZOOM_FACTOR: 1.5, 

  // Coin Settings
  COIN_SIZE: 15,
  COIN_VALUE: 10,

  // Fuel System
  MAX_FUEL: 100,
  FUEL_CONSUMPTION: 0.1, // Reduced from 0.15
  FUEL_CAN_VALUE: 50,     
  FUEL_CAN_SIZE: 20,

  // Particles
  PARTICLE_POOL_SIZE: 40,
  PARTICLE_LIFETIME: 40, 

  // Day/Night Cycle
  DAY_CYCLE_FRAMES: 3600, 
  LAMP_SPACING: 400,

  // Terrain Noise Defaults
  TERRAIN_NOISE_FREQ_1: 0.19, 
  TERRAIN_AMP_1: 1.1,         
  TERRAIN_NOISE_FREQ_2: 0.44, 
  TERRAIN_AMP_2: 0.4,
  TERRAIN_NOISE_FREQ_3: 0.91,   
  TERRAIN_AMP_3: 0,
  
  // Physics
  FRICTION: 1.0
};

export const LEVELS: LevelConfig[] = [
    { id: 1, distance: 1000, name: "Warm Up" },
    { id: 2, distance: 2500, name: "The Long Road" },
    { id: 3, distance: 5000, name: "Endurance" },
    { id: 4, distance: 7500, name: "Marathon" },
    { id: 5, distance: 10000, name: "Grand Tour" }
];

export const COLORS = {
  skyStart: '#38bdf8', // sky-400 (Day)
  skyEnd: '#e0f2fe',   // sky-100 (Day)
  
  skyNightStart: '#0f172a', // slate-900 (Night)
  skyNightEnd: '#312e81',   // indigo-900 (Night)

  ground: '#10b981',   // emerald-500
  groundDark: '#047857', // emerald-700
  grassDetail: '#065f46', // emerald-800 for grass blades
  
  carBody: '#ef4444',  // red-500
  carWheel: '#171717', // neutral-900
  carRim: '#a8a29e',   // stone-400
  
  coinInner: '#fbbf24', // amber-400
  coinOuter: '#b45309', // amber-700
  
  fuelCan: '#ef4444', // red-500
  fuelCanCap: '#facc15', // yellow-400
  
  cloud: 'rgba(255, 255, 255, 0.8)',
  
  particleDust: '#e5e7eb', // gray-200
  particleSpark: '#fbbf24', // amber-400
  particleSmoke: '#57534e', // stone-600
  
  lampPost: '#475569', // slate-600
  lampLight: '#fef08a', // yellow-200
  lampGlow: 'rgba(253, 224, 71, 0.4)', // yellow-300 with opacity

  // Maps items
  boulder: '#44403c', // stone-700
  boulderDark: '#1c1917', // stone-900
  
  // Nature
  treeTrunk: '#451a03', // amber-950
  treeLeafLight: '#4ade80', // green-400
  treeLeafDark: '#15803d', // green-700
  bushLight: '#a3e635', // lime-400
  bushDark: '#4d7c0f', // lime-700
  
  // Obstacles
  obstacleBox: '#78350f', // amber-900
  obstacleBoxBorder: '#451a03', // amber-950
  
  finishLineCheckered: '#ffffff',
  finishLinePole: '#94a3b8',
};

// Power Boost: approx +30% to speed and acceleration
export const CAR_MODELS: CarModel[] = [
  {
    id: 'red',
    name: 'GT Coupe',
    color: '#b91c1c', 
    bodyColor: '#b91c1c',
    texture: 'striped',
    textureColor2: '#7f1d1d', // red-900
    wheelColor: '#171717',
    speed: 1.2, // was 0.9
    acceleration: 0.026, // was 0.02
    density: 0.004,
    friction: 1.0,
    driveTrain: 'RWD',
    shape: 'coupe',
    width: 170,
    height: 50,
    wheelSize: 30
  },
  {
    id: 'gold',
    name: 'Luxury Sport',
    color: '#eab308', 
    bodyColor: '#eab308',
    texture: 'gradient',
    textureColor2: '#fef08a', // yellow-200
    wheelColor: '#713f12',
    speed: 1.95, // was 1.5
    acceleration: 0.045, // was 0.035
    density: 0.005, 
    friction: 1.5, 
    driveTrain: 'AWD',
    shape: 'supercar',
    width: 180,
    height: 45,
    wheelSize: 30
  },
  {
    id: 'green',
    name: 'Offroad King',
    color: '#059669', 
    bodyColor: '#059669',
    texture: 'checker',
    textureColor2: '#022c22', // emerald-950
    wheelColor: '#064e3b',
    speed: 1.3, // was 1.0
    acceleration: 0.033, // was 0.025
    density: 0.0045, 
    friction: 1.2, 
    driveTrain: 'FWD',
    shape: 'jeep',
    width: 160,
    height: 70,
    wheelSize: 32
  },
  {
    id: 'blue',
    name: 'Track Star',
    color: '#2563eb', 
    bodyColor: '#2563eb',
    texture: 'gradient',
    textureColor2: '#172554', // blue-950
    wheelColor: '#1e3a8a',
    speed: 1.55, // was 1.2
    acceleration: 0.033, // was 0.025
    density: 0.004,
    friction: 1.1,
    driveTrain: 'RWD',
    shape: 'racer',
    width: 190,
    height: 40,
    wheelSize: 28
  },
  {
    id: 'purple',
    name: 'The Van',
    color: '#7c3aed', 
    bodyColor: '#7c3aed',
    texture: 'striped',
    textureColor2: '#4c1d95', // violet-900
    wheelColor: '#4c1d95',
    speed: 1.7, // was 1.3
    acceleration: 0.04, // was 0.03
    density: 0.0035, 
    friction: 1.0,
    driveTrain: 'AWD',
    shape: 'van',
    width: 170,
    height: 80,
    wheelSize: 30
  },
  {
    id: 'pink',
    name: 'Dune Buggy',
    color: '#db2777', 
    bodyColor: '#db2777',
    texture: 'dots',
    textureColor2: '#fce7f3', // pink-100
    wheelColor: '#831843',
    speed: 1.3, // was 1.0
    acceleration: 0.029, // was 0.022
    density: 0.004,
    friction: 1.0,
    driveTrain: 'RWD',
    shape: 'buggy',
    width: 150,
    height: 60,
    wheelSize: 35
  },
  {
    id: 'bike',
    name: 'Moto X',
    color: '#ea580c', 
    bodyColor: '#ea580c',
    texture: 'plain',
    textureColor2: '#7c2d12', // orange-900
    wheelColor: '#1f2937',
    speed: 2.1, // was 1.6
    acceleration: 0.052, // was 0.04
    density: 0.002, 
    friction: 1.5, 
    driveTrain: 'RWD',
    shape: 'bike',
    width: 100,
    height: 50,
    wheelSize: 14 
  },
  // NEW VEHICLES
  {
    id: 'behemoth',
    name: 'The Behemoth',
    color: '#171717', 
    bodyColor: '#262626', // Neutral 800
    texture: 'striped',
    textureColor2: '#000000', 
    wheelColor: '#451a03',
    speed: 1.1,
    acceleration: 0.04, // High torque
    density: 0.006, // Heavy
    friction: 1.8, 
    driveTrain: 'AWD',
    shape: 'truck',
    width: 180,
    height: 90,
    wheelSize: 42 // Huge wheels
  },
  {
    id: 'bus',
    name: 'School Bus',
    color: '#facc15', // Yellow 400
    bodyColor: '#eab308', // Yellow 500
    texture: 'plain',
    textureColor2: '#ca8a04', 
    wheelColor: '#171717',
    speed: 1.2,
    acceleration: 0.035,
    density: 0.005, 
    friction: 1.2,
    driveTrain: 'RWD',
    shape: 'van',
    width: 210, // Long
    height: 75,
    wheelSize: 32
  }
];

export const MAPS: MapConfig[] = [
  {
    id: 'earth',
    name: 'Green Hills',
    description: 'Classic grassy hills. Balanced terrain.',
    backgroundType: 'earth',
    skyColorStart: COLORS.skyStart,
    skyColorEnd: COLORS.skyEnd,
    groundColor: COLORS.ground,
    groundDarkColor: COLORS.groundDark,
    particleColor: COLORS.particleDust,
    configOverrides: {}
  },
  {
    id: 'highway',
    name: 'Desert Highway',
    description: 'Flat asphalt with guardrails. High speed.',
    backgroundType: 'highway',
    skyColorStart: '#f97316', // orange-500
    skyColorEnd: '#fff7ed',   // orange-50
    groundColor: '#334155',   // slate-700 (Asphalt)
    groundDarkColor: '#0f172a', // slate-900
    particleColor: '#1e293b',
    configOverrides: {
      TERRAIN_AMP_1: 0.3, 
      TERRAIN_NOISE_FREQ_1: 0.1, 
      TERRAIN_AMP_2: 0.1,
      FRICTION: 1.5 
    }
  },
  {
    id: 'moon',
    name: 'Moon Base',
    description: 'Low gravity. Craters. Sharp turns.',
    backgroundType: 'moon',
    skyColorStart: '#020617', // slate-950
    skyColorEnd: '#0f172a',   // slate-900
    groundColor: '#64748b',   // slate-500
    groundDarkColor: '#334155', // slate-700
    particleColor: '#94a3b8',
    configOverrides: {
      GRAVITY: 0.5,
      TERRAIN_NOISE_FREQ_1: 0.25,
      TERRAIN_AMP_1: 1.5,
      TERRAIN_NOISE_FREQ_2: 0.8,
      TERRAIN_AMP_2: 0.8,
      TERRAIN_NOISE_FREQ_3: 1.5,
      TERRAIN_AMP_3: 0.2,
      DAY_CYCLE_FRAMES: 9999999,
    }
  },
  {
    id: 'caves',
    name: 'Deep Caves',
    description: 'Dangerous ceiling! Watch your head.',
    backgroundType: 'caves',
    skyColorStart: '#2e1065', // violet-950
    skyColorEnd: '#020617',   // slate-950
    groundColor: '#4b5563',   // gray-600 (Rock)
    groundDarkColor: '#1f2937', // gray-800
    particleColor: '#9ca3af',
    configOverrides: {
        GRAVITY: 1.8,
        TERRAIN_NOISE_FREQ_1: 0.3,
        TERRAIN_AMP_1: 1.2,
        TERRAIN_NOISE_FREQ_2: 0.7,
        TERRAIN_AMP_2: 0.6,
        DAY_CYCLE_FRAMES: 9999999,
    }
  },
  // NEW MAPS
  {
    id: 'mars',
    name: 'Mars Canyon',
    description: 'Dusty red planet. Variable gravity.',
    backgroundType: 'mars',
    skyColorStart: '#7f1d1d', // red-900
    skyColorEnd: '#450a0a',   // red-950
    groundColor: '#c2410c',   // orange-700
    groundDarkColor: '#7c2d12', // orange-900
    particleColor: '#fdba74', // orange-300
    configOverrides: {
        GRAVITY: 1.0, // Lower than earth, higher than moon
        TERRAIN_NOISE_FREQ_1: 0.15,
        TERRAIN_AMP_1: 1.8, // Big hills
        TERRAIN_NOISE_FREQ_2: 0.6,
        TERRAIN_AMP_2: 0.3, // Rocky but smoother overall
        FRICTION: 0.9
    }
  },
  {
    id: 'arctic',
    name: 'Arctic Tundra',
    description: 'Slippery ice and snow. Bring a coat.',
    backgroundType: 'arctic',
    skyColorStart: '#0ea5e9', // sky-500
    skyColorEnd: '#e0f2fe',   // sky-100
    groundColor: '#f1f5f9',   // slate-100 (Snow)
    groundDarkColor: '#cbd5e1', // slate-300
    particleColor: '#e0f2fe', // sky-50
    configOverrides: {
        FRICTION: 0.3, // VERY SLIPPERY
        TERRAIN_NOISE_FREQ_1: 0.12,
        TERRAIN_AMP_1: 0.9,
        TERRAIN_NOISE_FREQ_2: 0.9, // Bumpy ice
        TERRAIN_AMP_2: 0.15,
        GRAVITY: 1.6
    }
  }
];
