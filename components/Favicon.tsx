import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Server, HardDrive, Router, Boxes, 
  Terminal, Tv, Download, Database, Radio, Globe, 
  Home, Activity, Code2
} from 'lucide-react';

interface FaviconProps {
  url?: string;
  icon?: string;
  title: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 8 curated high-luxury gradient palettes
const GRADIENT_PALETTES = [
  { bg: 'from-violet-600 to-indigo-600', ring: 'ring-violet-400/30', glow: 'shadow-violet-500/25', iconColor: 'text-violet-200' },
  { bg: 'from-cyan-500 to-blue-600', ring: 'ring-cyan-400/30', glow: 'shadow-cyan-500/25', iconColor: 'text-cyan-200' },
  { bg: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-400/30', glow: 'shadow-emerald-500/25', iconColor: 'text-emerald-200' },
  { bg: 'from-amber-500 to-rose-500', ring: 'ring-amber-400/30', glow: 'shadow-amber-500/25', iconColor: 'text-amber-200' },
  { bg: 'from-rose-500 to-pink-600', ring: 'ring-rose-400/30', glow: 'shadow-rose-500/25', iconColor: 'text-rose-200' },
  { bg: 'from-fuchsia-600 to-purple-700', ring: 'ring-fuchsia-400/30', glow: 'shadow-fuchsia-500/25', iconColor: 'text-fuchsia-200' },
  { bg: 'from-sky-500 to-indigo-500', ring: 'ring-sky-400/30', glow: 'shadow-sky-500/25', iconColor: 'text-sky-200' },
  { bg: 'from-teal-500 to-emerald-700', ring: 'ring-teal-400/30', glow: 'shadow-teal-500/25', iconColor: 'text-teal-200' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function extractHostname(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

export function isPrivateOrLocalHost(hostname: string): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();

  // Localhost
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
    return true;
  }

  // Single-label hostnames without dot (e.g. 'nas', 'pve', 'router', 'openwrt', 'esxi')
  if (!host.includes('.')) {
    return true;
  }

  // Common local domains
  if (
    host.endsWith('.local') ||
    host.endsWith('.lan') ||
    host.endsWith('.internal') ||
    host.endsWith('.home') ||
    host.endsWith('.corp') ||
    host.endsWith('.intranet') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }

  // IPv4 Private Address Ranges (RFC 1918 & RFC 3927)
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  return false;
}

// Intelligent Homelab & Tech Service Icon Resolver
function getSmartFallbackIcon(title: string, url: string, isPrivate: boolean) {
  const query = `${title} ${url}`.toLowerCase();

  // Router / Network Gateways
  if (/爱快|ikuai|openwrt|路由器|router|网关|gateway|asus|华硕|旁路由/.test(query)) {
    return Router;
  }
  // NAS / Storage
  if (/nas|群晖|synology|dsm|威联通|qnap|truenas|freenas|unraid|存储|storage|fnos|飞牛|omv|nextcloud|owncloud/.test(query)) {
    return HardDrive;
  }
  // Virtualization & Containers
  if (/pve|proxmox|esxi|虚拟化|vmware|vcenter|docker|portainer|1panel|宝塔|bt-panel|容器|k8s|kubernetes/.test(query)) {
    return Boxes;
  }
  // Terminal / Scripts / Automation
  if (/青龙|qinglong|终端|terminal|ssh|shell|脚本|cron|action/.test(query)) {
    return Terminal;
  }
  // Media / Streaming
  if (/jellyfin|emby|plex|影音|影视|tv|media|video|kodi|bilibili|youtube/.test(query)) {
    return Tv;
  }
  // Downloaders
  if (/qbittorrent|transmission|aria2|下载|torrent|bt|pt|迅雷|xunlei/.test(query)) {
    return Download;
  }
  // Reverse Proxy / Tunnel / VPN
  if (/frp|nps|clash|mihomo|openclash|代理|proxy|vpn|tailscale|wireguard|zerotier|内网穿透|穿透|npm|nginx/.test(query)) {
    return Radio;
  }
  // Database
  if (/mysql|redis|mongo|postgres|mariadb|sql|数据库|database|navicat/.test(query)) {
    return Database;
  }
  // Smart Home
  if (/homeassistant|home-assistant|hass|米家|home|智能家居|zigbee/.test(query)) {
    return Home;
  }
  // Monitoring / Probes
  if (/uptime|kuma|grafana|prometheus|监控|monitor|哪吒|nezha|探针/.test(query)) {
    return Activity;
  }
  // Code / Git
  if (/git|github|gitlab|gitea|gogs|code|代码|bitbucket/.test(query)) {
    return Code2;
  }

  // Default icons: Server for intranet/homelab, Globe for public internet
  return isPrivate ? Server : Globe;
}

export const Favicon: React.FC<FaviconProps> = ({
  url = '',
  icon = '',
  title = '',
  className = '',
  size = 'md',
}) => {
  const hostname = useMemo(() => extractHostname(url), [url]);
  const isPrivate = useMemo(() => isPrivateOrLocalHost(hostname), [hostname]);
  const timerRef = useRef<number | null>(null);

  // Generate fallback sources queue
  const sources = useMemo(() => {
    const list: string[] = [];
    
    // 1. Explicit custom icon (support absolute URL, data URI, or relative path)
    if (icon && typeof icon === 'string' && icon.trim().length > 0) {
      list.push(icon.trim());
    }
    
    if (hostname) {
      if (isPrivate) {
        // For private/LAN services: Browser in LAN can reach origin directly
        // NEVER query /api/favicon (public Cloudflare/Google cannot reach private LAN IP)
        try {
          const parsed = new URL(url);
          const origin = parsed.origin;
          list.push(`${origin}/favicon.ico`);
          list.push(`${origin}/apple-touch-icon.png`);
          list.push(`${origin}/favicon.png`);
          if (parsed.pathname && parsed.pathname !== '/') {
            const basePath = parsed.pathname.replace(/\/+$/, '');
            list.push(`${origin}${basePath}/favicon.ico`);
          }
        } catch {}
      } else {
        // For public Internet services:
        // 2. High-speed Edge Gateway with 7-day Cache
        list.push(`/api/favicon?domain=${encodeURIComponent(hostname)}`);

        // 3. Direct origin favicons
        try {
          const origin = new URL(url).origin;
          list.push(`${origin}/favicon.ico`);
          list.push(`${origin}/apple-touch-icon.png`);
          list.push(`${origin}/favicon.png`);
        } catch {}

        // 4. Legacy Yandex CDN fallback
        list.push(`https://favicon.yandex.net/favicon/${encodeURIComponent(hostname)}`);
      }
    }
    return list;
  }, [url, icon, hostname, isPrivate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reset state on url or sources change
  useEffect(() => {
    setCurrentIndex(0);
    setHasError(sources.length === 0);
  }, [sources]);

  // Generous 8s safety watchdog: Only protects against unroutable dead IPs
  useEffect(() => {
    if (hasError || sources.length === 0 || currentIndex >= sources.length) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      if (currentIndex + 1 < sources.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setHasError(true);
      }
    }, 8000);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, sources, hasError]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const img = e.currentTarget;
    // Reject 1x1 transparent GIFs
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      handleImageError();
    }
  };

  const handleImageError = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (currentIndex + 1 < sources.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  // Deterministic palette
  const hashKey = hostname || title || 'nav';
  const palette = GRADIENT_PALETTES[hashString(hashKey) % GRADIENT_PALETTES.length];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl',
  }[size];

  const imgSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  // If we have an active network image source
  if (!hasError && sources.length > 0 && currentIndex < sources.length) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-white/10 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${sizeClasses} ${className}`}
      >
        <img
          key={sources[currentIndex]}
          src={sources[currentIndex]}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`${imgSizeClasses} object-contain transition-transform duration-300 group-hover:scale-110`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    );
  }

  // Fallback: Smart Tech Icon or Clean Monogram Letter (NEVER a raw Chinese character)
  const cleanTitle = (title || hostname || '').trim();
  const firstChar = cleanTitle.charAt(0);
  const isAlphaNumeric = /^[a-zA-Z0-9]$/.test(firstChar);

  const FallbackIcon = getSmartFallbackIcon(title, url, isPrivate);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 font-bold bg-gradient-to-br ${palette.bg} text-white ring-1 ring-inset ${palette.ring} shadow-lg ${palette.glow} transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 ${sizeClasses} ${className}`}
      title={title}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none rounded-[inherit]" />
      <span className="relative z-10 flex items-center justify-center font-semibold tracking-wide drop-shadow-sm select-none">
        {isAlphaNumeric ? (
          firstChar.toUpperCase()
        ) : (
          <FallbackIcon className={`${iconSizeClasses} ${palette.iconColor}`} />
        )}
      </span>
    </div>
  );
};

export default Favicon;
