import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
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
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: Date.now().toString(),
        title: '',
        url: '',
        icon: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate icon if empty
    let finalData = { ...formData };
    if (!isSafeHttpUrl(finalData.url)) {
        alert('链接 URL 只支持 http:// 或 https://');
        return;
    }
    if (finalData.icon && !isSafeHttpUrl(finalData.icon)) {
        alert('图标 URL 只支持 http:// 或 https://');
        return;
    }
    if (!finalData.icon && finalData.url) {
        try {
            const urlObj = new URL(finalData.url);
            // Use Yandex Favicon API which is stable and accessible in both China and globally
            finalData.icon = `https://favicon.yandex.net/favicon/${urlObj.hostname}`;
        } catch (e) {
            // invalid url, ignore
        }
    }

    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? '编辑链接' : '添加链接'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">标题</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">URL</label>
            <input
              required
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">图标 URL (可选)</label>
            <input
              type="text"
              value={formData.icon || ''}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="留空自动获取 Favicon"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {initialData && onDelete && (
               <button
               type="button"
               onClick={() => {
                   if(window.confirm('确定删除吗?')) {
                       onDelete(initialData.id);
                       onClose();
                   }
               }}
               className="flex-none bg-red-50 text-red-600 px-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
             >
               <Trash2 className="w-5 h-5" />
             </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-colors"
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
