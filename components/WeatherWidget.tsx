import React from 'react';
import { CloudSun, Sun, CloudRain, Cloud, CloudSnow, CloudFog, CloudLightning, Loader2, MapPin } from 'lucide-react';
import { WeatherData } from '../App';

interface WeatherWidgetProps {
  data: WeatherData | null;
  loading: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, loading }) => {
  
  const getWeatherIcon = (code: number, className: string) => {
    if (code === 0) return <Sun className={className} />;
    if (code >= 1 && code <= 3) return <CloudSun className={className} />;
    if ([45, 48].includes(code)) return <CloudFog className={className} />;
    if (code >= 51 && code <= 67) return <CloudRain className={className} />;
    if (code >= 71 && code <= 77) return <CloudSnow className={className} />;
    if (code >= 80 && code <= 82) return <CloudRain className={className} />;
    if (code >= 95) return <CloudLightning className={className} />;
    return <Cloud className={className} />;
  };

  if (loading) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 h-full w-full transition-colors min-h-[140px]">
             <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )
  }

  if (!data) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 h-full w-full transition-colors min-h-[140px]">
             <Cloud className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
             <span className="text-[10px] text-slate-400">No Data</span>
        </div>
      );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 lg:p-4 flex flex-col justify-between shadow-sm border border-slate-100 dark:border-slate-700 h-full w-full transition-colors min-h-[140px] relative overflow-hidden">
      
      <div className="flex justify-between items-start">
        <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 gap-1 uppercase tracking-wide">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[60px] lg:max-w-none">{data.city}</span>
        </div>
        <span className="text-[10px] text-slate-400">今日</span>
      </div>

      <div className="flex items-center gap-2 my-1">
           {getWeatherIcon(data.weatherCode, "w-6 h-6 lg:w-8 lg:h-8 text-orange-400")}
           <span className="text-2xl lg:text-4xl font-bold text-slate-800 dark:text-white">{data.temp}°</span>
      </div>
      
      <div className="flex gap-2 text-[10px] lg:text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span>H:{data.maxTemp}°</span>
          <span>L:{data.minTemp}°</span>
      </div>

       {/* Decorative */}
       <div className="absolute -bottom-6 -right-6 w-16 h-16 lg:w-20 lg:h-20 bg-orange-50 dark:bg-orange-900/10 rounded-full pointer-events-none"></div>
    </div>
  );
};

export default WeatherWidget;