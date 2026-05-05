
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      {/* Background Pulse Animation */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-black animate-pulse opacity-50"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-8 animate-bounce">
            GENERATING TERRAIN
        </h2>
        
        <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
             <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 w-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"></div>
        </div>

        <p className="mt-4 text-xs text-neutral-500 font-mono tracking-widest uppercase">
            Building World • Pre-loading Assets
        </p>
      </div>

      <style>{`
        @keyframes loading {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
