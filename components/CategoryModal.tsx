
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">{initialData ? '编辑分类' : '新建分类'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">分类名称</label>
            <input
              required
              type="text"
              placeholder="例如：娱乐影音"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">选择图标</label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100 no-scrollbar">
              {Object.keys(ICON_MAP).map((iconName) => {
                const Icon = ICON_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      selectedIcon === iconName 
                        ? 'bg-white text-blue-600 shadow-md scale-105 ring-1 ring-blue-100' 
                        : 'text-slate-400 hover:bg-white hover:text-slate-600'
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {initialData ? '保存修改' : '创建分类'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
