import React, { useEffect, useState } from 'react';

const DateWidget: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = dayNames[date.getDay()];

  // Format time as HH:MM:SS
  const timeString = date.toLocaleTimeString('en-GB', { hour12: false });
  const lunarText = "十月初六"; // Placeholder

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 lg:p-4 flex gap-3 lg:gap-4 items-center shadow-sm border border-slate-100 dark:border-slate-700 h-full w-full transition-colors relative overflow-hidden">
      
      {/* Date Box - Smaller on Mobile */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl lg:rounded-2xl p-1 lg:p-2 flex flex-col items-center justify-center w-12 h-12 lg:w-20 lg:h-20 shadow-lg shadow-red-500/30 shrink-0 z-10">
        <span className="text-[10px] lg:text-xs font-medium opacity-90">{month}月</span>
        <span className="text-xl lg:text-3xl font-bold leading-none">{day}</span>
      </div>

      <div className="flex flex-col z-10 min-w-0 justify-center">
        <div className="flex flex-col">
            <h2 className="text-sm lg:text-xl font-bold text-slate-800 dark:text-white leading-tight">{weekDay}</h2>
            <p className="text-[10px] lg:text-xs text-slate-400 dark:text-slate-500">{lunarText}</p>
        </div>
        <p className="text-sm lg:text-xl font-mono text-slate-800 dark:text-slate-200 tracking-wider font-medium mt-1 lg:mt-1">{timeString}</p>
      </div>
      
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-12 h-12 lg:w-16 lg:h-16 bg-slate-50 dark:bg-slate-700/30 rounded-full z-0 pointer-events-none"></div>
    </div>
  );
};

export default DateWidget;