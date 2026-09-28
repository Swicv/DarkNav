
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md m-4 border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{initialData ? '编辑分类' : '新建分类'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">分类名称</label>
            <input
              required
              type="text"
              placeholder="例如：娱乐影音"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">选择图标</label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700 no-scrollbar">
              {Object.keys(ICON_MAP).map((iconName) => {
                const Icon = ICON_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      selectedIcon === iconName 
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md scale-105 ring-1 ring-blue-100 dark:ring-blue-500' 
                        : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title={iconName}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
          >
            {initialData ? '保存修改' : '创建分类'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
