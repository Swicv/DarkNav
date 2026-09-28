
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Initial Data Fallback
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "666333";
const DEFAULT_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const INITIAL_DATA = {
  adminPassword: DEFAULT_HASH,
  categories: []
};

let writeQueue = Promise.resolve();

const isBcryptHash = (password) => (
  typeof password === 'string' &&
  (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$'))
);

const getPasswordFromHeader = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
};

const sanitizeData = (data) => {
  const { adminPassword, ...publicData } = data;
  return publicData;
};

const isSafeHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const cleanText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const normalizeData = (data) => {
  if (!data || !Array.isArray(data.categories)) return null;

  const categories = data.categories.map((category, categoryIndex) => {
    const title = cleanText(category.title, 80) || '未命名分类';
    const iconName = cleanText(category.iconName, 40) || 'LayoutGrid';
    const items = Array.isArray(category.items) ? category.items : [];

    return {
      id: cleanText(category.id, 80) || `category-${categoryIndex}-${Date.now()}`,
      title,
      iconName,
      items: items
        .map((item, itemIndex) => {
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

async function readDataFile() {
    try {
        const stat = await fs.stat(DATA_FILE);
        if (stat.isDirectory()) {
            throw new Error(`${DATA_FILE} is a directory. Please replace it with a JSON file.`);
        }
        return await fs.readFile(DATA_FILE, 'utf-8');
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        const dataStr = JSON.stringify(INITIAL_DATA, null, 2);
        await fs.writeFile(DATA_FILE, dataStr);
        return dataStr;
    }
}

async function writeDataFile(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const tempFile = `${DATA_FILE}.tmp`;
    const backupFile = `${DATA_FILE}.bak`;

    try {
        await fs.copyFile(DATA_FILE, backupFile);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    await fs.writeFile(tempFile, dataStr);
    try {
        await fs.rename(tempFile, DATA_FILE);
    } catch (error) {
        if (!['EBUSY', 'EXDEV', 'EPERM'].includes(error.code)) throw error;
        await fs.writeFile(DATA_FILE, dataStr);
        await fs.unlink(tempFile).catch(() => {});
    }
}

function queueDataWrite(data) {
    writeQueue = writeQueue
        .catch(() => {})
        .then(() => writeDataFile(data));
    return writeQueue;
}

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];

if (corsOrigins.length > 0) {
  app.use(cors({ origin: corsOrigins }));
}
// Increase limit for large HTML bookmark imports
app.use(bodyParser.json({ limit: '10mb' }));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Helper to get current password
async function getCurrentPassword() {
    try {
        const dataStr = await readDataFile();
        const data = JSON.parse(dataStr);
        return data.adminPassword || DEFAULT_HASH;
    } catch {
        return DEFAULT_HASH;
    }
}

function verifyPassword(providedPassword, storedPassword) {
    if (!providedPassword) return false;
    if (isBcryptHash(storedPassword)) {
        return bcrypt.compareSync(providedPassword, storedPassword);
    }
    return providedPassword === storedPassword;
}

// In-memory cache for IP responses (15 minutes TTL)
const ipCache = new Map();
const IP_CACHE_TTL = 15 * 60 * 1000;

// API: Proxy IP Request
app.get('/api/ip', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'default';
  const now = Date.now();
  const cached = ipCache.get(clientIp);

  if (cached && now - cached.timestamp < IP_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const response = await fetch('http://ip-api.com/json/?lang=zh-CN', {
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error('IP API failed');
    const data = await response.json();
    ipCache.set(clientIp, { timestamp: now, data });
    // 清理过期缓存
    if (ipCache.size > 200) {
      for (const [key, val] of ipCache.entries()) {
        if (now - val.timestamp > IP_CACHE_TTL) ipCache.delete(key);
      }
    }
    res.json(data);
  } catch (error) {
    console.error('IP Proxy error:', error.message || error);
    if (cached) {
      return res.json(cached.data);
    }
    res.status(500).json({ status: 'fail', message: 'Server failed to fetch IP' });
  }
});

// API: Get Data
app.get('/api/data', async (req, res) => {
  try {
    const dataStr = await readDataFile();
    
    let parsedData;
    try {
        parsedData = JSON.parse(dataStr);
    } catch (e) {
        console.error("Data file corrupt, using initial data.");
        parsedData = INITIAL_DATA;
    }

    if (!parsedData || !parsedData.categories) {
        parsedData = INITIAL_DATA;
        await queueDataWrite(INITIAL_DATA);
    }

    res.json(sanitizeData(parsedData));
  } catch (error) {
    console.error('Read error:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body || {};
    const storedPassword = await getCurrentPassword();

    if (!verifyPassword(password, storedPassword)) {
      return res.status(403).json({ error: 'Unauthorized: Password incorrect' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// API: Save Data
app.post('/api/data', async (req, res) => {
  try {
    const newData = req.body;
    const providedPassword = getPasswordFromHeader(req.headers['x-admin-password']);
    
    // 1. Verify Permission
    const storedPassword = await getCurrentPassword();
    const isAuthenticated = verifyPassword(providedPassword, storedPassword);

    if (!isAuthenticated) {
        return res.status(403).json({ error: 'Unauthorized: Password incorrect' });
    }

    // 2. Validate New Data
    const normalizedData = normalizeData(newData);
    if (!normalizedData) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    // 3. Handle Password Change
    let passwordToSave = storedPassword;
    
    if (newData.adminPassword) {
        // Only re-hash if it looks like a new plain text password (not starting with bcrypt prefix)
        if (!isBcryptHash(newData.adminPassword)) {
             passwordToSave = bcrypt.hashSync(newData.adminPassword, 8);
        } else {
             // If client sent the existing hash back, keep it
             passwordToSave = newData.adminPassword;
        }
    } 
    
    const dataToWrite = {
        ...normalizedData,
        adminPassword: passwordToSave
    };

    // 4. Write Data
    await queueDataWrite(dataToWrite);
    res.json({ success: true });
  } catch (error) {
    console.error('Write error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Serve Static Files with proper caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ADMIN_PASSWORD is not set. The server is using the legacy default password "666333".');
  }
});
