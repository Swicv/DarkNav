import React, { useMemo } from 'react';
import { Wind, Droplets, Activity, Cloud, Loader2 } from 'lucide-react';
import { WeatherData } from '../App';

interface ExtraWidgetProps {
  data: WeatherData | null;
  loading: boolean;
}

const ExtraWidget: React.FC<ExtraWidgetProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-full glass-panel rounded-3xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mb-2" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Loading AQI</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full glass-panel rounded-3xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10">
        <Cloud className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Sensors Offline</span>
      </div>
    );
  }

  const aqi = data.aqi || 0;

  // Determine AQI Tier & Theme
  const aqiConfig = useMemo(() => {
    if (aqi <= 50) return { label: '优 (Excellent)', color: 'text-emerald-500', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', glow: 'bg-emerald-500' };
    if (aqi <= 100) return { label: '良 (Good)', color: 'text-amber-500', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', glow: 'bg-amber-500' };
    if (aqi <= 150) return { label: '轻度污染', color: 'text-orange-500', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', glow: 'bg-orange-500' };
    if (aqi <= 200) return { label: '中度污染', color: 'text-red-500', bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', glow: 'bg-red-500' };
    return { label: '重度污染', color: 'text-purple-500', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', glow: 'bg-purple-500' };
  }, [aqi]);

  return (
    <div className="group relative w-full h-full glass-panel rounded-3xl p-4 flex flex-col justify-between shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-glow-sm">
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-slate-400 dark:text-slate-500">
            ATMOSPHERE
          </span>
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${aqiConfig.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${aqiConfig.glow} shadow-[0_0_6px_currentColor]`} />
          <span>{aqiConfig.label}</span>
        </div>
      </div>

      {/* Main AQI Value */}
      <div className="flex items-baseline gap-2 my-auto z-10 py-1">
        <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white tabular-nums">
          {aqi}
        </span>
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          AQI 指数
        </span>
      </div>

      {/* Microclimate Grid: Humidity & Wind */}
      <div className="grid grid-cols-2 gap-2 z-10 pt-1">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/5">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Droplets className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-mono uppercase text-slate-400">湿度</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {data.humidity}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/5">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Wind className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-mono uppercase text-slate-400">风速</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums truncate">
              {data.windSpeed} <span className="text-[9px] font-normal text-slate-400">km/h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Ambient background bloom */}
      <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

export default ExtraWidget;