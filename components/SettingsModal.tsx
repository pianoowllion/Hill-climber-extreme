
import React, { useState } from 'react';

interface SettingsModalProps {
  currentResolution: number;
  onSave: (resolution: number) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentResolution, onSave, onClose }) => {
  const [resolution, setResolution] = useState(currentResolution);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-neutral-900 border border-neutral-700 p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <h2 className="text-3xl font-black italic text-white tracking-widest uppercase border-b-4 border-amber-500 pb-2 mb-6">
                Settings
            </h2>
            
            <div className="mb-8">
                <div className="flex justify-between text-neutral-400 text-xs font-bold uppercase mb-2">
                    <span>Resolution Scale</span>
                    <span className="text-amber-500">{Math.round(resolution * 100)}%</span>
                </div>
                <input 
                    type="range" min="0.25" max="1.5" step="0.05" 
                    value={resolution} 
                    onChange={(e) => setResolution(parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                />
                <p className="text-[10px] text-neutral-500 mt-2 text-center font-mono">
                    Adjust rendering quality. Higher values look sharper but require more GPU power.
                </p>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => onSave(resolution)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Save
                </button>
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold uppercase rounded-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;
