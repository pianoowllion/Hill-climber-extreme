
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS } from '../constants';
import { GameConfig, CarModel, MapConfig, GameMode, LevelConfig } from '../types';
import { createEngine, createCar, generateTerrainChunk, generateClouds, createWall, TerrainChunk, Cloud, Decoration } from '../utils/physics';
import { SoundManager } from '../utils/audio';
import SettingsModal from './SettingsModal';

const Matter = (window as any).Matter;

interface GameProps {
  mode: GameMode;
  levelConfig?: LevelConfig;
  onGameOver: (distance: number, coins: number) => void;
  onLevelComplete: (coins: number) => void;
  selectedCar: CarModel;
  selectedMap: MapConfig;
  config: GameConfig;
  onUpdateConfig: (key: keyof GameConfig, value: any) => void;
  onResetConfig: () => void;
  onExit: () => void;
  onRestart: () => void;
  isMenuBackground?: boolean;
  onReady?: () => void;
}

interface Particle {
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; active: boolean;
    type: 'dust' | 'spark' | 'explosion' | 'smoke';
}

interface Popup {
    id: number;
    text: string;
    subText: string;
    type: 'flip' | 'air';
    amount: number;
}

const Game: React.FC<GameProps> = ({ mode, levelConfig, onGameOver, onLevelComplete, selectedCar, selectedMap, config, onUpdateConfig, onResetConfig, onExit, onRestart, isMenuBackground = false, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null); // New ref for the 16:9 wrapper
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const engineRef = useRef<any>(null);
  const carRef = useRef<any>(null);
  const soundManagerRef = useRef<SoundManager | null>(null);
  
  // Game Logic Refs
  const chunksRef = useRef<TerrainChunk[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const collectedCoinIdsRef = useRef<Set<number>>(new Set());
  const collectedFuelIdsRef = useRef<Set<number>>(new Set());
  const particlesRef = useRef<Particle[]>([]);
  const lastChunkDataRef = useRef({ endX: 0, endY: 200, globalIndex: 0, segmentsSinceFuel: 0 });
  
  const fuelRef = useRef(config.MAX_FUEL);
  const wheelGroundContacts = useRef(0);
  const isOutOfFuelRef = useRef(false);
  const gameStateRef = useRef({ distance: 0, coins: 0, isGameOver: false, keys: { left: false, right: false } });
  
  // Stunt Logic Refs - Updated for continuous flip tracking
  const stuntMetricsRef = useRef({
    lastFlipAngle: 0,
    airStartTime: 0,
    initialized: false
  });
  
  // Visual state
  const cameraZoomRef = useRef(1.0);
  const cameraPosRef = useRef({ x: 0, y: 0 });
  
  // Pause & Settings State
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);

  const [notification, setNotification] = useState<{text: string, subText?: string, id: number} | null>(null);
  const patternsRef = useRef<{[key: string]: CanvasPattern | null}>({});
  const starsRef = useRef<{x: number, y: number, r: number, opacity: number}[]>([]);

  // FPS Logic
  const lastFpsTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const hudFpsRef = useRef<HTMLDivElement>(null);

  // HUD Refs
  const hudDistanceRef = useRef<HTMLDivElement>(null);
  const hudCoinsRef = useRef<HTMLDivElement>(null);
  const hudFuelBarRef = useRef<HTMLDivElement>(null);

  // Setup Stars for Moon or Mars
  useEffect(() => {
    if (selectedMap.backgroundType === 'moon' || selectedMap.backgroundType === 'mars') {
        const s = [];
        for(let i=0; i<150; i++) {
            s.push({ x: Math.random() * 2000, y: Math.random() * 1000 - 500, r: Math.random() * 2, opacity: Math.random() });
        }
        starsRef.current = s;
    } else {
        starsRef.current = [];
    }
  }, [selectedMap]);

  const addChunk = useCallback((startX: number) => {
    const { endY, globalIndex, segmentsSinceFuel } = lastChunkDataRef.current;
    const length = config.CHUNK_SIZE;
    const chunkId = Math.floor(startX / length);
    
    const newChunk = generateTerrainChunk(
        chunkId, startX, endY, globalIndex, length, false, config, selectedMap.backgroundType, segmentsSinceFuel,
        mode === 'LEVELS' && levelConfig ? levelConfig.distance : null
    );
    
    if (engineRef.current) Matter.World.add(engineRef.current.world, newChunk.composite);
    
    if (selectedMap.backgroundType !== 'moon' && selectedMap.backgroundType !== 'mars') {
        const newClouds = generateClouds(startX, length);
        cloudsRef.current = [...cloudsRef.current, ...newClouds];
    }
    
    lastChunkDataRef.current = {
        endX: startX + length,
        endY: newChunk.endY,
        globalIndex: newChunk.endGlobalIndex,
        segmentsSinceFuel: newChunk.nextSegmentsSinceFuel
    };
    
    chunksRef.current.push(newChunk);
    
    // Cleanup old chunks and clouds to prevent memory leak
    if (chunksRef.current.length > 5) {
        const oldChunk = chunksRef.current.shift();
        if (oldChunk && engineRef.current) {
             Matter.Composite.remove(engineRef.current.world, oldChunk.composite);
        }
    }
    if (cloudsRef.current.length > 50) {
        cloudsRef.current = cloudsRef.current.slice(cloudsRef.current.length - 40);
    }
  }, [config, selectedMap.backgroundType, mode, levelConfig]);

  const handleResize = useCallback(() => {
    if (canvasRef.current && containerRef.current && gameAreaRef.current) {
        const container = containerRef.current;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        
        // Enforce 16:9 Aspect Ratio
        const targetRatio = 16 / 9;
        let w, h;
        
        if (cw / ch > targetRatio) {
            // Container is wider than 16:9, height is strict
            h = ch;
            w = ch * targetRatio;
        } else {
            // Container is taller than 16:9, width is strict
            w = cw;
            h = cw / targetRatio;
        }

        const gameArea = gameAreaRef.current;
        gameArea.style.width = `${w}px`;
        gameArea.style.height = `${h}px`;

        const canvas = canvasRef.current;
        // Internal render resolution
        canvas.width = w * config.RESOLUTION;
        canvas.height = h * config.RESOLUTION;
        
        patternsRef.current = {}; 
    }
  }, [config.RESOLUTION]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Initialization Sequence
  useEffect(() => {
    if (!isMenuBackground) soundManagerRef.current = new SoundManager();
    const engine = createEngine(config);
    engineRef.current = engine;
    const car = createCar(200, -100, selectedCar, config); 
    carRef.current = car;
    Matter.World.add(engine.world, [car, createWall(-1000)]);

    // Reset loop state
    lastChunkDataRef.current = { endX: 0, endY: 200, globalIndex: 0, segmentsSinceFuel: 0 };
    chunksRef.current = [];
    cloudsRef.current = [];
    collectedCoinIdsRef.current = new Set();
    collectedFuelIdsRef.current = new Set();
    fuelRef.current = config.MAX_FUEL;
    isOutOfFuelRef.current = false;
    gameStateRef.current.isGameOver = false;
    gameStateRef.current.distance = 0;
    gameStateRef.current.coins = 0;
    stuntMetricsRef.current = { lastFlipAngle: 0, airStartTime: 0, initialized: false };
    pausedRef.current = false;
    setIsPaused(false);
    setIsSettingsOpen(false);
    setPopups([]);

    let currentGenX = 0;
    const buffer = isMenuBackground ? 4000 : config.INITIAL_BUFFER_DISTANCE;
    while (currentGenX < buffer) {
        addChunk(currentGenX);
        currentGenX += config.CHUNK_SIZE;
    }

    particlesRef.current = Array.from({ length: config.PARTICLE_POOL_SIZE }).map(() => ({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, active: false, type: 'dust'
    }));

    Matter.Events.on(engine, 'collisionStart', (event: any) => {
        event.pairs.forEach((pair: any) => {
            const { bodyA, bodyB } = pair;
            const isWheel = (b: any) => b.label === 'wheelBack' || b.label === 'wheelFront';
            const isGround = (b: any) => b.label === 'ground' || b.label === 'obstacle';
            
            if ((isWheel(bodyA) && isGround(bodyB)) || (isWheel(bodyB) && isGround(bodyA))) {
                wheelGroundContacts.current++;
                const w = isWheel(bodyA) ? bodyA : bodyB;
                const speed = Matter.Vector.magnitude(w.velocity);
                if (speed > 5) spawnParticles(w.position.x, w.position.y + 15, 2, speed > 10 ? 'spark' : 'dust');
            }

            // CRASH / GAME OVER LOGIC
            // Detect when middle of upper body hits something solid
            if (!isMenuBackground) {
                const chassis = bodyA.label === 'chassis' ? bodyA : bodyB.label === 'chassis' ? bodyB : null;
                const other = chassis === bodyA ? bodyB : bodyA;
                
                const solids = ['ground', 'ceiling', 'obstacle', 'wall', 'boulder'];

                if (chassis && solids.includes(other.label)) {
                     const contacts = pair.collision?.supports || [];
                     const cWidth = selectedCar.width || config.CAR_WIDTH;
                     const cHeight = selectedCar.height || config.CAR_HEIGHT;
                     
                     let hitRoof = false;
                     
                     for (const c of contacts) {
                         // Convert contact to chassis local space
                         const dx = c.x - chassis.position.x;
                         const dy = c.y - chassis.position.y;
                         
                         // Rotate by -chassis.angle
                         const cos = Math.cos(-chassis.angle);
                         const sin = Math.sin(-chassis.angle);
                         const lx = dx * cos - dy * sin;
                         const ly = dx * sin + dy * cos;
                         
                         // Check Bounds: 
                         // "Middle" = Center 50% of width
                         // "Upper Body" = Top ~20% of height (local Y is negative at top)
                         const topThreshold = -cHeight * 0.35; 
                         const centerMargin = cWidth * 0.25; 
                         
                         if (ly < topThreshold && Math.abs(lx) < centerMargin) {
                             hitRoof = true;
                             break;
                         }
                     }
                     
                     if (hitRoof && !gameStateRef.current.isGameOver) {
                        gameStateRef.current.isGameOver = true;
                        soundManagerRef.current?.stopContinuous();
                        onGameOver(gameStateRef.current.distance, gameStateRef.current.coins);
                     }
                }
            }

            let item = null;
            if (['chassis', 'wheelBack', 'wheelFront'].includes(bodyA.label) && ['coin', 'fuel', 'finishLine'].includes(bodyB.label)) item = bodyB;
            if (['chassis', 'wheelBack', 'wheelFront'].includes(bodyB.label) && ['coin', 'fuel', 'finishLine'].includes(bodyA.label)) item = bodyA;

            if (item && !isMenuBackground && !gameStateRef.current.isGameOver) {
                if (item.label === 'finishLine') {
                    gameStateRef.current.isGameOver = true;
                    onLevelComplete(gameStateRef.current.coins);
                } else if (!collectedCoinIdsRef.current.has(item.id) && !collectedFuelIdsRef.current.has(item.id)) {
                    if (item.label === 'coin') {
                        collectedCoinIdsRef.current.add(item.id);
                        gameStateRef.current.coins += config.COIN_VALUE;
                        soundManagerRef.current?.playCoinSound();
                        Matter.World.remove(engine.world, item);
                    } else if (item.label === 'fuel') {
                        collectedFuelIdsRef.current.add(item.id);
                        fuelRef.current = Math.min(config.MAX_FUEL, fuelRef.current + config.FUEL_CAN_VALUE);
                        isOutOfFuelRef.current = false;
                        setNotification({ text: "FUEL!", id: Date.now() });
                        setTimeout(() => setNotification(null), 1500);
                        Matter.World.remove(engine.world, item);
                    }
                }
            }
        });
    });

    Matter.Events.on(engine, 'collisionEnd', (event: any) => {
        event.pairs.forEach((pair: any) => {
            const isWheel = (b: any) => b.label === 'wheelBack' || b.label === 'wheelFront';
            const isGround = (b: any) => b.label === 'ground' || b.label === 'obstacle';
            if ((isWheel(pair.bodyA) && isGround(pair.bodyB)) || (isWheel(pair.bodyB) && isGround(pair.bodyA))) {
                wheelGroundContacts.current = Math.max(0, wheelGroundContacts.current - 1);
            }
        });
    });

    // Notify parent that we are ready to start playing
    if (onReady) onReady();
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        Matter.Engine.clear(engine);
        if (soundManagerRef.current) soundManagerRef.current.stopContinuous();
    };
  }, [addChunk, selectedCar, onGameOver, onLevelComplete, config, isMenuBackground, onReady]);

  const handleResume = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
    setIsSettingsOpen(false);
  }, []);

  const triggerPopup = (text: string, subText: string, type: 'flip' | 'air', amount: number) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, text, subText, type, amount }]);
    // Use sound from manager
    soundManagerRef.current?.playCoinSound();
    // Auto remove
    setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== id));
    }, 2500);
  };

  const spawnParticles = (x: number, y: number, count: number, type: 'dust' | 'spark' | 'explosion' | 'smoke') => {
      let spawned = 0;
      for (let p of particlesRef.current) {
          if (spawned >= count) break;
          if (!p.active) {
              p.active = true; p.x = x; p.y = y; p.type = type;
              p.maxLife = config.PARTICLE_LIFETIME; p.life = p.maxLife;
              if (type === 'smoke') {
                  p.vx = (Math.random() - 0.5) * 2 - 2; // Smoke blows back
                  p.vy = (Math.random() - 0.5) * 2;
                  p.maxLife = 60;
                  p.life = 60;
              } else {
                  p.vx = (Math.random() - 0.5) * 5; 
                  p.vy = (Math.random() - 0.5) * 5;
              }
              spawned++;
          }
      }
  };

  const getPattern = (ctx: CanvasRenderingContext2D, type: string, color1: string, color2: string) => {
      const key = `${type}-${color1}-${color2}`;
      if (patternsRef.current[key]) return patternsRef.current[key];
      const pCanvas = document.createElement('canvas');
      const pCtx = pCanvas.getContext('2d')!;
      pCanvas.width = 40; pCanvas.height = 40;
      if (type === 'ground') {
          // Noise texture
          pCtx.fillStyle = color1; pCtx.fillRect(0,0,40,40);
          pCtx.fillStyle = color2; 
          for(let i=0; i<30; i++) {
              pCtx.globalAlpha = 0.1 + Math.random() * 0.2;
              pCtx.beginPath(); 
              pCtx.arc(Math.random()*40, Math.random()*40, 1 + Math.random()*2, 0, Math.PI*2);
              pCtx.fill();
          }
      } else if (type === 'striped') {
          pCanvas.width = 20; pCtx.fillStyle = color1; pCtx.fillRect(0,0,20,40);
          pCtx.fillStyle = color2; pCtx.fillRect(0,0,10,40);
      } else if (type === 'checker') {
          pCanvas.width = 20; pCanvas.height = 20;
          pCtx.fillStyle = color1; pCtx.fillRect(0,0,20,20);
          pCtx.fillStyle = color2; pCtx.fillRect(0,0,10,10); pCtx.fillRect(10,10,10,10);
      } else if (type === 'dots') {
          pCanvas.width = 10; pCanvas.height = 10;
          pCtx.fillStyle = color1; pCtx.fillRect(0,0,10,10);
          pCtx.fillStyle = color2; pCtx.beginPath(); pCtx.arc(5,5,2,0,Math.PI*2); pCtx.fill();
      } else if (type === 'gradient') {
          const g = pCtx.createLinearGradient(0,0,0,40);
          g.addColorStop(0, color2);
          g.addColorStop(1, color1);
          pCtx.fillStyle = g;
          pCtx.fillRect(0,0,40,40);
      }
      const pattern = ctx.createPattern(pCanvas, 'repeat');
      patternsRef.current[key] = pattern;
      return pattern;
  };

  const drawDriver = (ctx: CanvasRenderingContext2D, car: CarModel, cw: number, ch: number, isGameOver: boolean) => {
      ctx.save();
      // Position driver rough center/top of car
      let dx = 0;
      let dy = -ch * 0.55;
      
      // Adjust per car shape for better fit
      if (car.shape === 'bike') { dx = -cw * 0.1; dy = -ch * 0.9; }
      else if (car.shape === 'jeep') { dx = -cw * 0.1; dy = -ch * 0.7; }
      else if (car.shape === 'buggy') { dx = 0; dy = -ch * 0.6; }
      else if (car.shape === 'racer') { dx = -cw * 0.1; dy = -ch * 0.4; }
      else if (car.shape === 'van') { dx = -cw * 0.25; dy = -ch * 0.6; }
      else if (car.shape === 'truck') { dx = -cw * 0.3; dy = -ch * 0.8; }

      ctx.translate(dx, dy);

      // Head
      ctx.fillStyle = '#fcd34d'; // Skin tone (amber-300)
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();

      // Helmet (Back half)
      if (!isGameOver) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, -2, 13, Math.PI * 0.8, Math.PI * 2.2); ctx.fill();
        // Stripe on helmet
        ctx.fillStyle = selectedCar.color;
        ctx.beginPath(); ctx.arc(0, -2, 13, Math.PI * 1.2, Math.PI * 1.8); ctx.fill();
      }

      // Face / Expressions
      ctx.fillStyle = '#000';
      if (isGameOver) {
          // X Eyes for Stunned
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath(); 
          // Left Eye
          ctx.moveTo(-7, -4); ctx.lineTo(-3, 0); ctx.moveTo(-3, -4); ctx.lineTo(-7, 0);
          // Right Eye
          ctx.moveTo(3, -4); ctx.lineTo(7, 0); ctx.moveTo(7, -4); ctx.lineTo(3, 0);
          ctx.stroke();

          // Open Mouth (O)
          ctx.beginPath(); ctx.arc(0, 6, 4, 0, Math.PI*2); ctx.stroke();
      } else {
          // Sunglasses
          ctx.fillStyle = '#111';
          ctx.fillRect(-8, -3, 16, 5);
          // Simple smile
          ctx.beginPath(); ctx.arc(0, 2, 6, 0.2, Math.PI - 0.2); ctx.stroke();
      }

      ctx.restore();
  };

  const drawChassisPath = (ctx: CanvasRenderingContext2D, car: CarModel, cw: number, ch: number, wr: number) => {
      ctx.beginPath();
      const halfW = cw / 2;
      const halfH = ch / 2;
      
      const rearWheelX = -halfW + wr;
      const frontWheelX = halfW - wr;
      const wellR = wr + 4;

      if (car.shape === 'bike') {
          // Custom path for bike frame without wheel wells
          ctx.moveTo(-halfW * 0.5, halfH);
          ctx.lineTo(halfW * 0.5, halfH);
          ctx.lineTo(halfW * 0.3, 0); 
          ctx.lineTo(halfW * 0.4, -halfH * 0.4); 
          ctx.lineTo(0, -halfH * 0.7); 
          ctx.lineTo(-halfW * 0.5, 0);
          ctx.closePath();
          return;
      }

      // Standard Car Path with Wheel Wells
      ctx.moveTo(-halfW, halfH); 
      ctx.arc(rearWheelX, halfH, wellR, Math.PI, 0); 
      ctx.arc(frontWheelX, halfH, wellR, Math.PI, 0);
      ctx.lineTo(halfW, halfH);

      if (car.shape === 'coupe' || !car.shape) {
          ctx.lineTo(halfW * 1.1, 0);
          ctx.quadraticCurveTo(halfW * 0.8, -halfH * 0.7, halfW * 0.1, -halfH * 0.9);
          ctx.lineTo(-halfW * 0.4, -halfH * 0.9);
          ctx.quadraticCurveTo(-halfW, -halfH * 0.9, -halfW, -halfH * 0.2);
      } else if (car.shape === 'jeep') {
          ctx.lineTo(halfW * 1.1, halfH); ctx.lineTo(halfW * 1.1, -halfH * 0.2); ctx.lineTo(halfW * 0.6, -halfH * 0.2);
          ctx.lineTo(halfW * 0.6, -halfH * 1.6); ctx.lineTo(-halfW * 0.5, -halfH * 1.6); ctx.lineTo(-halfW * 0.5, -halfH * 0.5);
          ctx.lineTo(-halfW * 0.9, -halfH * 0.5);
      } else if (car.shape === 'racer') {
          ctx.lineTo(halfW * 1.5, halfH * 0.3); ctx.quadraticCurveTo(halfW * 1.0, -halfH * 0.3, halfW * 0.3, -halfH * 0.5);
          ctx.lineTo(-halfW * 0.5, -halfH * 0.5); ctx.lineTo(-halfW * 1.2, -halfH * 0.3); ctx.lineTo(-halfW * 1.2, halfH * 0.2);
      } else if (car.shape === 'buggy') {
          ctx.lineTo(halfW * 0.9, halfH * 0.5); ctx.lineTo(halfW * 1.1, 0); ctx.lineTo(halfW * 0.9, 0); 
          ctx.lineTo(halfW * 0.4, -halfH * 1.4); ctx.lineTo(-halfW * 0.5, -halfH * 1.4); ctx.lineTo(-halfW * 0.7, 0);
      } else if (car.shape === 'van') {
          ctx.lineTo(halfW * 1.1, halfH * 0.5); ctx.quadraticCurveTo(halfW * 1.1, -halfH * 1.2, halfW * 0.7, -halfH * 1.3);
          ctx.lineTo(-halfW * 0.9, -halfH * 1.3); ctx.lineTo(-halfW * 0.9, halfH * 0.5);
      } else if (car.shape === 'supercar') {
          ctx.lineTo(halfW * 1.45, halfH * 0.5); ctx.quadraticCurveTo(halfW * 1.0, -halfH * 0.4, halfW * 0.1, -halfH * 0.6);
          ctx.lineTo(-halfW * 0.5, -halfH * 0.6); ctx.lineTo(-halfW * 1.1, 0); ctx.lineTo(-halfW * 1.1, halfH * 0.5);
      } else if (car.shape === 'truck') {
          // Big blocky shape
          ctx.lineTo(halfW * 1.1, halfH); 
          ctx.lineTo(halfW * 1.1, -halfH * 0.5); 
          ctx.lineTo(halfW * 0.4, -halfH * 0.5); // Hood
          ctx.lineTo(halfW * 0.4, -halfH * 1.5); // Cab top front
          ctx.lineTo(-halfW * 1.0, -halfH * 1.5); // Cab top back
          ctx.lineTo(-halfW * 1.0, halfH * 0.5);
      }
      ctx.closePath();
  };

  const drawCloud = (ctx: CanvasRenderingContext2D, c: Cloud) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.fillStyle = COLORS.cloud;
      
      // Simple cloud shapes based on textureId
      ctx.beginPath();
      if (c.textureId === 0) {
          ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.arc(25, -10, 35, 0, Math.PI * 2);
          ctx.arc(50, 0, 30, 0, Math.PI * 2);
      } else if (c.textureId === 1) {
          ctx.arc(0, 0, 25, 0, Math.PI * 2);
          ctx.arc(20, -15, 30, 0, Math.PI * 2);
          ctx.arc(40, -5, 25, 0, Math.PI * 2);
          ctx.arc(60, 0, 20, 0, Math.PI * 2);
      } else {
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.arc(15, -10, 25, 0, Math.PI * 2);
          ctx.arc(30, 0, 20, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
  };

  const drawTree = (ctx: CanvasRenderingContext2D, type: number, seed: number) => {
      ctx.fillStyle = COLORS.treeTrunk;
      // Trunk
      ctx.fillRect(-5, -40, 10, 40);
      
      // Leaves
      const leafColor = type === 6 ? COLORS.treeLeafDark : COLORS.treeLeafLight;
      ctx.fillStyle = leafColor;
      
      // Snow effect
      const drawSnow = selectedMap.backgroundType === 'arctic';
      const snowColor = '#f0f9ff';

      if (type === 6) { // Pine
           ctx.beginPath();
           ctx.moveTo(-20, -30); ctx.lineTo(0, -90); ctx.lineTo(20, -30);
           ctx.fill();
           if (drawSnow) {
               ctx.fillStyle = snowColor;
               ctx.beginPath(); ctx.moveTo(-10, -60); ctx.lineTo(0, -90); ctx.lineTo(10, -60); ctx.fill();
               ctx.fillStyle = leafColor;
           }
           
           ctx.beginPath();
           ctx.moveTo(-25, -10); ctx.lineTo(0, -60); ctx.lineTo(25, -10);
           ctx.fill();
           if (drawSnow) {
               ctx.fillStyle = snowColor;
               ctx.beginPath(); ctx.moveTo(-12, -35); ctx.lineTo(0, -60); ctx.lineTo(12, -35); ctx.fill();
           }

      } else { // Round
           ctx.beginPath();
           ctx.arc(0, -50, 25, 0, Math.PI*2);
           ctx.fill();
           ctx.beginPath();
           ctx.arc(-15, -40, 15, 0, Math.PI*2);
           ctx.arc(15, -40, 15, 0, Math.PI*2);
           ctx.arc(0, -70, 20, 0, Math.PI*2);
           ctx.fill();
           
           if (drawSnow) {
               ctx.fillStyle = snowColor;
               ctx.beginPath(); ctx.arc(0, -75, 15, 0, Math.PI*2); ctx.fill();
           }
      }
  };

  const drawRock = (ctx: CanvasRenderingContext2D, seed: number) => {
      ctx.fillStyle = COLORS.boulder;
      ctx.beginPath();
      // Irregular shape
      ctx.moveTo(-15, 0);
      ctx.lineTo(-10 - seed*5, -15 - seed*5);
      ctx.lineTo(0, -20 - seed*5);
      ctx.lineTo(10 + seed*5, -15 - seed*5);
      ctx.lineTo(15, 0);
      ctx.fill();
  };

  const drawBush = (ctx: CanvasRenderingContext2D, seed: number) => {
      ctx.fillStyle = seed > 0.5 ? COLORS.bushLight : COLORS.bushDark;
      ctx.beginPath();
      ctx.arc(0, 0, 15, Math.PI, 0);
      ctx.arc(-10, 0, 10, Math.PI, 0);
      ctx.arc(10, 0, 10, Math.PI, 0);
      ctx.fill();
  };

  const drawSuspension = (ctx: CanvasRenderingContext2D, chassis: any, wheel: any, offsetX: number, offsetY: number) => {
      // Calculate world position of attachment point on chassis
      // We need to transform local offset to world space
      const cos = Math.cos(chassis.angle);
      const sin = Math.sin(chassis.angle);
      
      // World position of the mount point on chassis
      const mountX = chassis.position.x + (offsetX * cos - offsetY * sin);
      const mountY = chassis.position.y + (offsetX * sin + offsetY * cos);
      
      // Draw Spring/Shock
      ctx.beginPath();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 4;
      ctx.moveTo(mountX, mountY);
      ctx.lineTo(wheel.position.x, wheel.position.y);
      ctx.stroke();

      // Draw Coil (zigzag)
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      const dx = wheel.position.x - mountX;
      const dy = wheel.position.y - mountY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      
      ctx.save();
      ctx.translate(mountX, mountY);
      ctx.rotate(angle);
      
      ctx.moveTo(0, 0);
      for(let i=0; i<dist; i+=5) {
          ctx.lineTo(i, (i%10 === 0 ? -3 : 3));
      }
      ctx.lineTo(dist, 0);
      ctx.stroke();
      ctx.restore();
  };

  const drawWheel = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Tire
      ctx.fillStyle = '#171717';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI*2);
      ctx.fill();
      
      // Rim
      ctx.fillStyle = COLORS.carRim; 
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI*2);
      ctx.fill();
      
      // Spokes
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-radius*0.6, 0); ctx.lineTo(radius*0.6, 0);
      ctx.moveTo(0, -radius*0.6); ctx.lineTo(0, radius*0.6);
      ctx.stroke();

      // Color Detail
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI*2);
      ctx.fill();
      
      ctx.restore();
  };

  const drawCarDetails = (ctx: CanvasRenderingContext2D, car: CarModel, cw: number, ch: number, isGameOver: boolean) => {
      // Windows
      ctx.fillStyle = '#38bdf8'; // Sky blue tint
      ctx.globalAlpha = 0.6;
      if (car.shape === 'coupe' || !car.shape) {
          ctx.beginPath();
          ctx.moveTo(cw*0.1, -ch*0.8);
          ctx.lineTo(cw*0.4, -ch*0.8);
          ctx.lineTo(cw*0.5, -ch*0.2);
          ctx.lineTo(-cw*0.1, -ch*0.2);
          ctx.fill();
      } else if (car.shape === 'van') {
          ctx.fillRect(-cw*0.3, -ch*1.1, cw*0.6, ch*0.5);
      } else if (car.shape === 'truck') {
          // Truck windshield
          ctx.beginPath();
          ctx.moveTo(cw*0.4, -ch*1.4);
          ctx.lineTo(-cw*0.2, -ch*1.4);
          ctx.lineTo(-cw*0.2, -ch*0.6);
          ctx.lineTo(cw*0.4, -ch*0.6);
          ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      
      // Driver
      drawDriver(ctx, car, cw, ch, isGameOver);
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    // Remove isGameOver return to allow physics/render continuation
    if (!canvas || !ctx) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    if (!pausedRef.current) {
        Matter.Engine.update(engineRef.current, 1000 / 60);
        const chassis = carRef.current.bodies.find((b: any) => b.label === 'chassis');
        const wheelB = carRef.current.bodies.find((b: any) => b.label === 'wheelBack');
        const wheelF = carRef.current.bodies.find((b: any) => b.label === 'wheelFront');

        const { keys } = gameStateRef.current;
        const speedRatio = Matter.Vector.magnitude(chassis.velocity) / 25;
        const isGrounded = wheelGroundContacts.current > 0;

        // --- FLIP MECHANISM ---
        // Initialize flip angle tracker on first frame
        if (!stuntMetricsRef.current.initialized) {
            stuntMetricsRef.current.lastFlipAngle = chassis.angle;
            stuntMetricsRef.current.initialized = true;
        }

        // Calculate continuous accumulated rotation difference
        const currentAngle = chassis.angle;
        const diff = currentAngle - stuntMetricsRef.current.lastFlipAngle;
        
        // Check for full rotation (2 * PI)
        if (Math.abs(diff) >= Math.PI * 2) {
            const flips = Math.floor(Math.abs(diff) / (Math.PI * 2));
            const direction = Math.sign(diff); // 1 or -1
            
            if (flips > 0) {
                const bonus = 100 * flips;
                // Add coins even if game over ("alive or died")
                gameStateRef.current.coins += bonus;
                triggerPopup(flips > 1 ? `${flips}x FLIP!` : "FLIP!", `+${bonus}`, 'flip', bonus);
                
                // Update anchor by exactly N full rotations to allow continuous counting
                stuntMetricsRef.current.lastFlipAngle += direction * flips * Math.PI * 2;
            }
        }

        // Air Time Logic (Only when alive and in air)
        if (!gameStateRef.current.isGameOver && !isMenuBackground) {
            if (!isGrounded) {
                if (stuntMetricsRef.current.airStartTime === 0) {
                    stuntMetricsRef.current.airStartTime = Date.now();
                }
            } else {
                if (stuntMetricsRef.current.airStartTime !== 0) {
                    const airTime = Date.now() - stuntMetricsRef.current.airStartTime;
                    if (airTime > 1500) {
                        const bonus = Math.floor(airTime / 10);
                        gameStateRef.current.coins += bonus;
                        triggerPopup("AIR TIME", `${(airTime/1000).toFixed(1)}s`, 'air', bonus);
                    }
                    stuntMetricsRef.current.airStartTime = 0;
                }
            }
        }
        
        if (!isMenuBackground) {
            // Sound always updates if physics runs
            soundManagerRef.current?.updateContinuous(speedRatio, isGrounded, keys.right && !isOutOfFuelRef.current && !gameStateRef.current.isGameOver);
            
            // --- CONTROLS (Only when alive) ---
            if (!gameStateRef.current.isGameOver) {
                if (keys.right && !isOutOfFuelRef.current) {
                    fuelRef.current -= config.FUEL_CONSUMPTION;
                    if (fuelRef.current <= 0) {
                        fuelRef.current = 0; isOutOfFuelRef.current = true;
                        setNotification({ text: "OUT OF FUEL", id: Date.now() });
                        setTimeout(() => { if (!gameStateRef.current.isGameOver) onGameOver(gameStateRef.current.distance, gameStateRef.current.coins); }, 3000);
                    }
                    const power = selectedCar.acceleration;
                    if (selectedCar.driveTrain !== 'FWD') Matter.Body.setAngularVelocity(wheelB, Math.min(wheelB.angularVelocity + power, selectedCar.speed));
                    if (selectedCar.driveTrain !== 'RWD') Matter.Body.setAngularVelocity(wheelF, Math.min(wheelF.angularVelocity + power, selectedCar.speed));
                    if (chassis.angularVelocity > -config.MAX_ROTATION_SPEED) Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity - (isGrounded ? config.GROUND_ROTATION_SPEED : config.AIR_ROTATION_SPEED));
                } else if (keys.left) {
                     if (selectedCar.driveTrain !== 'FWD') Matter.Body.setAngularVelocity(wheelB, Math.max(wheelB.angularVelocity - 0.1, -selectedCar.speed/2));
                     if (selectedCar.driveTrain !== 'RWD') Matter.Body.setAngularVelocity(wheelF, Math.max(wheelF.angularVelocity - 0.1, -selectedCar.speed/2));
                     if (chassis.angularVelocity < config.MAX_ROTATION_SPEED) Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity + (isGrounded ? config.GROUND_ROTATION_SPEED : config.AIR_ROTATION_SPEED));
                }

                // Update distance only when alive
                gameStateRef.current.distance = Math.max(0, Math.floor((chassis.position.x - 200) / 10));
            }
        } else {
            Matter.Body.setAngularVelocity(wheelB, 0.4); Matter.Body.setAngularVelocity(wheelF, 0.4);
            if (chassis.position.y > 500) Matter.Body.setPosition(chassis, { x: 200, y: -100 });
        }

        // Camera always follows physics object (even if crashing)
        cameraPosRef.current = { x: chassis.position.x, y: chassis.position.y };
        
        // Terrain Generation
        if (chassis.position.x > lastChunkDataRef.current.endX - config.RENDER_DISTANCE) addChunk(lastChunkDataRef.current.endX);

        if (hudDistanceRef.current) hudDistanceRef.current.innerText = `${gameStateRef.current.distance}`;
        if (hudCoinsRef.current) hudCoinsRef.current.innerText = `${gameStateRef.current.coins}`;
        if (hudFuelBarRef.current) hudFuelBarRef.current.style.width = `${(fuelRef.current / config.MAX_FUEL) * 100}%`;
    }

    // --- RENDERING ---
    const zoom = cameraZoomRef.current;
    const vH = config.BASE_VIEWPORT_HEIGHT * zoom;
    const vW = (canvas.width / canvas.height) * vH; 
    const scale = canvas.height / vH;
    
    const camX = cameraPosRef.current.x - vW * 0.3;
    const camY = cameraPosRef.current.y - vH * 0.6;

    ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);

    const skyGrad = ctx.createLinearGradient(camX, camY, camX, camY + vH);
    skyGrad.addColorStop(0, selectedMap.skyColorStart); skyGrad.addColorStop(1, selectedMap.skyColorEnd);
    ctx.fillStyle = skyGrad; ctx.fillRect(camX, camY, vW, vH);
    
    if (selectedMap.backgroundType !== 'moon' && selectedMap.backgroundType !== 'mars') {
        const sunGrad = ctx.createRadialGradient(camX + vW - 100, camY + 100, 20, camX + vW - 100, camY + 100, 200);
        sunGrad.addColorStop(0, 'rgba(255, 255, 200, 0.6)'); sunGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = sunGrad; ctx.fillRect(camX, camY, vW, vH/2);
    }

    if (starsRef.current.length > 0) {
        ctx.fillStyle = 'white';
        starsRef.current.forEach(s => {
            const px = s.x + camX * 0.85; 
            if (px > camX && px < camX + vW) {
                ctx.globalAlpha = s.opacity; ctx.beginPath(); ctx.arc(px, s.y, s.r, 0, Math.PI*2); ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }

    cloudsRef.current.forEach(c => {
        if (c.x > camX - 400 && c.x < camX + vW + 400) drawCloud(ctx, c);
    });

    const groundPat = getPattern(ctx, 'ground', selectedMap.groundColor, selectedMap.groundDarkColor);
    ctx.fillStyle = groundPat || selectedMap.groundColor;
    
    chunksRef.current.forEach(chunk => {
        if (chunk.endX < camX || chunk.pathData[0].x > camX + vW) return;
        
        // Draw Ground
        ctx.fillStyle = groundPat || selectedMap.groundColor;
        ctx.beginPath(); ctx.moveTo(chunk.pathData[0].x, chunk.pathData[0].y);
        chunk.pathData.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(chunk.endX, chunk.endY + 1000); ctx.lineTo(chunk.pathData[0].x, chunk.pathData[0].y + 1000);
        ctx.fill(); 

        if (selectedMap.backgroundType === 'earth') { ctx.strokeStyle = COLORS.grassDetail; ctx.lineWidth = 10; } 
        else if (selectedMap.backgroundType === 'moon') { ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6; } 
        else if (selectedMap.backgroundType === 'caves') { ctx.strokeStyle = '#374151'; ctx.lineWidth = 6; }
        else if (selectedMap.backgroundType === 'mars') { ctx.strokeStyle = '#9a3412'; ctx.lineWidth = 8; }
        else { ctx.strokeStyle = '#475569'; ctx.lineWidth = 8; }
        ctx.beginPath(); chunk.pathData.forEach((p, i) => { if (i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.stroke();
        
        // Draw Ceiling (if exists)
        if (chunk.ceilingPathData) {
             ctx.fillStyle = groundPat || selectedMap.groundColor;
             ctx.beginPath();
             ctx.moveTo(chunk.ceilingPathData[0].x, chunk.ceilingPathData[0].y);
             chunk.ceilingPathData.forEach(p => ctx.lineTo(p.x, p.y));
             ctx.lineTo(chunk.endX, chunk.ceilingPathData[chunk.ceilingPathData.length-1].y - 1000);
             ctx.lineTo(chunk.ceilingPathData[0].x, chunk.ceilingPathData[0].y - 1000);
             ctx.fill();
             
             // Ceiling Border
             ctx.strokeStyle = '#374151'; ctx.lineWidth = 6;
             ctx.beginPath(); 
             chunk.ceilingPathData.forEach((p, i) => { if (i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
             ctx.stroke();
        }

        chunk.decorations.forEach(d => {
            if (d.x < camX - 100 || d.x > camX + vW + 100) return;
            ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle); ctx.scale(d.scale, d.scale);
            
            if (d.type === 5) { 
                ctx.fillStyle = 'white'; ctx.fillRect(0,-200,6,200); 
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(6,-200); ctx.lineTo(70,-175); ctx.lineTo(6,-150); ctx.fill();
            } else if (d.type === 3) { 
                ctx.fillStyle = COLORS.lampPost; ctx.fillRect(-2,-80,4,80); 
                ctx.fillStyle = COLORS.lampLight; ctx.beginPath(); ctx.arc(10,-80,6,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = COLORS.lampGlow; ctx.beginPath(); ctx.arc(10,-80,20,0,Math.PI*2); ctx.fill();
            } else if (d.type === 4) { 
                ctx.fillStyle = '#78350f'; ctx.fillRect(-2,-20,4,20); ctx.fillRect(-20,-15,40,4);
            } else if (d.type === 6 || d.type === 7) { 
                drawTree(ctx, d.type, d.seed);
            } else if (d.type === 8) { 
                drawRock(ctx, d.seed);
            } else if (d.type === 9) { 
                drawBush(ctx, d.seed);
            } else if (d.type === 10) { 
                // Stalactite (Inverted Rock)
                ctx.scale(1, -1); // Flip Y
                drawRock(ctx, d.seed);
            } else if (selectedMap.backgroundType === 'earth') {
                 ctx.strokeStyle = COLORS.grassDetail; ctx.lineWidth = 2; 
                 ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-3, -8 - d.seed * 5); ctx.moveTo(0,0); ctx.lineTo(3, -6 - d.seed * 5); ctx.stroke();
            }
            ctx.restore();
        });

        chunk.coinBodies.forEach(b => {
            if (!collectedCoinIdsRef.current.has(b.id) && b.position.x > camX - 50 && b.position.x < camX + vW + 50) {
                ctx.save(); ctx.translate(b.position.x, b.position.y);
                const pulse = Math.sin(Date.now() / 200) * 0.1 + 1; ctx.scale(pulse, pulse);
                ctx.fillStyle = COLORS.coinOuter; ctx.beginPath(); ctx.arc(0,0,config.COIN_SIZE,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = COLORS.coinInner; ctx.beginPath(); ctx.arc(0,0,config.COIN_SIZE*0.7,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
                ctx.restore();
            }
        });

        chunk.fuelBodies.forEach(b => {
            if (!collectedFuelIdsRef.current.has(b.id) && b.position.x > camX - 50 && b.position.x < camX + vW + 50) {
                ctx.save(); ctx.translate(b.position.x, b.position.y);
                const pulse = Math.sin(Date.now() / 300) * 0.1 + 1; ctx.scale(pulse, pulse);
                ctx.fillStyle = COLORS.fuelCan; ctx.fillRect(-10, -15, 20, 30);
                ctx.fillStyle = COLORS.fuelCanCap; ctx.fillRect(-6, -18, 12, 3);
                ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'white'; ctx.fillText('FUEL', -10, 5);
                ctx.restore();
            }
        });
    });

    const chassis = carRef.current.bodies.find((b: any) => b.label === 'chassis');
    const wheelB = carRef.current.bodies.find((b: any) => b.label === 'wheelBack');
    const wheelF = carRef.current.bodies.find((b: any) => b.label === 'wheelFront');
    const cw = selectedCar.width || config.CAR_WIDTH; 
    const ch = selectedCar.height || config.CAR_HEIGHT;
    const wr = selectedCar.wheelSize || config.WHEEL_SIZE;
    
    const wheelOffsetX = -cw / 2 + wr;
    const wheelOffsetY = ch / 2;
    drawSuspension(ctx, chassis, wheelB, wheelOffsetX, wheelOffsetY);
    drawSuspension(ctx, chassis, wheelF, -wheelOffsetX, wheelOffsetY);

    [wheelB, wheelF].forEach(w => {
        drawWheel(ctx, w.position.x, w.position.y, wr, w.angle, selectedCar.wheelColor);
    });

    ctx.save(); ctx.translate(chassis.position.x, chassis.position.y); ctx.rotate(chassis.angle);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
    let bodyFill: string | CanvasPattern = selectedCar.bodyColor;
    if (selectedCar.texture !== 'plain') bodyFill = getPattern(ctx, selectedCar.texture, selectedCar.bodyColor, selectedCar.textureColor2) || bodyFill;
    
    ctx.fillStyle = bodyFill; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
    drawChassisPath(ctx, selectedCar, cw, ch, wr);
    ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    drawCarDetails(ctx, selectedCar, cw, ch, gameStateRef.current.isGameOver);
    ctx.restore();

    particlesRef.current.forEach(p => {
        if (p.active) {
            ctx.fillStyle = p.type === 'spark' ? COLORS.particleSpark : p.type === 'smoke' ? COLORS.particleSmoke : COLORS.particleDust; 
            ctx.globalAlpha = p.life / p.maxLife; ctx.beginPath(); 
            if (p.type === 'smoke') { ctx.arc(p.x, p.y, 4 + (1 - p.life/p.maxLife) * 8, 0, Math.PI*2); } else { ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2); }
            ctx.fill();
            p.x += p.vx; p.y += p.vy; if (p.type !== 'smoke') p.vy += 0.2; else { p.vx *= 0.95; p.vy -= 0.05; } 
            p.life--; if (p.life <= 0) p.active = false;
        }
    });
    ctx.globalAlpha = 1;

    const now = performance.now(); frameCountRef.current++;
    if (now - lastFpsTimeRef.current >= 500) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current));
        if (hudFpsRef.current) hudFpsRef.current.innerText = `${fps} FPS`;
        lastFpsTimeRef.current = now; frameCountRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [config, selectedCar, selectedMap, onGameOver, onLevelComplete, isMenuBackground]);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-slate-900 overflow-hidden select-none flex items-center justify-center ${isMenuBackground ? 'opacity-40 pointer-events-none' : ''}`}>
      
      {/* 16:9 Game Area Wrapper */}
      <div ref={gameAreaRef} className="relative shadow-2xl overflow-hidden bg-black">
        
        {!isMenuBackground && (
            <>
                {/* Popups Layer */}
                <div className="absolute top-1/4 left-0 right-0 z-20 pointer-events-none flex flex-col items-center gap-2">
                    {popups.map(p => (
                        <div key={p.id} className="flex flex-col items-center animate-bounce-short">
                            <div className="flex items-center gap-2">
                                <span className={`text-5xl font-black italic tracking-tighter drop-shadow-xl text-stroke ${p.type === 'flip' ? 'text-yellow-400' : 'text-sky-400'}`}>
                                    {p.text}
                                </span>
                                {p.type === 'flip' && <span className="text-4xl">🔄</span>}
                            </div>
                             <span className="text-xl font-bold text-white drop-shadow-md bg-black/50 px-3 rounded-full">
                                {p.subText}
                             </span>
                        </div>
                    ))}
                </div>

                <div className="absolute top-4 right-4 z-30 flex gap-2">
                    <div ref={hudFpsRef} className="font-mono text-xs text-emerald-500 bg-black/60 px-2 py-1 rounded">60 FPS</div>
                    <button onClick={() => { pausedRef.current = !pausedRef.current; setIsPaused(!isPaused); }} className="w-10 h-10 bg-black/60 text-white rounded flex items-center justify-center border border-white/20 hover:bg-white/10 active:scale-95 transition-all">
                        {isPaused ? "▶" : "⏸"}
                    </button>
                </div>
                
                {isPaused && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
                        <div className="p-8 bg-neutral-900/90 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
                            
                            {!isSettingsOpen ? (
                            <>
                                <h2 className="text-4xl font-black italic text-white tracking-widest uppercase border-b-4 border-amber-500 pb-2 mb-2">
                                    Paused
                                </h2>
                                
                                <div className="flex flex-col gap-3 w-full">
                                    <button 
                                        onClick={handleResume}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>▶</span> Resume
                                    </button>

                                    <button 
                                        onClick={onRestart}
                                        className="w-full py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>↺</span> Restart
                                    </button>
                                    
                                    <button 
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="w-full py-4 bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>⚙</span> Settings
                                    </button>

                                    <button 
                                        onClick={onExit}
                                        className="w-full py-4 bg-red-900/50 border-2 border-red-900/50 hover:bg-red-900 hover:border-red-800 text-red-100 font-bold uppercase tracking-wider rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>✕</span> Main Menu
                                    </button>
                                </div>
                            </>
                            ) : (
                                <SettingsModal 
                                    currentResolution={config.RESOLUTION}
                                    onSave={(res) => { onUpdateConfig('RESOLUTION', res); setIsSettingsOpen(false); }}
                                    onClose={() => setIsSettingsOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-2">
                    <div className="bg-black/60 px-4 py-2 rounded-xl border border-white/10 flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Distance</span>
                        <span ref={hudDistanceRef} className="text-2xl font-mono font-bold text-white">0</span>
                    </div>
                    <div className="bg-black/60 px-4 py-2 rounded-xl border border-amber-500/20 flex gap-3 items-center">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-bold">$</div>
                        <span ref={hudCoinsRef} className="text-xl font-mono font-bold text-white">0</span>
                    </div>
                    <div className="w-48 h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden border border-white/5">
                        <div ref={hudFuelBarRef} className="h-full bg-red-500 transition-all duration-200" style={{ width: '100%' }} />
                    </div>
                </div>
                {notification && (
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 text-4xl font-black italic text-white animate-bounce drop-shadow-lg">{notification.text}</div>
                )}
                <div className="absolute bottom-10 left-10 right-10 z-30 flex justify-between">
                    <button 
                        className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/10 active:bg-white/10 active:border-red-500/50 transition-all text-white font-black italic text-xl select-none touch-manipulation" 
                        onMouseDown={() => gameStateRef.current.keys.left = true} 
                        onMouseUp={() => gameStateRef.current.keys.left = false} 
                        onMouseLeave={() => gameStateRef.current.keys.left = false}
                        onTouchStart={(e) => { e.preventDefault(); gameStateRef.current.keys.left = true; }} 
                        onTouchEnd={(e) => { e.preventDefault(); gameStateRef.current.keys.left = false; }}
                    >
                        BRAKE
                    </button>
                    <button 
                        className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/10 active:bg-white/10 active:border-emerald-500/50 transition-all text-white font-black italic text-xl select-none touch-manipulation" 
                        onMouseDown={() => gameStateRef.current.keys.right = true} 
                        onMouseUp={() => gameStateRef.current.keys.right = false} 
                        onMouseLeave={() => gameStateRef.current.keys.right = false}
                        onTouchStart={(e) => { e.preventDefault(); gameStateRef.current.keys.right = true; }} 
                        onTouchEnd={(e) => { e.preventDefault(); gameStateRef.current.keys.right = false; }}
                    >
                        GAS
                    </button>
                </div>
            </>
        )}
        <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: config.PIXELATED ? 'pixelated' : 'auto' }} />
      </div>
      <style>{`
        .text-stroke {
            -webkit-text-stroke: 2px black;
        }
        @keyframes bounce-short {
            0% { transform: scale(0.5) translateY(20px); opacity: 0; }
            50% { transform: scale(1.2) translateY(-10px); opacity: 1; }
            80% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-short {
            animation: bounce-short 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default Game;
