import React, { useState, useRef, useEffect } from 'react';
import { Search, Monitor, Globe, X, CornerDownLeft, Sparkles } from 'lucide-react';
import { SearchEngine } from '../types';

interface SearchBarProps {
  engine: SearchEngine;
  onEngineChange: (engine: SearchEngine) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

const ENGINES = [
  { id: 'local' as const, name: '本地', icon: Monitor, placeholder: '搜索已收藏书签或类别 (快捷键 / 或 ⌘K)...' },
  { id: 'google' as const, name: 'Google', icon: Globe, placeholder: 'Google 全球智搜...' },
  { id: 'bing' as const, name: 'Bing', icon: Search, placeholder: 'Bing 微软智搜...' },
  { id: 'baidu' as const, name: '百度', icon: Search, placeholder: '百度一下，你就知道...' },
];

const SearchBar: React.FC<SearchBarProps> = ({
  engine,
  onEngineChange,
  query,
  onQueryChange,
  onSearch,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentEngine = ENGINES.find((e) => e.id === engine) || ENGINES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (query) {
        onQueryChange('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 lg:my-8 transition-all duration-300">
      {/* Outer Glow Wrapper */}
      <div
        className={`relative rounded-3xl p-[1px] transition-all duration-500 ${
          isFocused
            ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-lg shadow-blue-500/20'
            : 'bg-gradient-to-r from-slate-200/80 via-slate-100/50 to-slate-200/80 dark:from-white/10 dark:via-white/5 dark:to-white/10'
        }`}
      >
        <div className="glass-panel rounded-[23px] overflow-hidden shadow-sm dark:shadow-glass-dark">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center p-1.5 sm:p-2 gap-2">
            
            {/* Engine Tabs Selector */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
              {ENGINES.map((item) => {
                const isActive = item.id === engine;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onEngineChange(item.id);
                      inputRef.current?.focus();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Input field */}
            <div className="relative flex-1 flex items-center w-full px-2">
              <Search className={`w-4 h-4 mr-2.5 shrink-0 transition-colors ${isFocused ? 'text-blue-500' : 'text-slate-400'}`} />
              <input
                ref={inputRef}
                id="global-search-input"
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={currentEngine.placeholder}
                className="w-full bg-transparent text-sm lg:text-base font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors mr-2"
                  title="清空输入 (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Shortcut Chip */}
              <div className="hidden sm:flex items-center gap-1 shrink-0 select-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                  /
                </kbd>
                <button
                  type="submit"
                  className={`p-1.5 rounded-xl transition-all ${
                    query
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                  title="按下回车检索"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
