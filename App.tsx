
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Game from './components/Game';
import MainMenu from './components/MainMenu';
import GameOver from './components/GameOver';
import CarSelection from './components/CarSelection';
import MapSelection from './components/MapSelection';
import MapMaker from './components/MapMaker';
import CarMaker from './components/CarMaker';
import LevelSelect from './components/LevelSelect';
import LoadingScreen from './components/LoadingScreen';
import SettingsModal from './components/SettingsModal';
import { GameState, CarModel, GameConfig, MapConfig, GameMode, LevelConfig } from './types';
import { CAR_MODELS, GAME_CONFIG, MAPS, LEVELS } from './constants';
import { SoundManager } from './utils/audio';

const CONFIG_STORAGE_KEY = 'hill_climber_config_v1';
const CUSTOM_CARS_STORAGE_KEY = 'hill_climber_custom_cars_v1';

const App: React.FC = () => {
  // Start in SPLASH state to force user interaction and music load
  const [gameState, setGameState] = useState<GameState>(GameState.SPLASH);
  const [score, setScore] = useState(0); // Distance
  const [coins, setCoins] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isMusicReady, setIsMusicReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [gameId, setGameId] = useState(0); // Unique ID to force Game remount on restart
  
  // Game Configuration State (Persisted)
  const [gameConfig, setGameConfig] = useState<GameConfig>(GAME_CONFIG);
  
  // Custom Content State
  const [customCars, setCustomCars] = useState<CarModel[]>([]);

  // Selection State
  const [selectedCar, setSelectedCar] = useState<CarModel>(CAR_MODELS[0]);
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0]);
  
  // Mode State
  const [gameMode, setGameMode] = useState<GameMode>('INFINITE');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | undefined>(undefined);
  
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Config and Custom Cars on Mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
        try {
            const parsed = JSON.parse(savedConfig);
            setGameConfig(prev => ({ ...prev, ...parsed }));
        } catch (e) {
            console.error("Failed to load config", e);
        }
    }

    const savedCars = localStorage.getItem(CUSTOM_CARS_STORAGE_KEY);
    if (savedCars) {
        try {
            const parsedCars = JSON.parse(savedCars);
            if (Array.isArray(parsedCars)) {
                setCustomCars(parsedCars);
            }
        } catch (e) {
            console.error("Failed to load custom cars", e);
        }
    }
  }, []);

  // Preload Music on Mount
  useEffect(() => {
    SoundManager.preload();
    
    // Check if already ready (rare but possible)
    if (SoundManager.isMusicReady()) {
        setIsMusicReady(true);
    }

    const handleMusicReady = () => setIsMusicReady(true);
    window.addEventListener('music-ready', handleMusicReady);
    return () => window.removeEventListener('music-ready', handleMusicReady);
  }, []);

  // Save Config on Change
  useEffect(() => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(gameConfig));
  }, [gameConfig]);

  // Audio Volume Logic
  useEffect(() => {
    if (gameState === GameState.MENU) {
        SoundManager.setMusicVolume(0.8); 
    } else if (gameState === GameState.PLAYING) {
        SoundManager.setMusicVolume(0.5); 
    }
  }, [gameState]);

  const handleSplashStart = useCallback(() => {
      setIsInitializing(true);
      
      // Initialize Audio Context (requires user gesture)
      SoundManager.init();

      // If music is ready, proceed immediately
      if (SoundManager.isMusicReady()) {
          SoundManager.startMusic();
          setGameState(GameState.MENU);
          setIsInitializing(false);
      } else {
          // If not ready, we are now in "Initializing" state showing a spinner
      }
  }, []);

  // Watch for music readiness after user clicked start
  useEffect(() => {
      if (isInitializing && isMusicReady) {
          SoundManager.startMusic();
          setGameState(GameState.MENU);
          setIsInitializing(false);
      }
  }, [isInitializing, isMusicReady]);

  const updateConfig = useCallback((key: keyof GameConfig, value: any) => {
      setGameConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetConfig = useCallback(() => {
      setGameConfig(GAME_CONFIG);
  }, []);

  const startGame = useCallback((mode: GameMode) => {
      setGameMode(mode);
      if (mode === 'LEVELS') {
          setIsLevelSelectOpen(true);
      } else {
          setScore(0);
          setCoins(0);
          setGameId(prev => prev + 1); // Force new game instance
          setGameState(GameState.LOADING);
      }
  }, []);

  const startLevel = useCallback((levelId: number) => {
      const level = LEVELS.find(l => l.id === levelId);
      if (level) {
          setCurrentLevel(level);
          setScore(0);
          setCoins(0);
          setIsLevelSelectOpen(false);
          setGameId(prev => prev + 1); // Force new game instance
          setGameState(GameState.LOADING);
      }
  }, []);

  const handleGameReady = useCallback(() => {
      // Small delay to ensure smooth transition from loading screen
      setTimeout(() => {
          setGameState(GameState.PLAYING);
      }, 500);
  }, []);

  const handleGameOver = useCallback((distance: number, collectedCoins: number) => {
    setScore(distance);
    setCoins(collectedCoins);
    if (gameMode === 'INFINITE' && distance > bestScore) {
      setBestScore(distance);
    }
    setGameState(GameState.GAME_OVER);
  }, [gameMode, bestScore]); 

  const handleLevelComplete = useCallback((collectedCoins: number) => {
      setCoins(collectedCoins);
      setGameState(GameState.LEVEL_COMPLETE);
  }, []);
  
  const handleRestart = useCallback(() => {
      if (gameMode === 'LEVELS' && currentLevel) {
          startLevel(currentLevel.id);
      } else {
          startGame('INFINITE');
      }
  }, [gameMode, currentLevel, startLevel, startGame]);

  const handleSaveCustomCar = useCallback((newCar: CarModel) => {
      const updatedCars = [...customCars, newCar];
      setCustomCars(updatedCars);
      localStorage.setItem(CUSTOM_CARS_STORAGE_KEY, JSON.stringify(updatedCars));
      setSelectedCar(newCar); // Automatically select the new car
      setGameState(GameState.MENU);
  }, [customCars]);

  const handleDeleteCustomCar = useCallback((carId: string) => {
      const updatedCars = customCars.filter(c => c.id !== carId);
      setCustomCars(updatedCars);
      localStorage.setItem(CUSTOM_CARS_STORAGE_KEY, JSON.stringify(updatedCars));
      if (selectedCar.id === carId) {
          setSelectedCar(CAR_MODELS[0]);
      }
  }, [customCars, selectedCar]);

  // Helpers for background game to ensure stable references
  const noOp = useCallback(() => {}, []);

  // Merge Base Config with Map Overrides for the active game session
  const activeConfig = useMemo(() => {
      return { ...gameConfig, ...selectedMap.configOverrides };
  }, [gameConfig, selectedMap]);

  // Combine built-in models with custom models
  const allCars = useMemo(() => [...CAR_MODELS, ...customCars], [customCars]);

  return (
    <div className="w-screen h-screen overflow-hidden font-sans select-none">
      
      {/* SPLASH SCREEN */}
      {gameState === GameState.SPLASH && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer" onClick={!isInitializing ? handleSplashStart : undefined}>
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black opacity-90"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black"></div>
            
            <div className="relative z-10 flex flex-col items-center p-8 animate-fade-in text-center">
                 <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-500 to-amber-700 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-2">
                    HILL CLIMBER
                 </h1>
                 <p className="text-neutral-500 font-mono tracking-[0.5em] text-sm uppercase mb-16">Extreme Physics Engine</p>

                 {!isInitializing ? (
                     <div className="group flex flex-col items-center gap-2 animate-pulse">
                         <span className="text-3xl font-bold text-white group-hover:text-amber-400 transition-colors tracking-widest uppercase">Click To Start</span>
                         <span className="text-[10px] text-neutral-600 uppercase">Enable Audio & Graphics</span>
                     </div>
                 ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-neutral-800 border-t-amber-500 rounded-full animate-spin"></div>
                        <span className="text-sm font-mono text-amber-500 tracking-widest uppercase animate-pulse">
                            {isMusicReady ? 'Initializing Engine...' : 'Generating Soundtrack...'}
                        </span>
                    </div>
                 )}
            </div>
            
            <div className="absolute bottom-8 text-neutral-800 text-xs font-mono">v2.1 • React • MatterJS • WebAudio</div>
        </div>
      )}

      {/* Background Game Rendering for Menu (Hidden during Splash) */}
      {gameState !== GameState.SPLASH && gameState === GameState.MENU && (
        <div className="absolute inset-0 z-0">
          <Game 
              mode="INFINITE"
              selectedCar={selectedCar}
              selectedMap={selectedMap}
              config={activeConfig}
              onGameOver={noOp} 
              onLevelComplete={noOp}
              onUpdateConfig={noOp}
              onResetConfig={noOp}
              onExit={noOp}
              onRestart={noOp}
              isMenuBackground={true}
              onReady={noOp} 
          />
        </div>
      )}

      {gameState === GameState.MENU && (
        <MainMenu 
          onStart={startGame} 
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenMapSelect={() => setIsMapSelectOpen(true)}
          onOpenMapMaker={() => setGameState(GameState.MAP_MAKER)}
          onOpenCarMaker={() => setGameState(GameState.CAR_MAKER)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          bestDistance={bestScore} 
        />
      )}
      
      {/* Loading Screen Overlay (Between Menu and Game) */}
      {gameState === GameState.LOADING && <LoadingScreen />}

      {/* Actual Game */}
      {(gameState === GameState.LOADING || gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.LEVEL_COMPLETE) && (
        <Game 
            key={gameId} // Ensure clean instance on restart
            mode={gameMode}
            levelConfig={currentLevel}
            onGameOver={handleGameOver} 
            onLevelComplete={handleLevelComplete}
            selectedCar={selectedCar} 
            selectedMap={selectedMap}
            config={activeConfig}
            onUpdateConfig={updateConfig}
            onResetConfig={resetConfig}
            onExit={() => setGameState(GameState.MENU)}
            onRestart={handleRestart}
            onReady={handleGameReady} 
        />
      )}
      
      {gameState === GameState.GAME_OVER && (
        <GameOver 
          title="Wasted"
          message="You flipped the car!"
          distance={score} 
          bestDistance={bestScore} 
          isWin={false}
          onRestart={handleRestart} 
          onMenu={() => setGameState(GameState.MENU)}
        />
      )}

      {gameState === GameState.LEVEL_COMPLETE && (
         <GameOver 
            title="Victory!"
            message={`You beat ${currentLevel?.name}!`}
            distance={score}
            bestDistance={bestScore} 
            isWin={true}
            onRestart={() => setGameState(GameState.MENU)} 
            onMenu={() => setGameState(GameState.MENU)}
         />
      )}

      {gameState === GameState.MAP_MAKER && (
          <MapMaker 
             config={activeConfig} 
             onUpdateConfig={updateConfig} 
             onClose={() => setGameState(GameState.MENU)} 
          />
      )}

      {gameState === GameState.CAR_MAKER && (
          <CarMaker 
            onSave={handleSaveCustomCar} 
            onClose={() => setGameState(GameState.MENU)} 
          />
      )}

      {isGarageOpen && (
        <CarSelection 
          cars={allCars}
          currentCarId={selectedCar.id} 
          onSelect={setSelectedCar}
          onDelete={handleDeleteCustomCar} 
          onClose={() => setIsGarageOpen(false)} 
        />
      )}

      {isMapSelectOpen && (
        <MapSelection 
          currentMapId={selectedMap.id} 
          onSelect={setSelectedMap} 
          onClose={() => setIsMapSelectOpen(false)} 
        />
      )}

      {isLevelSelectOpen && (
          <LevelSelect 
            onSelectLevel={startLevel}
            onClose={() => setIsLevelSelectOpen(false)}
          />
      )}
      
      {/* Main Menu Settings Modal */}
      {isSettingsOpen && (
          <SettingsModal 
            currentResolution={gameConfig.RESOLUTION}
            onSave={(res) => { updateConfig('RESOLUTION', res); setIsSettingsOpen(false); }}
            onClose={() => setIsSettingsOpen(false)}
          />
      )}
      
      {(gameState === GameState.MAP_MAKER || gameState === GameState.CAR_MAKER) && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b" style={{ 
            backgroundImage: `linear-gradient(to bottom, ${selectedMap.skyColorStart}, ${selectedMap.skyColorEnd})` 
        }}>
           <div className="absolute bottom-0 w-full h-1/3 transform skew-y-3 origin-bottom-right" style={{ backgroundColor: selectedMap.groundDarkColor }}></div>
           <div className="absolute bottom-0 w-full h-1/4 transform -skew-y-2 origin-bottom-left" style={{ backgroundColor: selectedMap.groundColor }}></div>
        </div>
      )}
    </div>
  );
};

export default App;
