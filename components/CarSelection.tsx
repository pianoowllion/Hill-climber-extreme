
import React from 'react';
import { GAME_CONFIG } from '../constants';
import { CarModel } from '../types';

interface CarSelectionProps {
  cars: CarModel[];
  currentCarId: string;
  onSelect: (car: CarModel) => void;
  onDelete?: (carId: string) => void;
  onClose: () => void;
}

const CarSelection: React.FC<CarSelectionProps> = ({ cars, currentCarId, onSelect, onDelete, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-5xl p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
             <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">My Garage</h2>
             <button onClick={onClose} className="text-neutral-500 hover:text-white text-2xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-2 custom-scrollbar">
          {cars.map((car) => {
            const isSelected = currentCarId === car.id;
            const isCustom = car.id.startsWith('custom-');
            const patternId = `pattern-select-${car.id}`;
            const fillStyle = car.texture === 'plain' ? car.bodyColor : `url(#${patternId})`;
            const carW = 160; 
            const carH = 50;
            const wR = car.wheelSize || GAME_CONFIG.WHEEL_SIZE;
            const wOff = carW * 0.4;

            return (
              <div 
                key={car.id} 
                className={`group relative p-6 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isSelected ? 'border-amber-500 bg-neutral-800 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}`}
              >
                <div onClick={() => onSelect(car)} className="flex items-center gap-6 cursor-pointer">
                  <div className="w-40 h-24 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 relative overflow-hidden">
                    {/* Preview Background */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-700 to-transparent"></div>
                    
                    <svg width="140" height="70" viewBox="-90 -50 180 100" className="z-10 drop-shadow-lg">
                        <defs>
                             {car.texture === 'striped' && (
                                <pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                                  <rect width="10" height="10" fill={car.bodyColor} /><rect width="5" height="10" fill={car.textureColor2} />
                                </pattern>
                              )}
                               {car.texture === 'dots' && (
                                <pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10">
                                  <rect width="10" height="10" fill={car.bodyColor} /><circle cx="5" cy="5" r="2.5" fill={car.textureColor2} />
                                </pattern>
                              )}
                               {car.texture === 'checker' && (
                                <pattern id={patternId} patternUnits="userSpaceOnUse" width="12" height="12">
                                  <rect width="12" height="12" fill={car.bodyColor} /><rect width="6" height="6" fill={car.textureColor2} /><rect x="6" y="6" width="6" height="6" fill={car.textureColor2} />
                                </pattern>
                              )}
                               {car.texture === 'gradient' && (
                                <linearGradient id={patternId} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={car.textureColor2} /><stop offset="100%" stopColor={car.bodyColor} />
                                </linearGradient>
                              )}
                        </defs>
                        <g transform="translate(0, -5)">
                            {/* BODY: Custom Image or SVG Path */}
                            {car.imageUrl ? (
                                <image
                                    href={car.imageUrl}
                                    x={-80 * (car.imageScale || 1)}
                                    y={-40 + (car.imageYOffset || 0) - (40 * ((car.imageScale || 1) - 1))}
                                    width={160 * (car.imageScale || 1)}
                                    height={80 * (car.imageScale || 1)}
                                    preserveAspectRatio="xMidYMid meet"
                                />
                            ) : (
                                <g>
                                    <path 
                                        d={
                                        (car.shape === 'coupe' || !car.shape) ? "M -80 25 L -80 -10 Q -80 -45 -32 -45 L 8 -45 Q 64 -35 88 0 L 96 25 L -80 25 Z" :
                                        car.shape === 'jeep' ? "M -72 25 L -72 -25 L -40 -25 L -40 -80 L 48 -80 L 48 -10 L 88 -10 L 88 25 L -72 25 Z" :
                                        car.shape === 'van' ? "M -72 25 L -72 -65 L 56 -65 Q 88 -60 88 -10 L 88 25 L -72 25 Z" :
                                        car.shape === 'supercar' ? "M -88 25 L -88 0 L -40 -30 L 8 -30 Q 80 -20 112 0 L 116 25 L -88 25 Z" :
                                        car.shape === 'racer' ? "M -96 10 L -96 -15 L -40 -25 L 24 -25 Q 80 -15 120 0 L 120 15 L -96 10 Z" :
                                        car.shape === 'buggy' ? "M -56 0 L -40 -70 L 32 -70 L 72 0 L 88 0 L 72 25 L -72 25 L -56 0 Z" :
                                        "M -80 15 L -80 -10 L 80 -10 L 80 15 Z" // fallback
                                        } 
                                        fill={fillStyle} 
                                        stroke="rgba(0,0,0,0.5)" 
                                        strokeWidth="1.5"
                                    />
                                    
                                    {(car.shape === 'coupe') && <path d="M -24 -37 L 8 -37 L 40 -5 L -24 -5 Z" fill="#1e293b" />}
                                    {(car.shape === 'supercar') && <path d="M -16 -25 L 16 -25 L 48 -5 L -32 -5 Z" fill="#1e293b" />}
                                </g>
                            )}
                            
                            <circle cx={-wOff} cy="25" r={wR * 0.7} fill="#111" stroke="black" />
                            <circle cx={wOff} cy="25" r={wR * 0.7} fill="#111" stroke="black" />
                            <circle cx={-wOff} cy="25" r={wR * 0.45} fill={car.wheelColor} stroke="#444" strokeWidth="1" />
                            <circle cx={wOff} cy="25" r={wR * 0.45} fill={car.wheelColor} stroke="#444" strokeWidth="1" />
                        </g>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isSelected ? 'text-amber-500' : 'text-white'}`}>{car.name}</h3>
                    <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-neutral-700 px-2 py-0.5 rounded text-neutral-400 uppercase tracking-widest">{car.driveTrain}</span>
                        <span className="text-[10px] font-bold bg-neutral-700 px-2 py-0.5 rounded text-neutral-400 uppercase tracking-widest">{car.shape}</span>
                        {isCustom && <span className="text-[10px] font-bold bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded uppercase tracking-widest">Custom</span>}
                    </div>
                  </div>
                </div>
                
                {isCustom && onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(car.id); }}
                        className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 p-2 transition-colors"
                        title="Delete Custom Car"
                    >
                        🗑️
                    </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
};

export default CarSelection;
