import { useState, useEffect, useRef } from 'react';
import {
  Shield, AlertTriangle, Clock, Zap, TrendingUp, TrendingDown,
  Activity, Eye, ChevronRight, Cpu, Database, Wifi, Lock,
  Globe, Terminal, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { getDashboardStats, getRecentAlerts } from '../../services/api';
import { ThreatAnalysisModal } from '../ThreatAnalysisModal';
import { AnimatePresence } from 'motion/react';
import AttackSourceMap from '../AttackSourceMap';
import { useAnalytics } from '../../context/AnalyticsContext';

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
interface Stats {
  total_attacks: number;
  high_severity: number;
  avg_detection_time: string;
  auto_responses: number;
  changes: {
    total_attacks: string;
    high_severity: string;
    avg_detection_time: string;
    auto_responses: string;
  };
}

/* ─────────────────────────────────────────────────────────
   Animated counter hook
───────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ─────────────────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────────────────── */
interface StatCardProps {
  title: string;
  rawValue: number | string;
  change: string;
  icon: React.ReactNode;
  accent: string;        // hex colour
  accentBg: string;     // rgba
  isText?: boolean;      // non-numeric value (time strings)
}

function HeroStatCard({ title, rawValue, change, icon, accent, accentBg, isText }: StatCardProps) {
  const numericTarget = typeof rawValue === 'number' ? rawValue : 0;
  const animated = useCountUp(numericTarget);
  const displayValue = isText
    ? rawValue
    : animated.toLocaleString();

  const isPositive = change.startsWith('+');
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, #1a1f28, #1E232B)`
          : 'linear-gradient(135deg, #161B22, #1a1f28)',
        border: `1px solid ${hovered ? accent + '55' : '#21262D'}`,
        borderRadius: 16,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.25s ease',
        boxShadow: hovered
          ? `0 8px 32px ${accent}22, 0 0 0 1px ${accent}22`
          : '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top-right accent glow */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`,
        transition: 'opacity 0.3s',
        opacity: hovered ? 1 : 0.5,
        pointerEvents: 'none',
      }} />

      {/* Icon + badge row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: accentBg,
          border: `1px solid ${accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
          boxShadow: `0 4px 12px ${accent}22`,
        }}>
          {icon}
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 11, fontWeight: 600,
          padding: '3px 8px', borderRadius: 20,
          color: isPositive ? '#3FB950' : '#58A6FF',
          background: isPositive ? 'rgba(63,185,80,0.1)' : 'rgba(88,166,255,0.1)',
          border: `1px solid ${isPositive ? 'rgba(63,185,80,0.2)' : 'rgba(88,166,255,0.2)'}`,
        }}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {change}
        </span>
      </div>

      {/* Label */}
      <div style={{ color: '#7D8590', fontSize: 12, marginBottom: 6, letterSpacing: '0.01em' }}>
        {title}
      </div>

      {/* Value */}
      <div style={{
        color: '#E6EDF3', fontSize: 28, fontWeight: 700,
        letterSpacing: '-0.03em', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {displayValue}
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   System Health Bar
───────────────────────────────────────────────────────── */
const HEALTH_ITEMS = [
  { label: 'ML Engine', icon: <Cpu size={13} />, status: 'Operational', ok: true },
  { label: 'MongoDB', icon: <Database size={13} />, status: 'Connected', ok: true },
  { label: 'WebSocket', icon: <Wifi size={13} />, status: 'Live', ok: true },
  { label: 'Firewall', icon: <Lock size={13} />, status: 'Active', ok: true },
  { label: 'Threat Intel', icon: <Globe size={13} />, status: 'Updated', ok: true },
  { label: 'Response Engine', icon: <Terminal size={13} />, status: 'Ready', ok: true },
];

function SystemHealthBar() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #161B22, #1a1f28)',
      border: '1px solid #21262D',
      borderRadius: 14,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#7D8590', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', marginRight: 8 }}>
        SYSTEM STATUS
      </span>
      {HEALTH_ITEMS.map((item) => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          background: item.ok ? 'rgba(63,185,80,0.07)' : 'rgba(255,77,77,0.07)',
          border: `1px solid ${item.ok ? 'rgba(63,185,80,0.18)' : 'rgba(255,77,77,0.18)'}`,
        }}>
          <span style={{ color: item.ok ? '#3FB950' : '#FF4D4D' }}>{item.icon}</span>
          <span style={{ color: '#C9D1D9', fontSize: 11 }}>{item.label}</span>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: item.ok ? '#3FB950' : '#FF4D4D',
            boxShadow: `0 0 6px ${item.ok ? '#3FB950' : '#FF4D4D'}`,
            animation: 'dx-blink 2s ease-in-out infinite',
          }} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Live threat feed badge
───────────────────────────────────────────────────────── */
function SeverityBadge({ sev }: { sev: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    Critical: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)' },
    High:     { color: '#FFA657', bg: 'rgba(255,166,87,0.1)' },
    Medium:   { color: '#E3B341', bg: 'rgba(227,179,65,0.1)' },
    Low:      { color: '#58A6FF', bg: 'rgba(88,166,255,0.1)' },
  };
  const c = cfg[sev] || cfg.Low;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      color: c.color, background: c.bg,
      border: `1px solid ${c.color}33`,
    }}>{sev}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
    Blocked:    { color: '#FF4D4D', icon: <ShieldAlert size={11} /> },
    Flagged:    { color: '#FFA657', icon: <AlertTriangle size={11} /> },
    Logged:     { color: '#7D8590', icon: <Terminal size={11} /> },
  };
  const c = cfg[status] || cfg.Logged;
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      color: c.color, background: `${c.color}12`,
      border: `1px solid ${c.color}33`,
    }}>
      {c.icon}{status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard Overview
───────────────────────────────────────────────────────── */
export function DashboardOverview({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [stats, setStats] = useState<Stats>({
    total_attacks: 0, high_severity: 0,
    avg_detection_time: '0.23s', auto_responses: 0,
    changes: { total_attacks: '+12.5%', high_severity: '+8.3%', avg_detection_time: '-8.2%', auto_responses: '+15.7%' },
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const { trafficHistory, topSources, isLoaded } = useAnalytics();

  useEffect(() => {
    const fetchAll = () => {
      getDashboardStats().then(d => { if (d) setStats(d); }).catch(() => {});
      getRecentAlerts().then(d => { if (d?.length) setAlerts(d); }).catch(() => {});
    };
    fetchAll();
    const t = setInterval(fetchAll, 6000);
    return () => clearInterval(t);
  }, []);

  const STAT_CARDS = [
    {
      title: 'Total Attacks Detected',
      rawValue: stats.total_attacks,
      change: stats.changes.total_attacks,
      icon: <Shield size={18} />,
      accent: '#FF4D4D',
      accentBg: 'rgba(255,77,77,0.1)',
    },
    {
      title: 'High Severity Threats',
      rawValue: stats.high_severity,
      change: stats.changes.high_severity,
      icon: <AlertTriangle size={18} />,
      accent: '#FFA657',
      accentBg: 'rgba(255,166,87,0.1)',
    },
    {
      title: 'Avg Detection Time',
      rawValue: stats.avg_detection_time,
      change: stats.changes.avg_detection_time,
      icon: <Clock size={18} />,
      accent: '#58A6FF',
      accentBg: 'rgba(88,166,255,0.1)',
      isText: true,
    },
    {
      title: 'Auto Responses Executed',
      rawValue: stats.auto_responses,
      change: stats.changes.auto_responses,
      icon: <Zap size={18} />,
      accent: '#3FB950',
      accentBg: 'rgba(63,185,80,0.1)',
    },
  ];

  const tooltipStyle = {
    backgroundColor: '#161B22',
    border: '1px solid #30363D',
    borderRadius: 8,
    color: '#E6EDF3',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    fontSize: 12,
  };

  return (
    <>
      <style>{`
        @keyframes dx-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes dx-fadeup { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .dx-overview-row { animation: dx-fadeup 0.4s ease both; }
        .dx-overview-row:nth-child(2) { animation-delay: 0.06s }
        .dx-overview-row:nth-child(3) { animation-delay: 0.12s }
        .dx-overview-row:nth-child(4) { animation-delay: 0.18s }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="dx-overview-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: '#E6EDF3', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Dashboard Overview
            </h1>
            <p style={{ color: '#7D8590', fontSize: 13, marginTop: 4 }}>
              Real-time network intrusion detection &amp; automated response
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(63,185,80,0.08)',
              border: '1px solid rgba(63,185,80,0.2)',
              color: '#3FB950', fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3FB950', boxShadow: '0 0 8px rgba(63,185,80,0.6)', animation: 'dx-blink 2s ease-in-out infinite' }} />
              Live Monitoring
            </span>
            <Activity size={16} color="#7D8590" />
          </div>
        </div>

        {/* ── System health ── */}
        <div className="dx-overview-row" style={{ marginBottom: 24 }}>
          <SystemHealthBar />
        </div>

        {/* ── Stat cards ── */}
        <div className="dx-overview-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {STAT_CARDS.map((c) => (
            <HeroStatCard key={c.title} {...c} />
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="dx-overview-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Threat activity */}
          <div style={{
            background: 'linear-gradient(135deg, #161B22, #1a1f28)',
            border: '1px solid #21262D', borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>Threat Activity</div>
              <div style={{ color: '#7D8590', fontSize: 12, marginTop: 3 }}>Rolling 20-min window · threats & blocks per minute</div>
            </div>
            {!isLoaded ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7D8590', fontSize: 13 }}>
                Loading traffic data…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trafficHistory} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                  <defs>
                    <linearGradient id="ov-threat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ov-blocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3FB950" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="time" stroke="#484F58" fontSize={10}
                    label={{ value: 'Time', position: 'insideBottom', offset: -10, fill: '#484F58', fontSize: 10 }} />
                  <YAxis stroke="#484F58" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="threats" name="Threats" stroke="#FF4D4D" strokeWidth={2} fillOpacity={1} fill="url(#ov-threat)" />
                  <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#3FB950" strokeWidth={2} fillOpacity={1} fill="url(#ov-blocked)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top attacking IPs */}
          <div style={{
            background: 'linear-gradient(135deg, #161B22, #1a1f28)',
            border: '1px solid #21262D', borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>Top Attacking IPs</div>
              <div style={{ color: '#7D8590', fontSize: 12, marginTop: 3 }}>Source IPs that triggered block / alert actions</div>
            </div>
            {!isLoaded ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7D8590', fontSize: 13 }}>
                Loading source data…
              </div>
            ) : topSources.length === 0 ? (
              <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7D8590', fontSize: 13, gap: 8 }}>
                <Shield size={32} color="#30363D" />
                No attack data yet — run the traffic simulator
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topSources} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis type="number" stroke="#484F58" fontSize={10} allowDecimals={false} />
                  <YAxis dataKey="ip" type="category" stroke="#484F58" width={75} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="attacks" name="Attacks" fill="#FF4D4D" radius={[0, 6, 6, 0]}
                    background={{ fill: 'rgba(255,77,77,0.05)', radius: [0, 6, 6, 0] } as any} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Recent threats + Map ── */}
        <div className="dx-overview-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginBottom: 24 }}>

          {/* Recent Alerts — enhanced table */}
          <div style={{
            background: 'linear-gradient(135deg, #161B22, #1a1f28)',
            border: '1px solid #21262D', borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>Recent Threats</div>
                <div style={{ color: '#7D8590', fontSize: 12, marginTop: 3 }}>Live ML detections — auto-refreshes every 6s</div>
              </div>
              <button
                onClick={() => onNavigate?.('threats')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(31,111,235,0.1)', border: '1px solid rgba(31,111,235,0.25)',
                  borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  color: '#58A6FF', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(31,111,235,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(31,111,235,0.1)')}
              >
                View All <ChevronRight size={13} />
              </button>
            </div>

            {alerts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: '#7D8590', fontSize: 13, gap: 10 }}>
                <CheckCircle2 size={36} color="#3FB950" />
                <span>No recent threats detected — system is clean</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alerts.slice(0, 6).map((alert, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedThreat(alert)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(13,17,23,0.5)',
                      border: '1px solid rgba(48,54,61,0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(31,111,235,0.06)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(31,111,235,0.2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(13,17,23,0.5)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(48,54,61,0.5)';
                    }}
                  >
                    <div>
                      <div style={{ color: '#E6EDF3', fontSize: 13, fontWeight: 500 }}>{alert.type || 'Network Intrusion'}</div>
                      <div style={{ color: '#7D8590', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>{alert.sourceIp}</div>
                    </div>
                    <SeverityBadge sev={alert.severity || 'Medium'} />
                    <StatusBadge status={alert.status || 'Logged'} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#7D8590', fontSize: 11 }}>{alert.time}</div>
                      <div style={{ color: '#58A6FF', fontSize: 11, fontWeight: 600 }}>{alert.confidence}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attack source world map */}
          <div style={{
            background: 'linear-gradient(135deg, #161B22, #1a1f28)',
            border: '1px solid #21262D', borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#E6EDF3', fontSize: 14, fontWeight: 600 }}>Global Attack Origins</div>
              <div style={{ color: '#7D8590', fontSize: 12, marginTop: 3 }}>Geographic distribution of attack sources</div>
            </div>
            <AttackSourceMap />
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{
          textAlign: 'center', color: '#30363D', fontSize: 11,
          borderTop: '1px solid #21262D', paddingTop: 20, letterSpacing: '0.04em',
        }}>
          DefenXion © 2026 — Intelligent Network Defence System
        </footer>
      </div>

      <AnimatePresence>
        {selectedThreat && (
          <ThreatAnalysisModal threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
