import bcrypt from 'bcryptjs';

export interface Env {
  NAV_KV?: KVNamespace;
  ADMIN_PASSWORD?: string;
  CORS_ORIGIN?: string;
}

export const DEFAULT_ADMIN_PASSWORD = '666333';

export const INITIAL_DATA = {
  categories: []
};

export const corsHeaders = (env?: Env): HeadersInit => {
  return {
    'Access-Control-Allow-Origin': env?.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    'Content-Type': 'application/json; charset=utf-8'
  };
};

export const jsonResponse = (data: any, status = 200, env?: Env): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(env)
  });
};

export const isBcryptHash = (password: string | undefined): boolean => (
  typeof password === 'string' &&
  (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$'))
);

export const verifyPassword = (provided: string, stored: string): boolean => {
  if (!provided || !stored) return false;
  if (isBcryptHash(stored)) {
    try {
      return bcrypt.compareSync(provided, stored);
    } catch {
      return false;
    }
  }
  return provided === stored;
};

export const isSafeHttpUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const cleanText = (value: unknown, maxLength: number): string => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

export const normalizeData = (data: any) => {
  if (!data || !Array.isArray(data.categories)) return null;

  const categories = data.categories.map((category: any, categoryIndex: number) => {
    const title = cleanText(category.title, 80) || '未命名分类';
    const iconName = cleanText(category.iconName, 40) || 'LayoutGrid';
    const items = Array.isArray(category.items) ? category.items : [];

    return {
      id: cleanText(category.id, 80) || `category-${categoryIndex}-${Date.now()}`,
      title,
      iconName,
      items: items
        .map((item: any, itemIndex: number) => {
          const url = cleanText(item.url, 2048);
          if (!isSafeHttpUrl(url)) return null;

          const icon = cleanText(item.icon, 2048);
          return {
            id: cleanText(item.id, 80) || `link-${categoryIndex}-${itemIndex}-${Date.now()}`,
            title: cleanText(item.title, 120) || '无标题',
            url,
            ...(icon && isSafeHttpUrl(icon) ? { icon } : {}),
            ...(cleanText(item.description, 200) ? { description: cleanText(item.description, 200) } : {})
          };
        })
        .filter(Boolean)
    };
  });

  return { categories };
};

export const sanitizeData = (data: any) => {
  if (!data) return INITIAL_DATA;
  const { adminPassword, ...publicData } = data;
  return publicData;
};
