import React, { useMemo } from 'react';
import { 
  CloudSun, Sun, CloudRain, Cloud, CloudSnow, CloudFog, CloudLightning, 
  Loader2, MapPin, Thermometer 
} from 'lucide-react';
import { WeatherData } from '../App';

interface WeatherWidgetProps {
  data: WeatherData | null;
  loading: boolean;
}

const getWeatherInfo = (code: number) => {
  if (code === 0) return { label: '晴朗', icon: Sun, color: 'text-amber-500', bg: 'from-amber-500/10 to-transparent' };
  if (code >= 1 && code <= 3) return { label: '多云', icon: CloudSun, color: 'text-sky-500', bg: 'from-sky-500/10 to-transparent' };
  if ([45, 48].includes(code)) return { label: '雾霾', icon: CloudFog, color: 'text-slate-400', bg: 'from-slate-500/10 to-transparent' };
  if (code >= 51 && code <= 67) return { label: '小雨', icon: CloudRain, color: 'text-cyan-500', bg: 'from-cyan-500/10 to-transparent' };
  if (code >= 71 && code <= 77) return { label: '飘雪', icon: CloudSnow, color: 'text-indigo-400', bg: 'from-indigo-500/10 to-transparent' };
  if (code >= 80 && code <= 82) return { label: '阵雨', icon: CloudRain, color: 'text-blue-500', bg: 'from-blue-500/10 to-transparent' };
  if (code >= 95) return { label: '雷雨', icon: CloudLightning, color: 'text-violet-500', bg: 'from-violet-500/10 to-transparent' };
  return { label: '阴天', icon: Cloud, color: 'text-slate-400', bg: 'from-slate-500/10 to-transparent' };
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, loading }) => {
  const weatherInfo = useMemo(() => {
    return getWeatherInfo(data?.weatherCode ?? 0);
  }, [data?.weatherCode]);

  const WeatherIcon = weatherInfo.icon;

  // Temperature position percentage inside range
  const tempPosition = useMemo(() => {
    if (!data) return 50;
    const range = data.maxTemp - data.minTemp;
    if (range <= 0) return 50;
    const pct = ((data.temp - data.minTemp) / range) * 100;
    return Math.min(Math.max(pct, 5), 95);
  }, [data]);

  if (loading) {
    return (
      <div className="w-full h-full glass-panel rounded-3xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin mb-2" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Loading Weather</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full glass-panel rounded-3xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10">
        <Cloud className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Weather Offline</span>
      </div>
    );
  }

  return (
    <div className={`group relative w-full h-full glass-panel rounded-3xl p-4 flex flex-col justify-between shadow-sm dark:shadow-glass-dark border border-slate-200/60 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-amber-500/30 hover:shadow-glow-sm bg-gradient-to-br ${weatherInfo.bg}`}>
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="text-[10px] font-mono tracking-wider uppercase font-bold truncate max-w-[80px] lg:max-w-[120px]">
            {data.city || 'LOCATION'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
          <span>{weatherInfo.label}</span>
        </div>
      </div>

      {/* Main Temperature & Weather Icon */}
      <div className="flex items-center justify-between my-auto z-10 py-1">
        <div className="flex items-baseline">
          <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white tabular-nums">
            {data.temp}
          </span>
          <span className="text-xl lg:text-2xl font-light text-slate-400 dark:text-slate-500 ml-0.5">°C</span>
        </div>
        
        <div className="p-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/50 dark:border-white/10 shadow-sm transition-transform duration-200 group-hover:scale-110">
          <WeatherIcon className={`w-7 h-7 lg:w-8 lg:h-8 ${weatherInfo.color}`} />
        </div>
      </div>

      {/* High/Low Visual Range Bar */}
      <div className="z-10 pt-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1">
          <span>L: {data.minTemp}°</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">体感 {data.feelsLike ?? data.temp}°</span>
          <span>H: {data.maxTemp}°</span>
        </div>
        <div className="relative w-full h-1.5 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-500 opacity-80" />
          {/* Indicator Dot */}
          <div 
            className="absolute top-0 bottom-0 w-2 -ml-1 bg-white rounded-full shadow-sm ring-1 ring-black/20"
            style={{ left: `${tempPosition}%` }}
          />
        </div>
      </div>

      {/* Ambient background bloom */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

export default WeatherWidget;