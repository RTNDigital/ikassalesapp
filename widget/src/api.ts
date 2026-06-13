export interface WidgetSettings {
  isActive: boolean;
  showOnMobile: boolean;
  position: 'bottom-left' | 'bottom-right';
  displayDuration: number;
  delayBetween: number;
  firstDelay: number;
  maxPerPage: number;
  messageTemplate: string;
  timeTemplate: string;
  animation: 'slide' | 'fade' | 'bounce';
  theme: 'classic' | 'modern' | 'minimal';
  customColors: {
    background?: string;
    text?: string;
    border?: string;
  };
  customFonts: Record<string, string>;
  showTeaser: boolean;
  teaserText: string;
  teaserBehavior: 'after-close' | 'always' | 'never';
  pageTargeting: {
    mode: 'all' | 'selected' | 'excluded';
    rules?: { url: string; matchType: 'contains' | 'exact' | 'startsWith' }[];
  };
}

export interface WidgetNotification {
  id: string;
  customerName: string;
  location: string;
  productName: string;
  productImage: string | null;
  productHref: string | null;
  purchaseDate: string;
  isPrioritized: boolean;
}

export interface WidgetData {
  settings: WidgetSettings;
  notifications: WidgetNotification[];
}

const CACHE_KEY = 'sn_widget_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: WidgetData;
  timestamp: number;
}

function getCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function setCache(data: WidgetData): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable or full — silently ignore
  }
}

export async function fetchWidgetData(baseUrl: string, merchantId: string): Promise<WidgetData | null> {
  const cached = getCache();
  const isFresh = cached && Date.now() - cached.timestamp < CACHE_TTL;

  if (isFresh && cached) {
    return cached.data;
  }

  try {
    const res = await fetch(`${baseUrl}/api/widget/${merchantId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      // Fall back to stale cache if fetch fails
      return cached?.data ?? null;
    }

    const data = (await res.json()) as WidgetData;
    setCache(data);
    return data;
  } catch {
    // Network error — fall back to stale cache
    return cached?.data ?? null;
  }
}
