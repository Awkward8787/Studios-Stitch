
import React, { useState, useEffect } from 'react';

interface OpeningSequenceProps {
  onComplete: () => void;
}

const OpeningSequence: React.FC<OpeningSequenceProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const bootLogs = [
    "BRIDGE_HANDSHAKE: INITIATED",
    "PROTOCOL: STUDIOS_STITCH_ARCHIVE_01",
    "DECRYPTING_ASSETS: 14% ... 38% ... 82%",
    "HOST: LOCALHOST:3001 // SECURE_SOCKET",
    "VERIFYING_RETAIL_GRADE: PASSED",
    "IDENTITY_MANIFEST: AUTH_REQUIRED",
    "SYNCING_INVENTORY: COMPLETED",
    "READY_FOR_DEPLOYMENT"
  ];

  useEffect(() => {
    // Phase 0: Scrolling logs
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < bootLogs.length) {
        setLogs(prev => [...prev, bootLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
        setTimeout(() => setPhase(1), 500);
      }
    }, 150);

    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    if (phase === 1) {
      setTimeout(() => setPhase(2), 1500);
    }
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Static */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        {/* Terminal Logs */}
        {phase === 0 && (
          <div className="space-y-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            {logs.map((log, i) => (
              <div key={i} className={i === logs.length - 1 ? "text-fuchsia-studio terminal-flicker" : ""}>
                <span className="text-zinc-800">>>></span> {log}
              </div>
            ))}
          </div>
        )}

        {/* Logo Reveal */}
        {phase >= 1 && (
          <div className={`transition-all duration-1000 flex flex-col items-center ${phase === 1 ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
            <div className="mb-12 logo-glow">
              <img 
                src="logo.png" 
                className="w-64 h-auto mx-auto grayscale invert animate-pulse" 
                alt="Studios Stitch"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Fallback Logo Text */}
              <div className="text-6xl font-black uppercase tracking-tighter italic text-center">
                Studios<span className="text-fuchsia-studio">Stitch</span>
              </div>
            </div>

            <div className="h-[1px] w-32 bg-zinc-900 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-fuchsia-studio animate-[scanline_2s_infinite]" />
            </div>

            <button 
              onClick={onComplete}
              className="group relative bg-white text-black px-12 py-5 font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:bg-fuchsia-studio hover:text-white stitch-corner"
            >
              Initialize Archive
              <div className="absolute -top-1 -left-1 text-fuchsia-studio text-xs">×</div>
              <div className="absolute -bottom-1 -right-1 text-fuchsia-studio text-xs">×</div>
            </button>
            
            <p className="mt-8 text-[8px] text-zinc-700 uppercase tracking-[0.5em] font-black italic">
              Terminal Release: v1.0.4-Production
            </p>
          </div>
        )}
      </div>

      {/* Decorative corners */}
      <div className="absolute top-12 left-12 w-24 h-[1px] bg-zinc-900" />
      <div className="absolute top-12 left-12 h-24 w-[1px] bg-zinc-900" />
      <div className="absolute bottom-12 right-12 w-24 h-[1px] bg-zinc-900" />
      <div className="absolute bottom-12 right-12 h-24 w-[1px] bg-zinc-900" />
    </div>
  );
};

export default OpeningSequence;
