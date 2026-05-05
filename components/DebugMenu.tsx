
import React from 'react';
import { GameConfig } from '../types';
import { GAME_CONFIG } from '../constants';

interface DebugMenuProps {
  config: GameConfig;
  onUpdate: (key: keyof GameConfig, value: any) => void;
  onClose: () => void;
  onReset: () => void;
}

const DebugMenu: React.FC<DebugMenuProps> = ({ config, onUpdate, onClose, onReset }) => {
  const categories = {
    Graphics: ['RESOLUTION', 'PIXELATED'],
    Physics: ['GRAVITY', 'ACCELERATION', 'CAR_SPEED'],
    Rotation: ['GROUND_ROTATION_SPEED', 'AIR_ROTATION_SPEED', 'MAX_ROTATION_SPEED'],
    Terrain: ['TERRAIN_NOISE_FREQ_1', 'TERRAIN_AMP_1', 'TERRAIN_NOISE_FREQ_2', 'TERRAIN_AMP_2', 'TERRAIN_NOISE_FREQ_3', 'TERRAIN_AMP_3'],
    Camera: ['BASE_VIEWPORT_WIDTH', 'BASE_VIEWPORT_HEIGHT', 'MAX_ZOOM_FACTOR'],
    World: ['CHUNK_SIZE', 'LAMP_SPACING', 'DAY_CYCLE_FRAMES'],
    Vehicle: ['CAR_WIDTH', 'CAR_HEIGHT', 'WHEEL_SIZE']
  };

  const ranges: Record<string, [number, number, number]> = {
    // key: [min, max, step]
    RESOLUTION: [0.1, 1.0, 0.05],
    GRAVITY: [0.1, 5.0, 0.1],
    ACCELERATION: [0.001, 0.1, 0.001],
    CAR_SPEED: [0.1, 5.0, 0.1],
    GROUND_ROTATION_SPEED: [0, 0.2, 0.001],
    AIR_ROTATION_SPEED: [0, 0.5, 0.01],
    MAX_ROTATION_SPEED: [0.05, 1.0, 0.05],
    BASE_VIEWPORT_WIDTH: [600, 2000, 50],
    BASE_VIEWPORT_HEIGHT: [400, 1200, 50],
    MAX_ZOOM_FACTOR: [1.0, 3.0, 0.1],
    DAY_CYCLE_FRAMES: [600, 10000, 100],
    CHUNK_SIZE: [1000, 5000, 100],
    LAMP_SPACING: [100, 1000, 50],
    CAR_WIDTH: [100, 300, 10],
    CAR_HEIGHT: [20, 100, 5],
    WHEEL_SIZE: [20, 80, 5],
    
    // Terrain Ranges
    TERRAIN_NOISE_FREQ_1: [0.01, 0.5, 0.01],
    TERRAIN_AMP_1: [0.1, 3.0, 0.1],
    TERRAIN_NOISE_FREQ_2: [0.01, 1.0, 0.01],
    TERRAIN_AMP_2: [0.0, 2.0, 0.1],
    TERRAIN_NOISE_FREQ_3: [0.01, 2.0, 0.01],
    TERRAIN_AMP_3: [0.0, 0.5, 0.01],
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      alert("Configuration copied to clipboard!");
  };

  return (
    <div className="absolute top-0 right-0 z-50 h-full w-80 bg-slate-900/95 border-l border-slate-700 overflow-y-auto shadow-2xl flex flex-col">
      <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center z-10">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="text-blue-400">⚡</span> Debug
        </h2>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xl font-bold px-2 py-1 rounded hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 mb-4">
             <button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold">Copy JSON</button>
             <button onClick={onReset} className="bg-red-600 hover:bg-red-500 text-white text-xs py-2 rounded font-bold">Reset Defaults</button>
        </div>

        {Object.entries(categories).map(([category, keys]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">
              {category}
            </h3>
            <div className="space-y-4">
              {keys.map((key) => {
                const configKey = key as keyof GameConfig;
                const value = config[configKey];
                
                // Boolean Checkbox for PIXELATED
                if (typeof value === 'boolean') {
                    return (
                        <div key={key} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/50">
                            <span className="text-xs font-mono text-slate-300">{key.replace(/_/g, ' ')}</span>
                            <button 
                                onClick={() => onUpdate(configKey, !value)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${value ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                            >
                                {value ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    );
                }

                const [min, max, step] = ranges[key] || [0, 100, 1];

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>{key}</span>
                      <span className="text-blue-400">{Number(value).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value as number}
                      onChange={(e) => onUpdate(configKey, parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugMenu;
