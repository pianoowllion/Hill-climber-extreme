
import React from 'react';

interface GameOverProps {
  title?: string;
  message?: string;
  distance: number;
  bestDistance: number;
  isWin?: boolean;
  onRestart: () => void;
  onMenu?: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ title = "Wasted", message = "You flipped the car!", distance, bestDistance, isWin = false, onRestart, onMenu }) => {
  const isNewRecord = !isWin && distance > bestDistance && bestDistance > 0;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center text-white overflow-hidden ${isWin ? 'bg-black/80' : 'bg-red-900/40'}`}>
      
      {/* Vignette for death */}
      {!isWin && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(220,38,38,0.4)_100%)]"></div>}

      <div className={`relative z-10 p-10 bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full text-center animate-bounce-in transform hover:scale-[1.01] transition-transform`}>
        
        <div className="mb-6">
             <h2 className={`text-6xl font-black italic uppercase tracking-tighter drop-shadow-xl ${isWin ? 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600' : 'text-red-500'}`}>{title}</h2>
             <div className={`h-1 w-24 mx-auto mt-2 rounded-full ${isWin ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}></div>
        </div>
        
        <p className="text-neutral-300 mb-8 font-serif italic text-lg tracking-wide">{message}</p>

        {!isWin && (
            <div className="mb-8 p-4 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group">
                {isNewRecord && (
                    <div className="absolute -right-8 top-4 bg-amber-500 text-black text-[10px] font-bold px-8 py-1 rotate-45 shadow-lg">NEW BEST</div>
                )}
                
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Distance</span>
                    <span className="text-5xl font-mono font-bold text-white tracking-tighter">
                        {Math.floor(distance)}<span className="text-xl text-neutral-500 ml-1">M</span>
                    </span>
                </div>
            </div>
        )}

        <div className="space-y-3">
            <button
                onClick={onRestart}
                className={`w-full py-4 font-black text-sm tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg hover:shadow-2xl active:scale-95 border-2 ${
                    isWin 
                    ? 'bg-emerald-500 border-emerald-400 hover:bg-emerald-400 text-black' 
                    : 'bg-white border-white hover:bg-neutral-200 text-black'
                }`}
            >
                {isWin ? 'Next Level' : 'Try Again'}
            </button>

            {onMenu && (
                <button
                onClick={onMenu}
                className="w-full py-4 bg-transparent border-2 border-neutral-700 text-neutral-400 font-bold text-xs tracking-[0.2em] uppercase rounded-xl hover:bg-neutral-800 hover:text-white hover:border-neutral-500 transition-all"
                >
                Main Menu
                </button>
            )}
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-in {
            0% { transform: scale(0.9); opacity: 0; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); }
        }
        .animate-bounce-in {
            animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default GameOver;
