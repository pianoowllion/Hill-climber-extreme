
import React from 'react';
import { LEVELS } from '../constants';

interface LevelSelectProps {
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ onSelectLevel, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-3xl p-8 relative flex flex-col max-h-[90vh]">
         {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
             <div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                Campaign
                </h2>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Select your challenge</p>
             </div>
             <button 
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors text-2xl"
             >
                ✕
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
            {LEVELS.map((level) => (
                <button
                    key={level.id}
                    onClick={() => onSelectLevel(level.id)}
                    className="group relative bg-neutral-800 border border-neutral-700 hover:border-amber-500/50 p-6 rounded-xl transition-all hover:bg-neutral-750 text-left overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-white group-hover:text-amber-500 transition-colors">
                        {level.id}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-[0.2em] mb-2">Stage {level.id}</div>
                        <div className="text-xl font-black text-white italic uppercase tracking-wider group-hover:text-amber-400 transition-colors mb-4">{level.name}</div>
                        
                        <div className="flex items-center gap-2">
                             <div className="bg-neutral-900 px-3 py-1 rounded text-xs font-mono text-emerald-500 font-bold border border-neutral-700">
                                {level.distance} M
                             </div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
