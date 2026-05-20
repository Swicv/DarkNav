
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, User, Plus, Edit2, Compass, Moon, Sun, Trash2, 
  Menu, X, Download, Upload, Loader2, ArrowUp, ArrowDown, Lock
} from 'lucide-react';
import { INITIAL_DATA, ICON_MAP } from './constants';
import { AppData, LinkItem, Category, SearchEngine } from './types';
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

const useStickyState = <T,>(defaultValue: T, key: string, oldKey?: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    // 首先尝试从新键名获取值
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue !== null) {
      try {
        return JSON.parse(stickyValue);
      } catch {
        window.localStorage.removeItem(key);
      }
    }
    
    // 如果新键名没有值且提供了旧键名，则尝试从旧键名获取
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

// --- Helper: HTML Bookmark Parser ---
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
                        icon: icon && isSafeHttpUrl(icon) ? icon : `https://favicon.yandex.net/favicon/${new URL(a.href).hostname}`
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
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [darkMode, setDarkMode] = useStickyState(false, 'darknav-theme', 'flatnav-theme');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(''); 
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  // Search State - Default to 'local'
  const [searchEngine, setSearchEngine] = useStickyState<SearchEngine>('local', 'darknav-search-engine', 'flatnav-search-engine');
  const [searchQuery, setSearchQuery] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LinkItem | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string>('');

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const serverData = await res.json();
            if (serverData && Array.isArray(serverData.categories)) {
                setData(serverData);
                if (serverData.categories.length > 0 && !activeCategory) {
                    setActiveCategory(serverData.categories[0].id);
                }
            } else {
                setData(INITIAL_DATA);
            }
        } else {
            setData(INITIAL_DATA);
        }
    } catch (error) {
        setData(INITIAL_DATA);
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
    const fetchWeatherByIP = async () => {
       try {
          const ipRes = await fetch('/api/ip');
          const ipData = await ipRes.json();
          if (ipData.status !== 'fail') {
             await fetchWeather(ipData.lat, ipData.lon, ipData.city || '本地');
          } else {
             await fetchWeather(39.9042, 116.4074, '北京');
          }
       } catch (e) {
          await fetchWeather(39.9042, 116.4074, '北京');
       }
    };
    const fetchWeather = async (lat: number, lon: number, cityName: string) => {
        try {
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const weatherData = await weatherRes.json();
            let aqiValue = 0;
            try {
                const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
                const aqiData = await aqiRes.json();
                if(aqiData.current) aqiValue = aqiData.current.us_aqi;
            } catch (e) {}
            if (weatherData.current) {
                setWeather({
                    temp: Math.round(weatherData.current.temperature_2m),
                    weatherCode: weatherData.current.weather_code,
                    minTemp: Math.round(weatherData.daily.temperature_2m_min[0]),
                    maxTemp: Math.round(weatherData.daily.temperature_2m_max[0]),
                    windSpeed: weatherData.current.wind_speed_10m,
                    humidity: weatherData.current.relative_humidity_2m,
                    feelsLike: Math.round(weatherData.current.apparent_temperature),
                    city: cityName, 
                    daily: weatherData.daily,
                    aqi: aqiValue
                });
            }
        } catch(e) {} finally { setWeatherLoading(false); }
    };
    if (!navigator.geolocation || !window.isSecureContext) { fetchWeatherByIP(); return; }
    navigator.geolocation.getCurrentPosition((position) => { fetchWeather(position.coords.latitude, position.coords.longitude, '本地'); }, () => { fetchWeatherByIP(); });
  }, []);

  // Search Logic
  const handleSearch = () => {
      // 本地搜索是实时的，不需要额外操作
      if (searchEngine === 'local') return;
      
      // 确保搜索引擎URL映射正确
      const engines: Record<SearchEngine, string> = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        baidu: 'https://www.baidu.com/s?wd=',
        local: '' // 本地搜索不需要URL
      };
      
      // 确保有搜索关键词并且引擎URL有效
      if (searchQuery.trim() && engines[searchEngine]) {
          window.location.href = `${engines[searchEngine]}${encodeURIComponent(searchQuery)}`;
      }
  };

  // Filter Categories for Local Search
  const displayCategories = React.useMemo(() => {
      // 如果不是本地搜索或没有搜索查询，显示所有分类
      if (searchEngine !== 'local' || !searchQuery.trim()) {
          return data.categories;
      }
      
      // 本地搜索时，过滤每个分类中的项目
      return data.categories.map(cat => {
          const filteredItems = cat.items.filter(item => 
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.url.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return { ...cat, items: filteredItems };
      }).filter(cat => cat.items.length > 0); // 只在有搜索查询时过滤空分类
  }, [data.categories, searchEngine, searchQuery]);

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    setSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const main = document.querySelector('main');
      if(main) {
        const mainTop = main.getBoundingClientRect().top;
        const elTop = element.getBoundingClientRect().top;
        main.scrollTo({ top: main.scrollTop + elTop - mainTop - 32, behavior: 'smooth' });
      }
    }
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
    const newCategories = data.categories.map(cat => {
      if (cat.id === editingCategoryId) {
        const existingIndex = cat.items.findIndex(i => i.id === item.id);
        if (existingIndex > -1) {
          const newItems = [...cat.items]; newItems[existingIndex] = item; return { ...cat, items: newItems };
        } else { return { ...cat, items: [...cat.items, item] }; }
      } return cat;
    });
    saveDataToServer({ ...data, categories: newCategories });
  };
  const handleDeleteLink = (itemId: string) => {
    const newCategories = data.categories.map(cat => {
      if (cat.id === editingCategoryId) { return { ...cat, items: cat.items.filter(i => i.id !== itemId) }; } return cat;
    });
    saveDataToServer({ ...data, categories: newCategories });
  };
  const handleSaveCategory = (category: { title: string; iconName: string }) => {
    let newCategories;
    if (editingCategory) {
        newCategories = data.categories.map(c => c.id === editingCategory.id ? { ...c, title: category.title, iconName: category.iconName } : c);
        // 更新现有分类时，先更新UI再保存到服务器
        setData({ ...data, categories: newCategories });
        saveDataToServer({ ...data, categories: newCategories });
    } else {
        const newCategory: Category = { id: `c${Date.now()}`, title: category.title, iconName: category.iconName, items: [] };
        newCategories = [...data.categories, newCategory];
        // 添加新分类时，先更新UI再保存到服务器，确保立即显示新分类
        setData({ ...data, categories: newCategories });
        saveDataToServer({ ...data, categories: newCategories });
        setTimeout(() => scrollToCategory(newCategory.id), 100);
    }
  };
  const handleDeleteCategory = (id: string) => {
    if (window.confirm('确定要删除此分类及其所有内容吗？')) {
      const newCategories = data.categories.filter(c => c.id !== id);
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
          alert('密码修改成功！');
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

  const openAddLinkModal = (catId: string) => { setEditingItem(null); setEditingCategoryId(catId); setEditModalOpen(true); };
  const openEditLinkModal = (item: LinkItem, catId: string) => { setEditingItem(item); setEditingCategoryId(catId); setEditModalOpen(true); };
  const openCategoryModal = (category?: Category) => { setEditingCategory(category || null); setCategoryModalOpen(true); }
  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `darknav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>

      <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json,.html" />

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 mb-2 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md"><Compass className="w-6 h-6" /></div>
              <div><h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Dark's Nav</h1><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Dashboard</p></div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"><X className="w-6 h-6" /></button>
          </div>

          <div className="px-4 flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4 px-2"><span className="text-xs font-bold text-slate-400 dark:text-slate-500">分类导航</span><div className="h-[1px] bg-slate-100 dark:bg-slate-800 flex-1 ml-4"></div></div>
            <nav className="space-y-2 pb-4">
              {displayCategories.map((cat, index) => {
                const Icon = ICON_MAP[cat.iconName] || ICON_MAP['LayoutGrid'];
                const isActive = activeCategory === cat.id;
                return (
                  <div key={cat.id} className="group relative flex flex-col">
                    <div className="flex items-center w-full">
                        <button onClick={() => scrollToCategory(cat.id)} className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                        <div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} /><span className="truncate max-w-[110px] text-left">{cat.title}</span></div>
                        {isActive && <ChevronRight className="w-4 h-4 text-blue-400 dark:text-blue-500" />}
                        </button>
                    </div>
                    {isAdmin && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 shadow-sm rounded-lg p-1 border border-slate-100 dark:border-slate-700 z-10">
                            <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'up'); }} disabled={index === 0} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${index === 0 ? 'text-slate-300' : 'text-slate-500'}`} title="上移"><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'down'); }} disabled={index === data.categories.length - 1} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${index === data.categories.length - 1 ? 'text-slate-300' : 'text-slate-500'}`} title="下移"><ArrowDown className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); openCategoryModal(cat); }} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500" title="编辑"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="删除"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    )}
                  </div>
                );
              })}
              {isAdmin && (
                  <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => openCategoryModal()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Plus className="w-4 h-4" /><span>添加分类</span></button>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleExportData} className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="导出配置"><Download className="w-3.5 h-3.5" /><span>导出</span></button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="导入(JSON/HTML)"><Upload className="w-3.5 h-3.5" /><span>导入</span></button>
                    </div>
                    <button onClick={() => setShowChangePwdModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><Lock className="w-3 h-3" /><span>修改后台密码</span></button>
                  </div>
              )}
            </nav>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
           <div className="flex items-center p-1 mb-4 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <button onClick={() => setDarkMode(false)} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${!darkMode ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600'}`}><Sun className="w-5 h-5" /></button>
              <button onClick={() => setDarkMode(true)} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 shadow-sm text-violet-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600'}`}><Moon className="w-5 h-5" /></button>
           </div>
           <button onClick={() => { if (isAdmin) { setIsAdmin(false); setSessionPassword(''); } else { setShowAdminModal(true); } }} className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-medium shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"><User className="w-5 h-5 group-hover:scale-110 transition-transform" /><span>{isAdmin ? '退出管理' : '管理员登录'}</span></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#f8fafc] dark:bg-[#0b1120] overflow-x-hidden">
        <header className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30 transition-colors duration-300">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"><Menu className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Dark's Nav</h1>
            <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-8 transition-colors duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-6 mb-8 lg:mb-12 auto-rows-fr">
              <div className="col-span-1 lg:col-span-3 min-h-[120px] lg:min-h-[140px] h-auto"><DateWidget /></div>
              <div className="col-span-1 lg:col-span-4 min-h-[120px] lg:min-h-[140px] h-auto"><WeatherWidget data={weather} loading={weatherLoading} /></div>
               <div className="col-span-1 lg:col-span-2 min-h-[120px] lg:min-h-[140px] h-auto"><ClockWidget /></div>
              <div className="col-span-1 lg:col-span-3 min-h-[120px] lg:min-h-[140px] h-auto"><ExtraWidget data={weather} loading={weatherLoading} /></div>
          </div>

          <div className="mb-10">
              <SearchBar 
                engine={searchEngine} 
                onEngineChange={setSearchEngine} 
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onSearch={handleSearch}
              />
          </div>

          {displayCategories.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                  {dataLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin text-blue-500" /> : (searchEngine === 'local' && searchQuery ? '未找到匹配的本地链接' : '暂无分类')}
              </div>
          )}

          <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
            {displayCategories.map((category) => {
              const Icon = ICON_MAP[category.iconName] || ICON_MAP['LayoutGrid'];
              return (
                <section key={category.id} id={category.id} className="scroll-mt-20 lg:scroll-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-6 border-b border-slate-50 dark:border-slate-700 flex items-center gap-3 transition-colors">
                     <div className={`p-2 rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/20`}><Icon className="w-5 h-5" /></div>
                     <h2 className="text-lg font-bold text-slate-800 dark:text-white">{category.title}</h2>
                     {isAdmin && (
                          <button onClick={() => openAddLinkModal(category.id)} className="ml-auto p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors" title="添加链接"><Plus className="w-5 h-5" /></button>
                     )}
                  </div>

                  <div className="bg-[#fcfdff] dark:bg-[#162032] rounded-b-2xl p-6 border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {category.items.map((link) => {
                          const safeUrl = getSafeHttpUrl(link.url);
                          return (
                          <div key={link.id} className="group relative">
                              <a href={safeUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!safeUrl} className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700 transition-all duration-300 h-full ${safeUrl ? 'hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'}`}>
                                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-600">
                                      {link.icon ? (
                                          <img src={link.icon} alt={link.title} className="w-6 h-6 object-contain" onError={(e) => {(e.target as HTMLImageElement).style.display='none';}} />
                                      ) : (<div className="text-slate-400 dark:text-slate-500 text-xs font-bold">{link.title.substring(0,1)}</div>)}
                                  </div>
                                  <div className="overflow-hidden">
                                      <h3 className="font-semibold text-slate-700 dark:text-slate-200 truncate text-sm">{link.title}</h3>
                                      {link.description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{link.description}</p>}
                                  </div>
                              </a>
                              {isAdmin && (
                                  <button onClick={(e) => { e.preventDefault(); openEditLinkModal(link, category.id); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-700/90 shadow-sm border border-slate-100 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 opacity-100"><Edit2 className="w-3 h-3" /></button>
                              )}
                          </div>
                        );
                        })}
                        {category.items.length === 0 && (<div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">此分类暂无链接，点击右上角 + 号添加</div>)}
                     </div>
                  </div>
                </section>
              );
            })}
          </div>
          
          {/* 版权信息 */}
          <div className="py-4 mt-10 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            © 2025 Dark's Nav
          </div>
        </main>
      </div>

      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} onLogin={handleLogin} />
      <EditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} initialData={editingItem} onSave={handleSaveLink} onDelete={handleDeleteLink} />
      <CategoryModal isOpen={categoryModalOpen} onClose={() => { setCategoryModalOpen(false); setEditingCategory(null); }} onSave={handleSaveCategory} initialData={editingCategory} />
      <ChangePasswordModal isOpen={showChangePwdModal} onClose={() => setShowChangePwdModal(false)} onSave={handleChangePassword} />
    </div>
  );
};

export default App;
