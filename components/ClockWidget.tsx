import React, { useEffect, useState } from 'react';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secondRatio = seconds / 60;
  const minuteRatio = (minutes + secondRatio) / 60;
  const hourRatio = (hours + minuteRatio) / 12;

  // Format digital string
  const pad = (n: number) => n.toString().padStart(2, '0');
  const digitalTime = `${pad(time.getHours())}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className="group relative w-full h-full glass-panel rounded-3xl p-4 flex flex-col justify-between shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-glow-sm">
      {/* Top Header Label */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
          </span>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-slate-400 dark:text-slate-500">
            CHRONO
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
          UTC+8
        </span>
      </div>

      {/* Clock Face & Hands */}
      <div className="relative my-auto flex items-center justify-center py-1">
        <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-b from-slate-100/80 to-slate-200/40 dark:from-white/[0.04] dark:to-white/[0.01] p-1 shadow-inner border border-slate-200/50 dark:border-white/10 flex items-center justify-center">
          
          {/* Circular 12-Hour Tick Marks */}
          {[...Array(12)].map((_, i) => {
            const isQuarter = i % 3 === 0;
            return (
              <div
                key={i}
                className="absolute inset-0 flex justify-center"
                style={{ transform: `rotate(${i * 30}deg)` }}
              >
                <div
                  className={`rounded-full transition-colors ${
                    isQuarter
                      ? 'w-[2px] h-2.5 bg-slate-400 dark:bg-slate-300'
                      : 'w-[1px] h-1.5 bg-slate-300/80 dark:bg-slate-600/80'
                  }`}
                />
              </div>
            );
          })}

          {/* Clock Hands Container */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Hour Hand */}
            <div
              className="absolute w-1.5 h-6 lg:h-7 bg-slate-800 dark:bg-slate-100 rounded-full origin-bottom bottom-1/2 shadow-sm transition-transform duration-300"
              style={{ transform: `rotate(${hourRatio * 360}deg)` }}
            />
            {/* Minute Hand */}
            <div
              className="absolute w-1 h-8 lg:h-10 bg-slate-600 dark:bg-slate-300 rounded-full origin-bottom bottom-1/2 shadow-sm transition-transform duration-300 opacity-90"
              style={{ transform: `rotate(${minuteRatio * 360}deg)` }}
            />
            {/* Second Hand - High-vis Cyan/Blue Needle */}
            <div
              className="absolute w-0.5 h-9 lg:h-11 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full origin-bottom bottom-1/2 shadow-glow-sm z-30 transition-transform duration-100"
              style={{ transform: `rotate(${secondRatio * 360}deg)` }}
            />
            {/* Center Pin Jewel */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white ring-2 ring-blue-500 z-40 shadow-sm" />
          </div>
        </div>
      </div>

      {/* Digital Time Readout */}
      <div className="flex items-center justify-center z-10 pt-1">
        <span className="font-mono text-xs lg:text-sm font-semibold tracking-wider text-slate-700 dark:text-slate-200 tabular-nums">
          {digitalTime}
        </span>
      </div>

      {/* Ambient Radial Glow in Dark Mode */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

export default ClockWidget;