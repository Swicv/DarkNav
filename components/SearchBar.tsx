
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ArrowRight, Monitor } from 'lucide-react';
import { SearchEngine } from '../types';

interface SearchBarProps {
  engine: SearchEngine;
  onEngineChange: (engine: SearchEngine) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ engine, onEngineChange, query, onQueryChange, onSearch }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 定义所有搜索引擎，确保完整
  const engines = {
    local: { name: '本地搜索', icon: Monitor },
    google: { name: '谷歌搜索', icon: Search },
    bing: { name: '必应搜索', icon: Search },
    baidu: { name: '百度搜索', icon: Search },
  };

  // 获取当前选中的引擎
  const currentEngine = engines[engine] || engines.local;
  const CurrentIcon = currentEngine.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && 
          buttonRef.current && !buttonRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 简单的下拉菜单切换
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 sm:my-8">
      <form onSubmit={handleSubmit} className="flex items-center w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700">
        {/* 搜索引擎选择器 */}
        <div className="relative border-r border-slate-100 dark:border-slate-700">
          {/* 引擎选择按钮 */}
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleDropdown}
            className="flex items-center px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white outline-none min-w-[120px]"
            aria-expanded={isDropdownOpen}
          >
            <CurrentIcon className="w-4 h-4 text-blue-500 mr-2" />
            {currentEngine.name}
            <ChevronDown className={`w-4 h-4 opacity-50 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* 下拉菜单 */}
          {isDropdownOpen && (
            <div ref={dropdownRef} className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
              {Object.entries(engines).map(([key, value]) => {
                const ItemIcon = value.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onEngineChange(key as SearchEngine);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center ${engine === key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <ItemIcon className="w-4 h-4 mr-2" />
                    {value.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 搜索输入框 */}
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={engine === 'local' ? "搜索本地导航..." : "输入关键词搜索..."}
          className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
        />

        {/* 搜索按钮 */}
        <button type="submit" className="p-4 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
