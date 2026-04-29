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

  const fetchAll = async () => {
    try {
      const [traffic, sources, ports] = await Promise.all([
        getDashboardTraffic().catch(() => []),
        getTopSources().catch(() => []),
        getPortBreakdown().catch(() => []),
      ]);

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
      console.error('AnalyticsProvider fetch failed', err);
    }
  };

  useEffect(() => {
    fetchAll();                                        // initial fetch
    const id = setInterval(fetchAll, 10_000);          // background refresh every 10s
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
