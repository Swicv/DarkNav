import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ArrowRight, Monitor, Globe, X, CornerDownLeft } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentEngine = ENGINES.find((e) => e.id === engine) || ENGINES[0];
  const CurrentIcon = currentEngine.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="w-full max-w-3xl mx-auto my-5 sm:my-7 transition-all duration-300">
      {/* Outer Glow Wrapper */}
      <div
        className={`relative rounded-3xl p-[1px] transition-all duration-500 ${
          isFocused || isDropdownOpen
            ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-lg shadow-blue-500/20'
            : 'bg-gradient-to-r from-slate-200/80 via-slate-100/50 to-slate-200/80 dark:from-white/10 dark:via-white/5 dark:to-white/10'
        }`}
      >
        <div className="glass-panel rounded-[23px] shadow-sm dark:shadow-glass-dark">
          <form onSubmit={handleSubmit} className="flex items-center w-full px-2 py-1.5 sm:px-3 sm:py-2">
            
            {/* Collapsed Engine Selector Dropdown */}
            <div className="relative shrink-0">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all outline-none"
                aria-expanded={isDropdownOpen}
              >
                <CurrentIcon className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate max-w-[60px] sm:max-w-none">{currentEngine.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-2 w-44 glass-panel bg-white/95 dark:bg-cosmos-900/95 rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {ENGINES.map((item) => {
                    const isSelected = item.id === engine;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onEngineChange(item.id);
                          setIsDropdownOpen(false);
                          inputRef.current?.focus();
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ItemIcon className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </div>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 sm:mx-2 shrink-0" />

            {/* Search Input Field */}
            <div className="flex-1 flex items-center min-w-0 relative px-1">
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
                className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />

              {/* Clear Query Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    onQueryChange('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors mx-1"
                  title="清空输入 (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Submit Action & Shortcut Chip */}
            <div className="flex items-center gap-1 shrink-0 pl-1">
              <div className="hidden sm:flex items-center select-none mr-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                  /
                </kbd>
              </div>
              <button
                type="submit"
                className={`p-2 rounded-2xl transition-all active:scale-95 ${
                  query
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
                title="搜索"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
