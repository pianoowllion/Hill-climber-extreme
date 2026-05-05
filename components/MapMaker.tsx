
import React, { useState, useEffect, useRef } from 'react';
import { GameConfig } from '../types';
import { getTerrainNoise } from '../utils/physics';

interface MapMakerProps {
  config: GameConfig;
  onUpdateConfig: (key: keyof GameConfig, value: number) => void;
  onClose: () => void;
}

const MapMaker: React.FC<MapMakerProps> = ({ config, onUpdateConfig, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);

  // Sliders to control
  const controls = [
    { label: 'Base Frequency', key: 'TERRAIN_NOISE_FREQ_1', min: 0.01, max: 0.5, step: 0.01 },
    { label: 'Base Amplitude', key: 'TERRAIN_AMP_1', min: 0.1, max: 3.0, step: 0.1 },
    { label: 'Detail Frequency', key: 'TERRAIN_NOISE_FREQ_2', min: 0.01, max: 1.0, step: 0.01 },
    { label: 'Detail Amplitude', key: 'TERRAIN_AMP_2', min: 0.0, max: 2.0, step: 0.1 },
    { label: 'Rumble Frequency', key: 'TERRAIN_NOISE_FREQ_3', min: 0.01, max: 2.0, step: 0.01 },
    { label: 'Rumble Amplitude', key: 'TERRAIN_AMP_3', min: 0.0, max: 0.5, step: 0.01 },
  ];

  // Generate Preview Points
  useEffect(() => {
    const pts = [];
    const segments = 100;
    const width = 800; // Visual width
    // Simulate about 100 game segments
    let lastY = 0;
    
    for (let i = 0; i < segments; i++) {
        // We use the same physics logic, but we need to accumulate y changes like the physics engine does
        const noiseCurrent = getTerrainNoise(i, config);
        const noisePrev = getTerrainNoise(i - 1, config);
        const dy = -(noiseCurrent - noisePrev);
        
        lastY += dy;
        // Scale x for canvas fitting
        pts.push({ x: i * (width/segments), y: lastY });
    }
    setPoints(pts);
  }, [config]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    ctx.strokeStyle = '#262626'; // neutral-800
    ctx.beginPath();
    for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); }
    for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); }
    ctx.stroke();

    // Center line
    const centerY = canvas.height / 2;
    ctx.strokeStyle = '#525252'; // neutral-600
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    if (points.length < 2) return;

    // Draw Terrain
    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, centerY + points[0].y);
    
    for(let i=1; i<points.length; i++) {
        ctx.lineTo(points[i].x, centerY + points[i].y);
    }
    ctx.stroke();

    // Fill Ground
    ctx.lineTo(points[points.length-1].x, canvas.height);
    ctx.lineTo(points[0].x, canvas.height);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fill();

  }, [points]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert("Map Config copied!");
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-900 text-white flex flex-col">
       <div className="p-6 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Map Editor</h2>
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Terrain Laboratory</p>
            </div>
            <div className="flex gap-4">
                 <button onClick={handleCopy} className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm font-bold hover:bg-neutral-700 hover:text-white transition-colors">Copy Config</button>
                 <button onClick={onClose} className="px-4 py-2 bg-amber-600 rounded text-sm font-bold hover:bg-amber-500 transition-colors">Exit</button>
            </div>
       </div>

       <div className="flex-1 flex overflow-hidden">
            {/* Controls */}
            <div className="w-96 bg-neutral-900 p-6 overflow-y-auto border-r border-neutral-800 space-y-8">
                {controls.map((ctrl) => (
                    <div key={ctrl.key}>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-2 text-neutral-400">
                            <label>{ctrl.label}</label>
                            <span className="font-mono text-amber-500">{(config[ctrl.key as keyof GameConfig] as number).toFixed(3)}</span>
                        </div>
                        <input 
                            type="range"
                            min={ctrl.min}
                            max={ctrl.max}
                            step={ctrl.step}
                            value={config[ctrl.key as keyof GameConfig] as number}
                            onChange={(e) => onUpdateConfig(ctrl.key as keyof GameConfig, parseFloat(e.target.value))}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                        />
                    </div>
                ))}

                <div className="bg-neutral-800/50 p-4 rounded border border-neutral-700 text-xs text-neutral-500 leading-relaxed font-serif italic">
                    <p>Adjust the noise algorithms to shape the procedural terrain generation. Changes update the preview graph in real-time.</p>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 p-10 flex items-center justify-center bg-black relative">
                 <div className="absolute top-6 left-6 text-neutral-600 font-mono text-xs uppercase tracking-widest">Terrain Preview // Slice 0-100</div>
                 <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={600} 
                    className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl"
                 />
            </div>
       </div>
    </div>
  );
};

export default MapMaker;
