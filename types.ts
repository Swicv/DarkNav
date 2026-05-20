
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string; // URL to icon or Lucide icon name
  description?: string;
}

export interface Category {
  id: string;
  title: string;
  iconName: string; // Lucide icon name
  items: LinkItem[];
}

export interface AppData {
  adminPassword?: string; // Store password in data.json
  categories: Category[];
}

export type SearchEngine = 'google' | 'bing' | 'baidu' | 'local';
