import React, { useState, useEffect, useMemo, useRef } from 'react';

interface FaviconProps {
  url?: string;
  icon?: string;
  title: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 8 curated high-luxury gradient palettes for deterministic monogram badges
const GRADIENT_PALETTES = [
  { bg: 'from-violet-600 to-indigo-600', ring: 'ring-violet-400/30', glow: 'shadow-violet-500/25' },
  { bg: 'from-cyan-500 to-blue-600', ring: 'ring-cyan-400/30', glow: 'shadow-cyan-500/25' },
  { bg: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-400/30', glow: 'shadow-emerald-500/25' },
  { bg: 'from-amber-500 to-rose-500', ring: 'ring-amber-400/30', glow: 'shadow-amber-500/25' },
  { bg: 'from-rose-500 to-pink-600', ring: 'ring-rose-400/30', glow: 'shadow-rose-500/25' },
  { bg: 'from-fuchsia-600 to-purple-700', ring: 'ring-fuchsia-400/30', glow: 'shadow-fuchsia-500/25' },
  { bg: 'from-sky-500 to-indigo-500', ring: 'ring-sky-400/30', glow: 'shadow-sky-500/25' },
  { bg: 'from-teal-500 to-emerald-700', ring: 'ring-teal-400/30', glow: 'shadow-teal-500/25' },
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

export const Favicon: React.FC<FaviconProps> = ({
  url = '',
  icon = '',
  title = '',
  className = '',
  size = 'md',
}) => {
  const hostname = useMemo(() => extractHostname(url), [url]);
  const timerRef = useRef<number | null>(null);

  // Generate fallback sources queue: Prioritize same-origin cached Edge Gateway
  const sources = useMemo(() => {
    const list: string[] = [];
    
    // 1. Explicit custom icon (if user entered one)
    if (icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:'))) {
      list.push(icon);
    }
    
    if (hostname) {
      // 2. High-speed Edge Gateway with 7-day Cache (No GFW timeout, same-origin HTTP/2)
      list.push(`/api/favicon?domain=${encodeURIComponent(hostname)}`);

      // 3. Direct origin favicon
      try {
        const origin = new URL(url).origin;
        list.push(`${origin}/favicon.ico`);
      } catch {}
    }
    return list;
  }, [url, icon, hostname]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reset state on url or sources change
  useEffect(() => {
    setCurrentIndex(0);
    setHasError(sources.length === 0);
  }, [sources]);

  // Fast timeout watchdog: If an icon source takes > 2000ms, abort to next source or Monogram
  useEffect(() => {
    if (hasError || sources.length === 0 || currentIndex >= sources.length) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      // Advance to next source or fallback
      if (currentIndex + 1 < sources.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setHasError(true);
      }
    }, 2000);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, sources, hasError]);

  const handleImageLoad = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
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

  // Deterministic palette and monogram letter
  const hashKey = hostname || title || 'nav';
  const palette = GRADIENT_PALETTES[hashString(hashKey) % GRADIENT_PALETTES.length];
  
  const displayChar = useMemo(() => {
    const cleanTitle = (title || hostname || '?').trim();
    if (!cleanTitle) return '?';
    const firstChar = cleanTitle.charAt(0);
    return firstChar.toUpperCase();
  }, [title, hostname]);

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

  // If we have an active network image source
  if (!hasError && sources.length > 0 && currentIndex < sources.length) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/70 dark:border-white/10 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${sizeClasses} ${className}`}
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

  // Award-winning Aesthetic Monogram Fallback (0ms, 0 bytes network)
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 font-bold bg-gradient-to-br ${palette.bg} text-white ring-1 ring-inset ${palette.ring} shadow-lg ${palette.glow} transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 ${sizeClasses} ${className}`}
      title={title}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none rounded-[inherit]" />
      <span className="relative z-10 font-semibold tracking-wide drop-shadow-sm select-none">
        {displayChar}
      </span>
    </div>
  );
};

export default Favicon;
