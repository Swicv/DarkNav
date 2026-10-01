import React, { useState, useEffect } from 'react';
import { X, FolderPlus, FolderEdit } from 'lucide-react';
import { ICON_MAP } from '../constants';
import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: { title: string; iconName: string }) => void;
  initialData?: Category | null;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('LayoutGrid');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setSelectedIcon(initialData.iconName);
      } else {
        setTitle('');
        setSelectedIcon('LayoutGrid');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave({ title, iconName: selectedIcon });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel bg-white/95 dark:bg-cosmos-900/95 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {initialData ? <FolderEdit className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {initialData ? '编辑分类' : '创建新分类'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              分类名称
            </label>
            <input
              required
              type="text"
              placeholder="例如：开发工具 / 灵感视界"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-cosmos-850 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              分类图标
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50/80 dark:bg-white/[0.02] rounded-2xl border border-slate-200/70 dark:border-white/5">
              {Object.keys(ICON_MAP).map((iconName) => {
                const Icon = ICON_MAP[iconName];
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-400/40'
                        : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={iconName}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              {initialData ? '保存修改' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
