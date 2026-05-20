import React from 'react';
import { Wind, Droplets, Gauge, Cloud } from 'lucide-react';
import { WeatherData } from '../App';

interface ExtraWidgetProps {
  data: WeatherData | null;
  loading: boolean;
}

const ExtraWidget: React.FC<ExtraWidgetProps> = ({ data, loading }) => {
  
  if (loading) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 h-full w-full transition-colors min-h-[120px] lg:min-h-[140px]">
             <span className="text-xs text-slate-300 dark:text-slate-600">Loading...</span>
        </div>
      );
  }

  if (!data) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 h-full w-full transition-colors min-h-[120px] lg:min-h-[140px]">
             <Cloud className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
             <span className="text-[10px] text-slate-400">No Data</span>
        </div>
      );
  }

  // Determine AQI Status
  let aqiStatus = '优';
  let aqiColor = 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
  const aqi = data.aqi || 0;

  if (aqi > 50) { aqiStatus = '良'; aqiColor = 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'; }
  if (aqi > 100) { aqiStatus = '轻度'; aqiColor = 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'; }
  if (aqi > 150) { aqiStatus = '中度'; aqiColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'; }
  if (aqi > 200) { aqiStatus = '重度'; aqiColor = 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'; }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 lg:p-4 flex flex-col justify-between h-full shadow-sm border border-slate-100 dark:border-slate-700 transition-colors min-h-[120px] lg:min-h-[140px]">
      
      {/* Header: Title + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">空气质量</span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aqiColor}`}>
            {aqiStatus}
        </div>
      </div>

      {/* Main Value: AQI */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white">{aqi}</span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">AQI</span>
      </div>

      {/* Footer: Humidity & Wind Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span>湿度</span>
            </div>
            <span className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-200">{data.humidity}%</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Wind className="w-3 h-3 text-green-400" />
                <span>风速</span>
            </div>
            <span className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-200">{data.windSpeed} <span className="scale-75 inline-block origin-left">km/h</span></span>
        </div>
      </div>

    </div>
  );
};

export default ExtraWidget;