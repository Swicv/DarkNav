import React, { useEffect, useState, useMemo } from 'react';
import { getLunarDateString } from '../utils/lunar';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';

const DateWidget: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const weekDay = dayNames[date.getDay()];

  // Calculate year progress percentage
  const yearProgress = useMemo(() => {
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    const current = date.getTime();
    const pct = ((current - start) / (end - start)) * 100;
    return pct.toFixed(1);
  }, [year, date]);

  const lunarText = useMemo(() => getLunarDateString(date), [date]);

  return (
    <div className="group relative w-full h-full glass-panel rounded-3xl p-4 flex flex-col justify-between shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-red-500/30 hover:shadow-glow-sm">
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-slate-400 dark:text-slate-500">
            CALENDAR
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
          <Sparkles className="w-2.5 h-2.5" />
          <span>{year}</span>
        </div>
      </div>

      {/* Main Date & Lunar Section */}
      <div className="flex items-center gap-3.5 my-auto z-10 py-1">
        {/* Vermilion Stamp Date Block */}
        <div className="relative shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-amber-600 p-[1px] shadow-lg shadow-rose-500/25 transition-transform duration-300 group-hover:scale-105">
          <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent rounded-[15px] flex flex-col items-center justify-center text-white">
            <span className="text-[10px] font-bold tracking-widest opacity-90">{month}月</span>
            <span className="text-xl lg:text-2xl font-extrabold leading-none tracking-tight">{day}</span>
          </div>
        </div>

        {/* Weekday & Lunar Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {weekDay}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {lunarText}
          </p>
        </div>
      </div>

      {/* Year Progress Bar */}
      <div className="z-10 pt-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1">
          <span>年进度</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">{yearProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-1000 shadow-sm"
            style={{ width: `${yearProgress}%` }}
          />
        </div>
      </div>

      {/* Ambient background bloom */}
      <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

export default DateWidget;