import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getDashboardTraffic, getTopSources, getPortBreakdown } from '../services/api';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  trafficHistory: any[];
  topSources: any[];
  portBreakdown: any[];
  stats: {
    activeThreats: number;
    blockedToday: number;
    totalConnections: number;
    uptime: string;
  };
  isLoaded: boolean;
}

interface AnalyticsContextValue extends AnalyticsData {
  refresh: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyticsData>({
    trafficHistory: [],
    topSources: [],
    portBreakdown: [],
    stats: { activeThreats: 0, blockedToday: 0, totalConnections: 0, uptime: '99.98%' },
    isLoaded: false,
  });

  const fetchAll = async (attempt = 0) => {
    // Guard: don't fetch until the auth token is in localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      if (attempt < 8) setTimeout(() => fetchAll(attempt + 1), 400);
      return;
    }

    try {
      const [traffic, sources, ports] = await Promise.all([
        getDashboardTraffic().catch((e: any) => {
          if (e?.response?.status === 401 && attempt < 3) { setTimeout(() => fetchAll(attempt + 1), 800); }
          return null;
        }),
        getTopSources().catch(() => null),
        getPortBreakdown().catch(() => null),
      ]);

      // If every call returned null (all 401s on first try) don't clobber state
      if (traffic === null && sources === null && ports === null) return;

      setData(prev => {
        const t = traffic && traffic.length > 0 ? traffic : prev.trafficHistory;
        const totalThreats = t.reduce((s: number, b: any) => s + (b.threats || 0), 0);
        const totalBlocked = t.reduce((s: number, b: any) => s + (b.blocked || 0), 0);
        const totalEvents  = t.reduce((s: number, b: any) => s + (b.traffic || 0), 0);
        return {
          trafficHistory: t,
          topSources:    sources  || prev.topSources,
          portBreakdown: ports    || prev.portBreakdown,
          stats: {
            activeThreats:    totalThreats,
            blockedToday:     totalBlocked,
            totalConnections: totalEvents,
            uptime: '99.98%',
          },
          isLoaded: true,
        };
      });
    } catch (err) {
      // Silent — individual endpoint errors are already caught above
    }
  };

  useEffect(() => {
    fetchAll();                                        // initial fetch (with token guard)
    const id = setInterval(() => fetchAll(), 10_000); // background refresh every 10s
    return () => clearInterval(id);
  }, []);

  return (
    <AnalyticsContext.Provider value={{ ...data, refresh: fetchAll }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be inside <AnalyticsProvider>');
  return ctx;
}
