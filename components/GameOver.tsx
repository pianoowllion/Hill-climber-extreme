
import React, { useState, useEffect } from 'react';

interface ScoreEntry {
  playerName: string;
  score: number;
  timestamp: number;
}

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
  
  // Leaderboard States
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim(), score: Math.floor(distance) }),
      });
      
      if (res.ok) {
        setHasSubmitted(true);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error("Failed to submit score", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center text-white overflow-hidden p-4 ${isWin ? 'bg-black/80' : 'bg-red-900/40'}`}>
      
      {/* Vignette for death */}
      {!isWin && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(220,38,38,0.4)_100%)]"></div>}

      <div className={`relative z-10 flex flex-col md:flex-row gap-6 max-w-4xl w-full animate-bounce-in`}>
        
        {/* Score & Controls Card */}
        <div className="flex-1 p-10 bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 text-center transition-transform">
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
                      <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Your Distance</span>
                      <span className="text-5xl font-mono font-bold text-white tracking-tighter">
                          {Math.floor(distance)}<span className="text-xl text-neutral-500 ml-1">M</span>
                      </span>
                  </div>
              </div>
          )}

          {/* Submission Form */}
          {!isWin && !hasSubmitted && (
            <form onSubmit={handleScoreSubmit} className="mb-8 p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
              <label className="block text-[10px] text-amber-500/80 uppercase tracking-widest font-bold mb-2">Submit to Global Leaderboard</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your Name"
                  maxLength={15}
                  required
                  className="flex-1 bg-black/60 border border-amber-900/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-700"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-tighter rounded-lg transition-colors"
                >
                  {isSubmitting ? '...' : 'Submit'}
                </button>
              </div>
            </form>
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

        {/* Global Leaderboard Card */}
        <div className="flex-1 p-6 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-amber-500 font-black text-xl italic uppercase tracking-tighter">Top 10 Legends</h3>
            <div className="h-px flex-1 mx-4 bg-amber-900/40"></div>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-neutral-600 text-xs animate-pulse">Loading Scores...</div>
            ) : leaderboard.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-600 text-xs italic">No legends yet. Be the first!</div>
            ) : (
              leaderboard.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    index === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-black/20 border-white/5'
                  }`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${
                    index === 0 ? 'bg-amber-500 text-black' : 
                    index === 1 ? 'bg-neutral-300 text-black' :
                    index === 2 ? 'bg-orange-700 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="flex-1 font-bold truncate text-sm">{entry.playerName}</span>
                  <span className="font-mono text-amber-500 font-bold">{Math.floor(entry.score)}<span className="text-[10px] ml-0.5">M</span></span>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center px-2">
            <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Global Ranking</span>
            <button onClick={fetchLeaderboard} className="text-amber-500/50 hover:text-amber-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"></path></svg>
            </button>
          </div>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </div>
  );
};

export default GameOver;
