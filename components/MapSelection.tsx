
import React from 'react';
import { MAPS } from '../constants';
import { MapConfig } from '../types';

interface MapSelectionProps {
  currentMapId: string;
  onSelect: (map: MapConfig) => void;
  onClose: () => void;
}

const MapSelection: React.FC<MapSelectionProps> = ({ currentMapId, onSelect, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-4xl p-8 relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
             <div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                Select Location
                </h2>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Where will you race today?</p>
             </div>
             <button 
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors text-2xl"
             >
                ✕
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 gap-4">
          {MAPS.map((map) => {
            const isSelected = currentMapId === map.id;
            return (
              <div 
                key={map.id}
                onClick={() => onSelect(map)}
                className={`
                  relative p-1 rounded-xl cursor-pointer transition-all transform hover:scale-[1.01] group
                  ${isSelected ? 'bg-gradient-to-r from-amber-500 to-amber-700' : 'bg-neutral-800 hover:bg-neutral-700'}
                `}
              >
                <div className="bg-neutral-900 h-full rounded-lg p-5 flex items-center gap-6 relative overflow-hidden">
                   {/* Background Hint */}
                   <div 
                        className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 transform skew-x-12 translate-x-10"
                        style={{ background: `linear-gradient(to bottom, ${map.skyColorStart}, ${map.skyColorEnd})` }}
                   ></div>

                   <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 ${isSelected ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-600'}`}>
                      {map.backgroundType === 'earth' && '🌲'}
                      {map.backgroundType === 'highway' && '🛣️'}
                      {map.backgroundType === 'moon' && '🌑'}
                   </div>

                   <div className="flex-1 z-10">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isSelected ? 'text-amber-500' : 'text-white'}`}>{map.name}</h3>
                        {isSelected && <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-bold uppercase">Active</span>}
                      </div>
                      <p className="text-sm text-neutral-400 font-serif italic mt-1">{map.description}</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapSelection;
