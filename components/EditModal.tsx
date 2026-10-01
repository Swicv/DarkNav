import React, { useState, useEffect } from 'react';
import { X, Trash2, Globe, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { LinkItem } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: LinkItem) => void;
  onDelete?: (id: string) => void;
  initialData?: LinkItem | null;
}

const isSafeHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [formData, setFormData] = useState<LinkItem>({
    id: '',
    title: '',
    url: '',
    icon: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        description: initialData.description || '',
      });
    } else {
      setFormData({
        id: Date.now().toString(),
        title: '',
        url: '',
        icon: '',
        description: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData = { ...formData };
    if (!isSafeHttpUrl(finalData.url)) {
      alert('链接 URL 必须以 http:// 或 https:// 开头');
      return;
    }
    if (finalData.icon && !isSafeHttpUrl(finalData.icon)) {
      alert('图标 URL 必须以 http:// 或 https:// 开头（或留空自动获取）');
      return;
    }

    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel bg-white/95 dark:bg-cosmos-900/95 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {initialData ? '编辑书签' : '添加新书签'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              书签名称
            </label>
            <input
              required
              type="text"
              placeholder="例如：GitHub"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-cosmos-850 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              网站链接 (URL)
            </label>
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                required
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-cosmos-850 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              图标 URL <span className="font-normal text-slate-400">(可选，留空将智能高保真抓取)</span>
            </label>
            <div className="relative flex items-center">
              <ImageIcon className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="留空自动适配高清矢量/艺术徽标"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-cosmos-850 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              描述说明 <span className="font-normal text-slate-400">(可选)</span>
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简短说明，展示在卡片副标题"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-cosmos-850 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('确定要永久删除这个书签吗?')) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center"
                title="删除书签"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
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
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
