
import React from 'react';
import { GameMode } from '../types';

interface MainMenuProps {
  onStart: (mode: GameMode) => void;
  onOpenGarage: () => void;
  onOpenMapSelect: () => void;
  onOpenMapMaker: () => void;
  onOpenCarMaker: () => void;
  onOpenSettings: () => void;
  bestDistance: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onOpenGarage, onOpenMapSelect, onOpenMapMaker, onOpenCarMaker, onOpenSettings, bestDistance }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-black/40">
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-500 to-amber-700 drop-shadow-2xl">
            HILL <br/> CLIMBER
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-4"></div>
          <p className="mt-4 text-neutral-400 font-serif tracking-widest text-xs uppercase">Premium Racing Experience</p>
        </div>

        {/* Stats */}
        <div className="mb-10 w-full flex justify-center">
            <div className="px-6 py-3 border border-neutral-700 bg-neutral-900/90 rounded-full flex flex-col items-center shadow-inner">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Personal Best</span>
                <span className="text-2xl font-mono text-amber-500 drop-shadow-md">{Math.floor(bestDistance)} <span className="text-sm">M</span></span>
            </div>
        </div>

        {/* Main Actions */}
        <div className="w-full space-y-4">
            <button
                onClick={() => onStart('INFINITE')}
                className="w-full group relative py-4 bg-gradient-to-r from-neutral-800/95 to-neutral-700/95 border border-neutral-600 hover:border-amber-500/50 rounded-lg overflow-hidden transition-all duration-300 shadow-lg hover:shadow-amber-900/20 active:scale-95"
            >
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col items-center relative z-10">
                    <span className="text-xl font-bold tracking-wider group-hover:text-amber-400 transition-colors">ENDLESS RUN</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-1">Push The Limit</span>
                </div>
            </button>

            <button
                onClick={() => onStart('LEVELS')}
                className="w-full group relative py-4 bg-gradient-to-r from-neutral-800/95 to-neutral-700/95 border border-neutral-600 hover:border-amber-500/50 rounded-lg overflow-hidden transition-all duration-300 shadow-lg hover:shadow-amber-900/20 active:scale-95"
            >
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col items-center relative z-10">
                    <span className="text-xl font-bold tracking-wider group-hover:text-amber-400 transition-colors">CAMPAIGN</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-1">Master The Tracks</span>
                </div>
            </button>
        </div>

        {/* Secondary Actions */}
        <div className="w-full grid grid-cols-3 gap-3 mt-4">
             <button
              onClick={onOpenGarage}
              className="py-3 bg-neutral-800/90 border border-neutral-700 hover:bg-neutral-750 hover:border-neutral-500 rounded-lg transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">🏎️</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 group-hover:text-white transition-colors">Garage</span>
            </button>
            <button
              onClick={onOpenMapSelect}
              className="py-3 bg-neutral-800/90 border border-neutral-700 hover:bg-neutral-750 hover:border-neutral-500 rounded-lg transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">🗺️</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 group-hover:text-white transition-colors">Maps</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="py-3 bg-neutral-800/90 border border-neutral-700 hover:bg-neutral-750 hover:border-neutral-500 rounded-lg transition-all flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">⚙</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 group-hover:text-white transition-colors">Settings</span>
            </button>
        </div>
        
        {/* Editor Tools */}
        <div className="w-full grid grid-cols-2 gap-4 mt-4">
            <button onClick={onOpenMapMaker} className="py-3 bg-neutral-900/80 border border-neutral-700 hover:border-amber-500/50 hover:bg-neutral-800 rounded-lg transition-all text-[10px] uppercase font-bold tracking-wider text-neutral-400 hover:text-white shadow-lg">
                Map Editor
            </button>
            <button onClick={onOpenCarMaker} className="py-3 bg-neutral-900/80 border border-neutral-700 hover:border-amber-500/50 hover:bg-neutral-800 rounded-lg transition-all text-[10px] uppercase font-bold tracking-wider text-neutral-400 hover:text-white shadow-lg">
                Car Builder
            </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-8 text-neutral-500 text-[10px] font-mono tracking-widest drop-shadow-md">
         HILL CLIMBER EXTREME • v2.2 HD EDITION
      </div>
    </div>
  );
};

export default MainMenu;
