import React, { useEffect, useState } from 'react';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondRatio = time.getSeconds() / 60;
  const minuteRatio = (secondRatio + time.getMinutes()) / 60;
  const hourRatio = (minuteRatio + time.getHours()) / 12;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center w-full h-full shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors">
       {/* Clock Face */}
      <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center transition-colors">
        
        {/* Numbers 1-12 */}
        {[...Array(12)].map((_, i) => {
            const num = i + 1;
            const rotation = num * 30;
            return (
                <div
                    key={num}
                    className="absolute w-full h-full text-center pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <span 
                        className="inline-block text-[10px] lg:text-xs font-bold text-slate-600 dark:text-slate-400"
                        style={{ 
                            transform: `rotate(-${rotation}deg)`,
                            marginTop: '4px' // Adjusts distance from edge
                        }}
                    >
                        {num}
                    </span>
                </div>
            );
        })}

        {/* Hands Container (Centered) */}
        <div className="absolute inset-0 flex items-center justify-center">
            {/* Hour Hand */}
            <div
            className="absolute w-1.5 lg:w-2 h-6 lg:h-8 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom bottom-1/2 z-10"
            style={{ transform: `rotate(${hourRatio * 360}deg)` }}
            />
            
            {/* Minute Hand */}
            <div
            className="absolute w-1 lg:w-1.5 h-8 lg:h-11 bg-slate-600 dark:bg-slate-400 rounded-full origin-bottom bottom-1/2 z-20 opacity-90"
            style={{ transform: `rotate(${minuteRatio * 360}deg)` }}
            />
            
            {/* Second Hand (Blue) */}
            <div
            className="absolute w-0.5 h-9 lg:h-12 bg-blue-500 rounded-full origin-bottom bottom-1/2 z-30"
            style={{ transform: `rotate(${secondRatio * 360}deg)` }}
            />
            
            {/* Center Dot */}
            <div className="absolute w-2 h-2 lg:w-3 lg:h-3 bg-slate-800 dark:bg-slate-200 rounded-full z-40 shadow-sm" />
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;