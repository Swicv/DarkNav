import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronRight, User, Plus, Edit2, Compass, Moon, Sun, Trash2, 
  Menu, X, Download, Upload, Loader2, ArrowUp, ArrowDown, Lock,
  ExternalLink, Copy, Check, Sparkles, ShieldCheck
} from 'lucide-react';
import { INITIAL_DATA, ICON_MAP } from './constants';
import { AppData, LinkItem, Category, SearchEngine } from './types';
import Favicon from './components/Favicon';
import DateWidget from './components/DateWidget';
import WeatherWidget from './components/WeatherWidget';
import ClockWidget from './components/ClockWidget';
import ExtraWidget from './components/ExtraWidget';
import SearchBar from './components/SearchBar';
import AdminModal from './components/AdminModal';
import EditModal from './components/EditModal';
import CategoryModal from './components/CategoryModal';
import ChangePasswordModal from './components/ChangePasswordModal';

const toPublicData = (appData: AppData): AppData => {
  const { adminPassword, ...publicData } = appData;
  return publicData;
};

const isSafeHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getSafeHttpUrl = (value: string): string | null => {
  if (!isSafeHttpUrl(value)) return null;
  return value;
};

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const useStickyState = <T,>(defaultValue: T, key: string, oldKey?: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue !== null) {
      try {
        return JSON.parse(stickyValue);
      } catch {
        window.localStorage.removeItem(key);
      }
    }
    
    if (oldKey) {
      const oldStickyValue = window.localStorage.getItem(oldKey);
      if (oldStickyValue !== null) {
        try {
          return JSON.parse(oldStickyValue);
        } catch {
          window.localStorage.removeItem(oldKey);
        }
      }
    }
    
    return defaultValue;
  });
  
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
};

// HTML Bookmark Parser
const parseBookmarksHtml = (htmlContent: string): Category[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const categories: Category[] = [];
  
  const h3s = doc.getElementsByTagName('h3');
  
  Array.from(h3s).forEach((h3, index) => {
    const categoryTitle = h3.textContent || '未命名分类';
    const nextSibling = h3.nextElementSibling;
    
    if (nextSibling && (nextSibling.tagName === 'DL' || nextSibling.tagName === 'P')) {
      const targetDL = nextSibling.tagName === 'DL' ? nextSibling : nextSibling.querySelector('dl') || nextSibling.nextElementSibling;
      
      if (targetDL && targetDL.tagName === 'DL') {
        const links: LinkItem[] = [];
        const anchors = targetDL.getElementsByTagName('a');
        
        Array.from(anchors).forEach((a, lIndex) => {
          if (!isSafeHttpUrl(a.href)) return;
          const icon = a.getAttribute('icon');
          links.push({
            id: `import-${index}-${lIndex}-${Date.now()}`,
            title: a.textContent || '无标题',
            url: a.href,
            icon: icon && isSafeHttpUrl(icon) ? icon : '' // Leave empty so Favicon multi-tier engine gracefully resolves
          });
        });

        if (links.length > 0) {
          categories.push({
            id: `cat-import-${index}-${Date.now()}`,
            title: categoryTitle,
            iconName: 'Folder',
            items: links
          });
        }
      }
    }
  });
  return categories;
};

export interface WeatherData {
  temp: number;
  weatherCode: number;
  minTemp: number;
  maxTemp: number;
  windSpeed: number;
  humidity: number;
  feelsLike: number;
  city: string;
  daily: any;
  aqi: number;
}

const App: React.FC = () => {
  // SWR Instant Local Cache: Zero-millisecond first paint without waiting for network
  const [data, setData] = useState<AppData>(() => {
    try {
      const cached = window.localStorage.getItem('cosmonav_cached_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.categories)) return parsed;
      }
    } catch {}
    return INITIAL_DATA;
  });
  const [dataLoading, setDataLoading] = useState(() => {
    return !window.localStorage.getItem('cosmonav_cached_data');
  });
  
  const [darkMode, setDarkMode] = useStickyState(false, 'darknav-theme', 'flatnav-theme');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(''); 
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = window.localStorage.getItem('cosmonav_cached_weather');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [weatherLoading, setWeatherLoading] = useState(() => {
    return !window.localStorage.getItem('cosmonav_cached_weather');
  });
  
  // Search State
  const [searchEngine, setSearchEngine] = useStickyState<SearchEngine>('local', 'darknav-search-engine', 'flatnav-search-engine');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LinkItem | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string>('');

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync dark class on html root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // High-performance Spotlight mouse tracking (throttled by requestAnimationFrame)
  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        rafId = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Global Keyboard shortcuts (/ for search, D for theme toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Quick search shortcut: '/' or '⌘K' / 'Ctrl+K'
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Quick theme toggle shortcut: 'd' or 'D'
      if ((e.key === 'd' || e.key === 'D') && !isInput && !e.metaKey && !e.ctrlKey) {
        setDarkMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDarkMode]);

  // Fetch initial data with silent background SWR update
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && Array.isArray(serverData.categories)) {
          setData(serverData);
          try {
            window.localStorage.setItem('cosmonav_cached_data', JSON.stringify(serverData));
          } catch {}
          if (serverData.categories.length > 0 && !activeCategory) {
            setActiveCategory(serverData.categories[0].id);
          }
        } else if (!data || data.categories.length === 0) {
          setData(INITIAL_DATA);
        }
      }
    } catch (error) {
      if (!data || data.categories.length === 0) {
        setData(INITIAL_DATA);
      }
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const saveDataToServer = async (newData: AppData): Promise<boolean> => {
    if (!isAdmin || !sessionPassword) {
      alert('请先登录管理员账号');
      fetchData();
      return false;
    }
    setData(toPublicData(newData)); 
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': sessionPassword 
        },
        body: JSON.stringify(newData)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`保存失败：${err.error || '未知错误'}`);
        fetchData(); 
        return false;
      }
      return true;
    } catch (error) {
      alert('保存失败：网络错误');
      fetchData(); 
      return false;
    }
  };

  const handleLogin = async (pwd: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      if (!res.ok) return false;
      setIsAdmin(true);
      setSessionPassword(pwd);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Weather Logic
  useEffect(() => {
    let isMounted = true;

    const DEFAULT_WEATHER: WeatherData = {
      temp: 22,
      weatherCode: 1,
      minTemp: 16,
      maxTemp: 25,
      windSpeed: 8,
      humidity: 55,
      feelsLike: 22,
      city: '本地',
      daily: {
        weather_code: [1],
        temperature_2m_max: [25],
        temperature_2m_min: [16]
      },
      aqi: 45
    };

    const fetchWeather = async (lat?: number, lon?: number, cityName?: string) => {
      try {
        const queryParams = new URLSearchParams();
        if (lat !== undefined && lon !== undefined) {
          queryParams.set('lat', lat.toString());
          queryParams.set('lon', lon.toString());
        }
        if (cityName) queryParams.set('city', cityName);

        const qs = queryParams.toString();
        const res = await fetch(`/api/weather${qs ? `?${qs}` : ''}`, {
          signal: AbortSignal.timeout(6000)
        });

        if (res.ok) {
          const weatherJson = await res.json();
          if (weatherJson && typeof weatherJson.temp === 'number') {
            if (isMounted) {
              setWeather(weatherJson);
              try {
                window.localStorage.setItem('cosmonav_cached_weather', JSON.stringify(weatherJson));
              } catch {}
              setWeatherLoading(false);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Backend /api/weather unavailable, trying fallback...', err);
      }

      // Fallback directly to Open-Meteo
      try {
        let targetLat = lat ?? 39.9042;
        let targetLon = lon ?? 116.4074;
        let targetCity = cityName || '本地';

        if (lat === undefined || lon === undefined) {
          try {
            const ipRes = await fetch('/api/ip', { signal: AbortSignal.timeout(3000) });
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.status !== 'fail' && ipData.lat && ipData.lon) {
                targetLat = ipData.lat;
                targetLon = ipData.lon;
                targetCity = ipData.city || '本地';
              }
            }
          } catch (e) {}
        }

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
          { signal: AbortSignal.timeout(5000) }
        );
        const weatherData = await weatherRes.json();

        let aqiValue = 0;
        try {
          const aqiRes = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${targetLat}&longitude=${targetLon}&current=us_aqi`,
            { signal: AbortSignal.timeout(3000) }
          );
          const aqiData = await aqiRes.json();
          if (aqiData.current?.us_aqi !== undefined) aqiValue = aqiData.current.us_aqi;
        } catch (e) {}

        if (weatherData.current && isMounted) {
          setWeather({
            temp: Math.round(weatherData.current.temperature_2m),
            weatherCode: weatherData.current.weather_code,
            minTemp: Math.round(weatherData.daily?.temperature_2m_min?.[0] ?? weatherData.current.temperature_2m),
            maxTemp: Math.round(weatherData.daily?.temperature_2m_max?.[0] ?? weatherData.current.temperature_2m),
            windSpeed: Math.round(weatherData.current.wind_speed_10m),
            humidity: Math.round(weatherData.current.relative_humidity_2m),
            feelsLike: Math.round(weatherData.current.apparent_temperature),
            city: targetCity,
            daily: weatherData.daily,
            aqi: aqiValue
          });
          setWeatherLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Fallback weather fetch failed', err);
      }

      if (isMounted) {
        setWeather(DEFAULT_WEATHER);
        setWeatherLoading(false);
      }
    };

    fetchWeather();

    if (navigator.geolocation && window.isSecureContext) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            fetchWeather(position.coords.latitude, position.coords.longitude, '本地');
          }
        },
        () => {},
        { timeout: 2500, maximumAge: 300000 }
      );
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Search Logic
  const handleSearch = () => {
    if (searchEngine === 'local') return;
    
    const engines: Record<SearchEngine, string> = {
      google: 'https://www.google.com/search?q=',
      bing: 'https://www.bing.com/search?q=',
      baidu: 'https://www.baidu.com/s?wd=',
      local: ''
    };
    
    if (searchQuery.trim() && engines[searchEngine]) {
      window.open(`${engines[searchEngine]}${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  // Filter Categories for Local Search
  const displayCategories = useMemo(() => {
    if (searchEngine !== 'local' || !searchQuery.trim()) {
      return data.categories;
    }
    
    const q = searchQuery.toLowerCase().trim();
    return data.categories.map((cat) => {
      const filteredItems = cat.items.filter((item) => 
        item.title.toLowerCase().includes(q) || 
        item.url.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
      return { ...cat, items: filteredItems };
    }).filter((cat) => cat.items.length > 0);
  }, [data.categories, searchEngine, searchQuery]);

  // Total bookmark count
  const totalBookmarkCount = useMemo(() => {
    return data.categories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [data.categories]);

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    setSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const main = document.querySelector('main');
      if (main) {
        const mainTop = main.getBoundingClientRect().top;
        const elTop = element.getBoundingClientRect().top;
        main.scrollTo({ top: main.scrollTop + elTop - mainTop - 24, behavior: 'smooth' });
      }
    }
  };

  const handleCopyLink = (e: React.MouseEvent, url: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  const handleSaveLink = (item: LinkItem) => {
    if (!isSafeHttpUrl(item.url)) {
      alert('链接 URL 只支持 http:// 或 https://');
      return;
    }
    if (item.icon && !isSafeHttpUrl(item.icon)) {
      alert('图标 URL 只支持 http:// 或 https://');
      return;
    }
    const newCategories = data.categories.map((cat) => {
      if (cat.id === editingCategoryId) {
        const existingIndex = cat.items.findIndex((i) => i.id === item.id);
        if (existingIndex > -1) {
          const newItems = [...cat.items]; 
          newItems[existingIndex] = item; 
          return { ...cat, items: newItems };
        } else { 
          return { ...cat, items: [...cat.items, item] }; 
        }
      } 
      return cat;
    });
    saveDataToServer({ ...data, categories: newCategories });
  };

  const handleDeleteLink = (itemId: string) => {
    const newCategories = data.categories.map((cat) => {
      if (cat.id === editingCategoryId) { 
        return { ...cat, items: cat.items.filter((i) => i.id !== itemId) }; 
      } 
      return cat;
    });
    saveDataToServer({ ...data, categories: newCategories });
  };

  const handleSaveCategory = (category: { title: string; iconName: string }) => {
    let newCategories;
    if (editingCategory) {
      newCategories = data.categories.map((c) => c.id === editingCategory.id ? { ...c, title: category.title, iconName: category.iconName } : c);
      setData({ ...data, categories: newCategories });
      saveDataToServer({ ...data, categories: newCategories });
    } else {
      const newCategory: Category = { id: `c${Date.now()}`, title: category.title, iconName: category.iconName, items: [] };
      newCategories = [...data.categories, newCategory];
      setData({ ...data, categories: newCategories });
      saveDataToServer({ ...data, categories: newCategories });
      setTimeout(() => scrollToCategory(newCategory.id), 100);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('确定要删除此分类及其所有内容吗？')) {
      const newCategories = data.categories.filter((c) => c.id !== id);
      saveDataToServer({ ...data, categories: newCategories });
      if (activeCategory === id && newCategories.length > 0) setActiveCategory(newCategories[0].id);
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.categories.length - 1) return;
    const newCategories = [...data.categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    saveDataToServer({ ...data, categories: newCategories });
  };

  const handleChangePassword = async (newPassword: string) => {
    const success = await saveDataToServer({ ...data, adminPassword: newPassword });
    if (success) {
      setSessionPassword(newPassword);
      alert('安全密码修改成功！');
    }
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith('.html') || content.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>')) {
          const importedCategories = parseBookmarksHtml(content);
          if (importedCategories.length > 0) {
            if (window.confirm(`解析到 ${importedCategories.length} 个分类，是否追加到当前导航？`)) {
              saveDataToServer({ ...data, categories: [...data.categories, ...importedCategories] })
                .then((success) => success && alert('书签导入成功！'));
            }
          } else {
            alert('未能在 HTML 文件中识别出书签结构');
          }
        } else {
          const parsedData = JSON.parse(content);
          if (parsedData && Array.isArray(parsedData.categories)) {
            if (window.confirm('JSON 导入将覆盖当前所有数据，确定继续吗？')) {
              saveDataToServer(parsedData)
                .then((success) => success && alert('导入成功，已同步至服务器！'));
            }
          } else {
            alert('无效的配置文件格式');
          }
        }
      } catch (err) {
        alert('解析文件失败');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddLinkModal = (catId: string) => { 
    setEditingItem(null); 
    setEditingCategoryId(catId); 
    setEditModalOpen(true); 
  };
  
  const openEditLinkModal = (item: LinkItem, catId: string) => { 
    setEditingItem(item); 
    setEditingCategoryId(catId); 
    setEditModalOpen(true); 
  };
  
  const openCategoryModal = (category?: Category) => { 
    setEditingCategory(category || null); 
    setCategoryModalOpen(true); 
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cosmonav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-500 relative ${darkMode ? 'dark' : ''}`}>
      
      {/* Background Ambient Aurora Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-[140px] dark:from-indigo-600/15 dark:via-purple-600/10 animate-float" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-cyan-500/10 via-sky-500/10 to-transparent blur-[140px] dark:from-cyan-500/10 dark:via-blue-600/10 animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute -bottom-[20%] left-[25%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-rose-500/5 via-amber-500/5 to-transparent blur-[140px] dark:from-rose-500/5 dark:via-cyan-500/5" />
      </div>

      <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json,.html" />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* High-craft Sidebar Dock */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass-panel bg-white/80 dark:bg-cosmos-900/80 border-r border-slate-200/70 dark:border-white/[0.08] flex flex-col justify-between shrink-0 transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Brand Header */}
          <div className="p-6 mb-2 shrink-0 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12">
                <Compass className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base lg:text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                    Cosmo's Nav
                  </h1>
                  {isAdmin && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30 animate-pulse" title="管理中" />
                  )}
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
                  DASHBOARD
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Category List */}
          <div className="px-4 flex-1 overflow-y-auto no-scrollbar py-2">
            <div className="flex items-center justify-between mb-3 px-3">
              <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                导航分类 ({data.categories.length})
              </span>
              <div className="h-[1px] bg-slate-200/60 dark:bg-white/10 flex-1 ml-3" />
            </div>

            <nav className="space-y-1.5 pb-4">
              {displayCategories.map((cat, index) => {
                const Icon = ICON_MAP[cat.iconName] || ICON_MAP['LayoutGrid'];
                const isActive = activeCategory === cat.id;
                const itemCount = cat.items.length;
                return (
                  <div key={cat.id} className="group relative flex flex-col">
                    <div className="flex items-center w-full">
                      <button 
                        onClick={() => scrollToCategory(cat.id)} 
                        className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/20 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:scale-110'}`} />
                          <span className="truncate text-left">{cat.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono opacity-60 px-1.5 py-0.5 rounded-md bg-slate-200/50 dark:bg-white/5">
                            {itemCount}
                          </span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        </div>
                      </button>
                    </div>

                    {/* Admin Actions for Category */}
                    {isAdmin && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-cosmos-850 shadow-md rounded-xl p-1 border border-slate-200 dark:border-white/10 z-10">
                        <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'up'); }} disabled={index === 0} className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 ${index === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`} title="上移"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'down'); }} disabled={index === data.categories.length - 1} className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 ${index === data.categories.length - 1 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`} title="下移"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); openCategoryModal(cat); }} className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/20 text-blue-500" title="编辑"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-500" title="删除"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Admin Panel Actions */}
              {isAdmin && (
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => openCategoryModal()} 
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-white/15 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加新分类</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleExportData} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="导出配置 JSON"><Download className="w-3.5 h-3.5" /><span>导出</span></button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="导入书签 (JSON/HTML)"><Upload className="w-3.5 h-3.5" /><span>导入</span></button>
                  </div>
                  <button onClick={() => setShowChangePwdModal(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"><Lock className="w-3 h-3" /><span>修改后台密码</span></button>
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-200/50 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-cosmos-950/40">
          {/* Day / Night Theme Toggle */}
          <div className="flex items-center p-1 mb-3 bg-slate-200/60 dark:bg-white/5 rounded-2xl border border-slate-300/40 dark:border-white/5">
            <button 
              onClick={() => setDarkMode(false)} 
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${!darkMode ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              title="切换亮色模式"
            >
              <Sun className="w-4 h-4" />
              <span>日昼</span>
            </button>
            <button 
              onClick={() => setDarkMode(true)} 
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'bg-cosmos-800 shadow-sm text-cyan-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              title="切换暗色模式"
            >
              <Moon className="w-4 h-4" />
              <span>极夜</span>
            </button>
          </div>

          {/* Admin Login / Logout */}
          <button 
            onClick={() => { 
              if (isAdmin) { 
                setIsAdmin(false); 
                setSessionPassword(''); 
              } else { 
                setShowAdminModal(true); 
              } 
            }} 
            className={`w-full py-2.5 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md ${
              isAdmin
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>退出管理系统</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>管理员登录</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-x-hidden relative z-10">
        
        {/* Mobile Top App Bar */}
        <header className="lg:hidden h-16 glass-panel border-b border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between px-4 shrink-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500" />
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              Cosmo's Nav
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-10 transition-colors duration-500">
          
          {/* Top Bento Dashboard Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-6 mb-8 lg:mb-10 auto-rows-fr max-w-[1600px] mx-auto">
            <div className="col-span-1 lg:col-span-3 min-h-[140px]"><DateWidget /></div>
            <div className="col-span-1 lg:col-span-4 min-h-[140px]"><WeatherWidget data={weather} loading={weatherLoading} /></div>
            <div className="col-span-1 lg:col-span-2 min-h-[140px]"><ClockWidget /></div>
            <div className="col-span-1 lg:col-span-3 min-h-[140px]"><ExtraWidget data={weather} loading={weatherLoading} /></div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 lg:mb-8 relative z-30">
            <SearchBar 
              engine={searchEngine} 
              onEngineChange={setSearchEngine} 
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSearch={handleSearch}
            />
          </div>



          {/* Empty search / loading state */}
          {displayCategories.length === 0 && (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              {dataLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs font-mono tracking-widest uppercase">Syncing Dashboard</span>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                  <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {searchEngine === 'local' && searchQuery ? `未匹配到与 "${searchQuery}" 相关的书签` : '当前暂无书签数据'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAdmin ? '点击分类标题旁的 + 号添加书签，或从左下角导入 HTML 书签' : '请先登录管理员账号后添加书签'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bookmarks Section Grid */}
          <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
            {displayCategories.map((category) => {
              const Icon = ICON_MAP[category.iconName] || ICON_MAP['LayoutGrid'];
              return (
                <section 
                  key={category.id} 
                  id={category.id} 
                  className="scroll-mt-24 lg:scroll-mt-10 animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                  {/* Category Header */}
                  <div className="glass-panel bg-white/70 dark:bg-cosmos-900/60 rounded-t-3xl p-5 sm:p-6 border-b border-slate-200/50 dark:border-white/[0.08] flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                          {category.title}
                        </h2>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {category.items.length} 个快捷入口
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button 
                        onClick={() => openAddLinkModal(category.id)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all text-xs font-semibold"
                        title="在此分类下添加书签"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">添加书签</span>
                      </button>
                    )}
                  </div>

                  {/* Bookmark Cards Bento Grid */}
                  <div className="glass-panel bg-slate-50/50 dark:bg-cosmos-950/30 rounded-b-3xl p-4 sm:p-6 border border-t-0 border-slate-200/70 dark:border-white/[0.08] shadow-sm transition-colors">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                      {category.items.map((link) => {
                        const safeUrl = getSafeHttpUrl(link.url);
                        const domain = extractDomain(link.url);
                        const isCopied = copiedId === link.id;

                        return (
                          <div 
                            key={link.id} 
                            className="spotlight-card group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/70 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-blue-500/40 dark:hover:border-blue-400/40 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] transition-all duration-300"
                          >
                            <a
                              href={safeUrl || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-disabled={!safeUrl}
                              className={`flex items-start gap-3.5 min-w-0 ${!safeUrl ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                              {/* Intelligent Multi-Tier Favicon */}
                              <Favicon url={link.url} icon={link.icon} title={link.title} size="md" />

                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {link.title}
                                  </h3>
                                </div>
                                
                                {link.description ? (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5" title={link.description}>
                                    {link.description}
                                  </p>
                                ) : (
                                  <p className="text-[11px] font-mono text-slate-400/70 dark:text-slate-500/70 truncate mt-0.5">
                                    {domain}
                                  </p>
                                )}
                              </div>
                            </a>

                            {/* Card Hover Micro-Actions Dock */}
                            <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-slate-400/60 dark:text-slate-600 mr-auto truncate max-w-[120px]">
                                {domain}
                              </span>

                              {/* Copy Link Button */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyLink(e, link.url, link.id)}
                                className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${isCopied ? '!opacity-100 text-emerald-500' : ''}`}
                                title={isCopied ? '已复制链接！' : '复制网址'}
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Admin Edit Link Button */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openEditLinkModal(link, category.id);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="编辑书签"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* External Jump Arrow */}
                              <a
                                href={safeUrl || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                title="打开链接"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                          </div>
                        );
                      })}

                      {/* Empty Category Hint */}
                      {category.items.length === 0 && (
                        <div className="col-span-full py-10 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-white/[0.02]">
                          暂无收录，点击右上角 + 即可添加
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
          
          {/* Awwwards Style Footer */}
          <footer className="py-8 mt-12 text-center text-xs font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Cosmo's Nav</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>© 2025-2026</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>总收录: {totalBookmarkCount} 站点</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>快捷键: <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-white/10 rounded font-mono text-[10px]">/</kbd> 搜索</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-white/10 rounded font-mono text-[10px]">D</kbd> 极昼/极夜</span>
            </div>
          </footer>

        </main>
      </div>

      {/* Global Modals */}
      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} onLogin={handleLogin} />
      <EditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} initialData={editingItem} onSave={handleSaveLink} onDelete={handleDeleteLink} />
      <CategoryModal isOpen={categoryModalOpen} onClose={() => { setCategoryModalOpen(false); setEditingCategory(null); }} onSave={handleSaveCategory} initialData={editingCategory} />
      <ChangePasswordModal isOpen={showChangePwdModal} onClose={() => setShowChangePwdModal(false)} onSave={handleChangePassword} />
    </div>
  );
};

export default App;
