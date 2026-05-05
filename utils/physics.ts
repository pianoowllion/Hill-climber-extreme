
import { GameConfig, CarModel, LevelConfig } from '../types';

// We assume Matter is loaded via CDN globally
const Matter = (window as any).Matter;

export interface Decoration {
  x: number;
  y: number;
  angle: number;
  scale: number;
  type: number; 
  // 0-2: Grass, 3: Lamp, 4: Fence, 5: Finish Line Flag
  // 6: Pine Tree, 7: Round Tree, 8: Rock, 9: Bush
  seed: number; // For randomization in drawing
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speedFactor: number; 
  textureId: number;
}

export interface TerrainChunk {
  composite: any;
  pathData: {x: number, y: number}[];
  ceilingPathData?: {x: number, y: number}[]; // New property for ceiling rendering
  decorations: Decoration[];
  coinBodies: any[];
  fuelBodies: any[];
  islandBodies: any[];
  rampBodies: any[];
  obstacleBodies: any[];
  boulderBodies: any[];
  ceilingBodies?: any[]; // New property for ceiling physics
  finishLineBody?: any;
  endX: number; // Added endX property
  endY: number;
  endGlobalIndex: number;
  nextSegmentsSinceFuel: number; 
  id: number;
}

export const createEngine = (config: GameConfig) => {
  const engine = Matter.Engine.create();
  engine.gravity.y = config.GRAVITY;
  
  // High iterations for rigid constraints
  engine.positionIterations = 10;
  engine.velocityIterations = 10;
  
  return engine;
};

export const createCar = (x: number, y: number, carConfig: CarModel, gameConfig: GameConfig) => {
  // Use car specific config if available, fallback to global config
  const CAR_WIDTH = carConfig.width || gameConfig.CAR_WIDTH;
  const CAR_HEIGHT = carConfig.height || gameConfig.CAR_HEIGHT;
  const WHEEL_SIZE = carConfig.wheelSize || gameConfig.WHEEL_SIZE;

  const group = Matter.Body.nextGroup(true);

  // 1. Chassis
  const chassis = Matter.Bodies.rectangle(x, y, CAR_WIDTH, CAR_HEIGHT, {
    collisionFilter: { group: group },
    density: carConfig.density, 
    friction: 0.3,
    label: 'chassis',
    render: { fillStyle: carConfig.bodyColor },
    chamfer: { radius: 15 } 
  });

  // Calculate offsets for vertical alignment
  // Positions the wheel anchor point near the edge of the chassis
  const wheelOffsetX = -CAR_WIDTH / 2 + WHEEL_SIZE;
  const wheelOffsetY = CAR_HEIGHT / 2;

  // 2. Wheels
  const wheelOptions = {
    collisionFilter: { group: group },
    friction: carConfig.friction,       
    frictionStatic: 1.5, 
    density: 0.01,  // Reduced density to minimize wheel inertia/swing     
    restitution: 0.2,    
    render: { fillStyle: 'black' }
  };

  // Align wheels vertically with suspension points to prevent horizontal swing at rest
  const wheelA = Matter.Bodies.circle(x + wheelOffsetX, y + wheelOffsetY, WHEEL_SIZE, {
    ...wheelOptions,
    label: 'wheelBack'
  });

  const wheelB = Matter.Bodies.circle(x - wheelOffsetX, y + wheelOffsetY, WHEEL_SIZE, {
    ...wheelOptions,
    label: 'wheelFront'
  });

  // 3. Suspension
  // Ultra-rigid settings to prevent side-to-side (pendulum) movement
  const suspensionStiffness = 1.0; 
  const suspensionDamping = 0.6;   
  const suspensionLength = 10; // Slightly longer to allow visual springs

  const axelA = Matter.Constraint.create({
    bodyA: chassis,
    bodyB: wheelA,
    pointA: { x: wheelOffsetX, y: wheelOffsetY },
    pointB: { x: 0, y: 0 },
    stiffness: suspensionStiffness,
    damping: suspensionDamping,
    length: suspensionLength,
    render: { visible: false }
  });

  const axelB = Matter.Constraint.create({
    bodyA: chassis,
    bodyB: wheelB,
    pointA: { x: -wheelOffsetX, y: wheelOffsetY },
    pointB: { x: 0, y: 0 },
    stiffness: suspensionStiffness,
    damping: suspensionDamping,
    length: suspensionLength,
    render: { visible: false }
  });

  return Matter.Composite.create({
    bodies: [chassis, wheelA, wheelB],
    constraints: [axelA, axelB],
    label: 'car'
  });
};

export const createWall = (x: number) => {
    return Matter.Bodies.rectangle(x, -1000, 100, 5000, {
        isStatic: true,
        label: 'wall',
        render: { visible: false }
    });
};

/**
 * Calculates the noise/height for a specific index. 
 * Supports different logic based on map type.
 */
export const getTerrainNoise = (globalIndex: number, config: GameConfig, mapType: string = 'earth'): number => {
    const baseHeight = 70;
    
    // Standard Logic
    const nx = globalIndex * config.TERRAIN_NOISE_FREQ_1;
    const nzOsc = Math.sin(nx * 0.2);
    let amp = 0.1;
    if (nzOsc > 0.3) amp = 1.0;
    else if (nzOsc >= -0.3) amp = 0.1 + ((nzOsc+0.3)/0.6)*0.9;
    
    const nPrimary = Math.sin(nx) * config.TERRAIN_AMP_1;
    const nSecondary = Math.cos(globalIndex * config.TERRAIN_NOISE_FREQ_2) * config.TERRAIN_AMP_2;
    const nRumble = Math.sin(globalIndex * config.TERRAIN_NOISE_FREQ_3) * config.TERRAIN_AMP_3;
    
    const difficultyMultiplier = Math.min(2.5, 1 + (globalIndex * 0.001));
    
    // Flat Start Logic
    // We want the first ~2 chunks (approx 4000px / 40 = 100 segments) to be relatively flat.
    // We scale down the noise amplitude significantly in this region.
    const FLAT_ZONE_SEGMENTS = 100; // First 2 chunks
    const TRANSITION_SEGMENTS = 50; // Smooth transition over next 1 chunk
    
    let startDamping = 1.0;
    if (globalIndex < FLAT_ZONE_SEGMENTS) {
        // Keep it "not exactly planned but flat enough" - slight rumble allowed (0.15)
        startDamping = 0.15;
    } else if (globalIndex < FLAT_ZONE_SEGMENTS + TRANSITION_SEGMENTS) {
        // Linear ramp from 0.15 to 1.0
        const progress = (globalIndex - FLAT_ZONE_SEGMENTS) / TRANSITION_SEGMENTS;
        startDamping = 0.15 + (progress * 0.85);
    }

    return (nPrimary + nSecondary + nRumble) * amp * difficultyMultiplier * startDamping * baseHeight;
};

export const generateTerrainChunk = (
    chunkId: number,
    startX: number, 
    startY: number, 
    startGlobalIndex: number, 
    length: number,
    isNight: boolean,
    config: GameConfig,
    mapType: string = 'earth',
    startSegmentsSinceFuel: number = 0,
    levelTargetDistance: number | null = null
): TerrainChunk => {
  const { TERRAIN_SEGMENT_WIDTH, COIN_SIZE, FUEL_CAN_SIZE, LAMP_SPACING } = config;
  const segments = Math.floor(length / TERRAIN_SEGMENT_WIDTH);
  
  const groundDepth = 800; 
  const ceilingDepth = 800; // For caves
  const pathPoints = []; 
  const ceilingPathPoints = [];

  const decorations: Decoration[] = [];
  const coinBodies: any[] = [];
  const fuelBodies: any[] = [];
  const islandBodies: any[] = [];
  const rampBodies: any[] = [];
  const obstacleBodies: any[] = [];
  const boulderBodies: any[] = [];
  const ceilingBodies: any[] = [];
  let finishLineBody = null;

  // Initialize start points
  pathPoints.push({ x: startX, y: startY });
  
  // Ceiling Logic
  const hasCeiling = mapType === 'caves';
  // Cave height gap varies between 350 and 500 based on noise
  const caveBaseGap = 450; 
  let currentCeilingY = startY - caveBaseGap;
  if (hasCeiling) {
      // If continuing from previous chunk, we'd ideally pass the last ceiling Y.
      // For now, we estimate based on floor Y for continuity at chunk borders or accept slight jumps (which Matter handles fine with static bodies)
      ceilingPathPoints.push({ x: startX, y: currentCeilingY });
  }

  let currentX = startX;
  let currentY = startY;
  let globalIndex = startGlobalIndex;
  let lastLampX = startX;
  let lastTreeX = startX;
  let coinStreak = 0;
  let segmentsSinceFuel = startSegmentsSinceFuel;
  
  let finishLineGenerated = false;

  for (let i = 0; i < segments; i++) {
    const segmentWidth = TERRAIN_SEGMENT_WIDTH;
    const prevX = currentX;
    const prevY = currentY;
    const prevCeilingY = currentCeilingY;

    currentX += segmentWidth;
    globalIndex++;
    segmentsSinceFuel++;
    
    // Check if we passed level target
    if (levelTargetDistance !== null && currentX >= (200 + levelTargetDistance) && !finishLineGenerated) {
        // Flatten terrain for finish line
        const noisePrev = getTerrainNoise(globalIndex - 1, config, mapType);
        const noiseCurrent = noisePrev; // Flat
        const dy = -(noiseCurrent - noisePrev);
        currentY = prevY + dy;
        currentCeilingY = prevCeilingY + dy; // Ceiling matches flat floor
        
        // Add finish line object
        finishLineGenerated = true;
        finishLineBody = Matter.Bodies.rectangle(currentX, currentY - 200, 20, 400, {
            isSensor: true,
            isStatic: true,
            label: 'finishLine',
            render: { visible: false }
        });

        // Add visual decoration for finish line
        decorations.push({
            x: currentX,
            y: currentY,
            angle: 0,
            scale: 1,
            type: 5, // Finish Line Type
            seed: 0
        });
    } else {
        const noiseCurrent = getTerrainNoise(globalIndex, config, mapType);
        const noisePrev = getTerrainNoise(globalIndex - 1, config, mapType);
        const dy = -(noiseCurrent - noisePrev); 
        currentY = prevY + dy;
        
        if (hasCeiling) {
            // Ceiling noise is floor noise + some variation
            // Use a different frequency offset for ceiling variation
            const ceilVar = Math.sin(globalIndex * 0.3) * 60;
            const targetGap = caveBaseGap + ceilVar;
            currentCeilingY = currentY - targetGap;
        }
    }

    pathPoints.push({ x: currentX, y: currentY });
    if (hasCeiling) {
        ceilingPathPoints.push({ x: currentX, y: currentCeilingY });
    }

    // --- Analysis for features ---
    const angle = Math.atan2(currentY - prevY, currentX - prevX);
    const slopeFactor = 1 - Math.min(Math.abs(Math.sin(angle)), 0.8);
    const isFlatEnough = slopeFactor > 0.85; 
    let featurePlaced = false;

    // Skip obstacles near finish line
    if (finishLineGenerated) continue;

    // --- Decorations ---
    
    // 1. Grass (Earth Only)
    if (mapType === 'earth') {
        const density = 0.4 * slopeFactor; 
        if (Math.random() < density) {
            const t = Math.random();
            const decoX = prevX + (currentX - prevX) * t;
            const decoY = prevY + (currentY - prevY) * t;

            decorations.push({
                x: decoX,
                y: decoY,
                angle: angle,
                scale: 0.5 + Math.random() * 0.5,
                type: Math.floor(Math.random() * 3), // 0, 1, 2 = Grass/Flowers
                seed: Math.random()
            });
        }
    }

    // 2. Large Vegetation / Rocks / Stalactites
    const canSpawnTree = (currentX - lastTreeX) > 100 && isFlatEnough;
    
    if (canSpawnTree) {
        let spawned = false;
        
        if (mapType === 'earth') {
             if (Math.random() < 0.15) {
                 const type = Math.random() > 0.4 ? (Math.random() > 0.5 ? 6 : 7) : 9;
                 decorations.push({
                     x: currentX, y: currentY, angle: 0, 
                     scale: 0.8 + Math.random() * 0.5, 
                     type, 
                     seed: Math.random()
                 });
                 spawned = true;
             }
        } else if (mapType === 'moon') {
             if (Math.random() < 0.1) {
                 decorations.push({
                     x: currentX, y: currentY, angle: Math.random() * 0.5 - 0.25, 
                     scale: 0.5 + Math.random() * 1.0, 
                     type: 8, 
                     seed: Math.random()
                 });
                 spawned = true;
             }
        } else if (mapType === 'highway') {
            if (Math.random() < 0.05) {
                 decorations.push({
                     x: currentX, y: currentY, angle: 0, 
                     scale: 0.6 + Math.random() * 0.4, 
                     type: 9, 
                     seed: Math.random()
                 });
                 spawned = true;
             }
        } else if (mapType === 'caves') {
            // Stalactites (hanging from ceiling) - Using Rock Type 8 but inverted
            if (Math.random() < 0.2) {
                 // Floor Rocks
                 decorations.push({
                     x: currentX, y: currentY, angle: Math.random() * 0.5 - 0.25, 
                     scale: 0.6 + Math.random() * 0.8, 
                     type: 8, 
                     seed: Math.random()
                 });
                 spawned = true;
            }
            if (Math.random() < 0.2) {
                 // Ceiling Rocks (Stalactites)
                 // Type 10 = Stalactite (Custom ID for renderer)
                 decorations.push({
                     x: currentX, y: currentCeilingY, angle: Math.PI + (Math.random() * 0.4 - 0.2), 
                     scale: 0.8 + Math.random() * 1.2, 
                     type: 10, 
                     seed: Math.random()
                 });
            }
        } else if (mapType === 'mars') {
             // Mars: Rocks only
             if (Math.random() < 0.15) {
                 decorations.push({
                     x: currentX, y: currentY, angle: Math.random() * 0.5 - 0.25, 
                     scale: 0.5 + Math.random() * 1.2, 
                     type: 8, // Rock
                     seed: Math.random()
                 });
                 spawned = true;
             }
        } else if (mapType === 'arctic') {
             // Arctic: Pine trees (snowy) + Rocks
             if (Math.random() < 0.12) {
                 // 80% Trees, 20% Rocks
                 const type = Math.random() > 0.2 ? 6 : 8; // 6=Pine, 8=Rock
                 decorations.push({
                     x: currentX, y: currentY, angle: 0, 
                     scale: 0.7 + Math.random() * 0.6, 
                     type, 
                     seed: Math.random()
                 });
                 spawned = true;
             }
        }

        if (spawned) lastTreeX = currentX;
    }

    // 3. Lamps
    const lampChance = isNight || mapType === 'highway';
    // No lamps on Mars or Arctic typically, but maybe Arctic outpost vibe? Let's exclude for now.
    const hasLamps = mapType !== 'caves' && mapType !== 'mars' && mapType !== 'arctic';
    
    if (lampChance && hasLamps && (currentX - lastLampX) > LAMP_SPACING) {
        decorations.push({
            x: currentX,
            y: currentY,
            angle: angle,
            scale: 1.0,
            type: 3,
            seed: 0
        });
        lastLampX = currentX;
    }

    // 4. Fences (Highway)
    if (mapType === 'highway') {
        decorations.push({
            x: prevX,
            y: prevY,
            angle: angle,
            scale: 1.0,
            type: 4,
            seed: 0
        });
    }

    // --- Collectibles (Fuel & Coins) ---
    const forceFuel = segmentsSinceFuel >= 125; 
    const canSpawnFuel = (segmentsSinceFuel > 80 && isFlatEnough) || forceFuel;

    let fuelSpawnedHere = false;

    if (canSpawnFuel) {
        if (forceFuel || Math.random() < 0.1) {
             const cx = prevX + (currentX - prevX) * 0.5;
            const cy = prevY + (currentY - prevY) * 0.5 - 50;
            
            const fuel = Matter.Bodies.rectangle(cx, cy, FUEL_CAN_SIZE * 0.8, FUEL_CAN_SIZE, {
                isSensor: true,
                isStatic: true,
                label: 'fuel',
                angle: 0,
                render: { visible: false }
            });
            fuelBodies.push(fuel);
            segmentsSinceFuel = 0;
            coinStreak = 0; 
            fuelSpawnedHere = true;
        }
    }
    
    if (!fuelSpawnedHere && !featurePlaced) {
        let placeCoin = false;
        if (coinStreak > 0) {
            if (isFlatEnough) {
                placeCoin = true;
                coinStreak--;
            } else {
                coinStreak = 0;
            }
        } else {
            if (Math.random() < 0.05 && isFlatEnough) {
                coinStreak = 3 + Math.floor(Math.random() * 6);
                placeCoin = true;
                coinStreak--;
            }
        }

        if (placeCoin) {
            const cx = prevX + (currentX - prevX) * 0.5;
            const cy = prevY + (currentY - prevY) * 0.5 - 50;
            const coin = Matter.Bodies.circle(cx, cy, COIN_SIZE, {
                isSensor: true,
                isStatic: true,
                label: 'coin',
                render: { visible: false }
            });
            coinBodies.push(coin);
        }
    }
  }

  // Create Physics Ground
  const groundParts = [];
  for (let i = 0; i < pathPoints.length - 1; i++) {
     const p1 = pathPoints[i];
     const p2 = pathPoints[i+1];
     const vertices = [
         { x: p1.x, y: p1.y },
         { x: p2.x, y: p2.y },
         { x: p2.x, y: p2.y + groundDepth },
         { x: p1.x, y: p1.y + groundDepth }
     ];
     const center = Matter.Vertices.centre(vertices);
     const body = Matter.Bodies.fromVertices(center.x, center.y, [vertices], {
         isStatic: true,
         friction: config.FRICTION || 1.0, 
         frictionStatic: config.FRICTION || 1.0,
         label: 'ground',
     });
     if (body) groundParts.push(body);
  }

  // Create Physics Ceiling (if caves)
  if (hasCeiling) {
      for (let i = 0; i < ceilingPathPoints.length - 1; i++) {
        const p1 = ceilingPathPoints[i];
        const p2 = ceilingPathPoints[i+1];
        // Vertices go UP from the path point
        const vertices = [
            { x: p1.x, y: p1.y },
            { x: p2.x, y: p2.y },
            { x: p2.x, y: p2.y - ceilingDepth },
            { x: p1.x, y: p1.y - ceilingDepth }
        ];
        const center = Matter.Vertices.centre(vertices);
        const body = Matter.Bodies.fromVertices(center.x, center.y, [vertices], {
            isStatic: true,
            friction: 0.2, // Smoother ceiling sliding if you hit it
            label: 'ceiling',
        });
        if (body) ceilingBodies.push(body);
     }
  }

  // Combine all bodies into composite
  const allBodies = [
      ...groundParts, 
      ...ceilingBodies,
      ...coinBodies, 
      ...fuelBodies, 
      ...islandBodies, 
      ...rampBodies, 
      ...obstacleBodies, 
      ...boulderBodies,
      ...(finishLineBody ? [finishLineBody] : [])
  ];

  return { 
      composite: Matter.Composite.create({ bodies: allBodies }), 
      pathData: pathPoints,
      ceilingPathData: hasCeiling ? ceilingPathPoints : undefined,
      decorations,
      coinBodies,
      fuelBodies,
      islandBodies,
      rampBodies,
      obstacleBodies,
      boulderBodies,
      ceilingBodies,
      finishLineBody,
      endX: currentX, // Return the end X coordinate
      endY: currentY,
      endGlobalIndex: globalIndex,
      nextSegmentsSinceFuel: segmentsSinceFuel, 
      id: chunkId
  };
};

export const generateClouds = (startX: number, length: number): Cloud[] => {
    const clouds: Cloud[] = [];
    const numClouds = Math.floor(length / 300); // More clouds
    
    for (let i = 0; i < numClouds; i++) {
        const x = startX + (Math.random() * length);
        // Adjusted Y range: roughly -600 to -150 to be visible but above terrain
        const y = (Math.random() * -450) - 150; 
        
        clouds.push({
            x,
            y,
            scale: 0.8 + Math.random() * 1.5,
            speedFactor: 0.05 + Math.random() * 0.2, 
            textureId: Math.floor(Math.random() * 3)
        });
    }
    return clouds;
};
