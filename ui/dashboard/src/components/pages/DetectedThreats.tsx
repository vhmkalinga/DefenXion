import { useState, useEffect, useMemo } from 'react';
import {
  Search, Download, Eye, RefreshCw, ShieldAlert,
  ShieldCheck, AlertTriangle, Info, Filter, X,
  ChevronUp, ChevronDown, Clock, Cpu, Globe, Printer,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ThreatAnalysisModal } from '../ThreatAnalysisModal';
import { AnimatePresence } from 'motion/react';
import { getAllThreats } from '../../services/api';
import { downloadCSV } from '../../utils/export';

/* ── constants ── */
const SEV_CFG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Critical: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)',    icon: <ShieldAlert size={11} /> },
  High:     { color: '#FFA657', bg: 'rgba(255,166,87,0.1)',   icon: <AlertTriangle size={11} /> },
  Medium:   { color: '#E3B341', bg: 'rgba(227,179,65,0.1)',   icon: <Info size={11} /> },
  Low:      { color: '#58A6FF', bg: 'rgba(88,166,255,0.1)',   icon: <Info size={11} /> },
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Blocked:     { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)'   },
  Flagged:     { color: '#FFA657', bg: 'rgba(255,166,87,0.08)'  },
  Quarantined: { color: '#E3B341', bg: 'rgba(227,179,65,0.08)'  },
  Logged:      { color: '#7D8590', bg: 'rgba(125,133,144,0.08)' },
};

const TOOLTIP_STYLE = {
  backgroundColor: '#0D1117', border: '1px solid #30363D',
  borderRadius: 10, color: '#E6EDF3',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 12,
};

type SortKey = 'timestamp' | 'confidence' | 'severity';
type SortDir = 'asc' | 'desc';

/* ── sub-components ── */
function SevBadge({ sev }: { sev: string }) {
  const c = SEV_CFG[sev] || SEV_CFG.Low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.color}33`,
    }}>
      {c.icon}{sev}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Logged;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.color}33`,
    }}>
      {status}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 95 ? '#FF4D4D' : value >= 85 ? '#FFA657' : '#3FB950';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#21262D', maxWidth: 72 }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.4s' }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 700, minWidth: 34 }}>{value}%</span>
    </div>
  );
}

/* ── summary strip card ── */
function SummaryCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      flex: 1, minWidth: 130,
      padding: '14px 18px', borderRadius: 14,
      background: 'linear-gradient(135deg,#161B22,#1a1f28)',
      border: `1px solid ${color}33`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ color, background: `${color}18`, borderRadius: 8, padding: 6, display: 'flex' }}>{icon}</div>
        <span style={{ color: '#7D8590', fontSize: 11 }}>{label}</span>
      </div>
      <div style={{ color: '#E6EDF3', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  );
}

/* ── sortable column header ── */
function SortHeader({ col, label, sortKey, sortDir, onSort }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (c: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
        color: active ? '#58A6FF' : '#7D8590', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.06em', whiteSpace: 'nowrap',
        borderBottom: '1px solid #21262D',
        userSelect: 'none',
        transition: 'color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          : <ChevronDown size={12} style={{ opacity: 0.3 }} />}
      </div>
    </th>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export function DetectedThreats() {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchThreats = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    getAllThreats(1, 100)
      .then(res => { if (res?.data) setThreats(res.data); })
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    fetchThreats();
    const id = setInterval(() => fetchThreats(true), 6000);
    return () => clearInterval(id);
  }, []);

  /* derived counts */
  const counts = useMemo(() => ({
    total:    threats.length,
    critical: threats.filter(t => t.severity === 'Critical').length,
    high:     threats.filter(t => t.severity === 'High').length,
    blocked:  threats.filter(t => t.status === 'Blocked').length,
  }), [threats]);

  const pieData = useMemo(() => [
    { name: 'Critical', value: counts.critical,                                  fill: '#FF4D4D' },
    { name: 'High',     value: counts.high,                                      fill: '#FFA657' },
    { name: 'Medium',   value: threats.filter(t => t.severity === 'Medium').length, fill: '#E3B341' },
    { name: 'Low',      value: threats.filter(t => t.severity === 'Low').length,    fill: '#58A6FF' },
  ].filter(d => d.value > 0), [threats, counts]);

  /* filter + sort */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return threats
      .filter(t => {
        const matchSearch = (t.type || '').toLowerCase().includes(q)
          || (t.sourceIp || '').includes(q)
          || (t.id || '').toLowerCase().includes(q);
        const matchSev = severityFilter === 'all' || t.severity === severityFilter;
        const matchStat = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchSev && matchStat;
      })
      .sort((a, b) => {
        let va: any, vb: any;
        if (sortKey === 'confidence') { va = a.confidence; vb = b.confidence; }
        else if (sortKey === 'severity') {
          const order: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          va = order[a.severity] || 0; vb = order[b.severity] || 0;
        } else { va = a.timestamp || ''; vb = b.timestamp || ''; }
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  }, [threats, searchTerm, severityFilter, statusFilter, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleSort = (col: SortKey) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('desc'); }
    setPage(1);
  };

  const handleDownloadPDF = async () => {
    try {
      const { toast } = await import('sonner');
      toast.info('Generating PDF...');

      const rowsHtml = filtered.map(t => `
        <tr>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px;font-family:monospace;color:#1a6ef5">${t.id || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px">${t.timestamp || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px;font-weight:600">${t.type || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px">
            <span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;color:${
              t.severity==='Critical'?'#d73a49':t.severity==='High'?'#e36209':t.severity==='Medium'?'#b08800':'#1a6ef5'
            };background:${
              t.severity==='Critical'?'#ffeef0':t.severity==='High'?'#fff5e6':t.severity==='Medium'?'#fffbe6':'#e8f0fe'
            };border:1px solid ${
              t.severity==='Critical'?'#f9b2b8':t.severity==='High'?'#ffcc99':t.severity==='Medium'?'#ffe59a':'#b3cfff'
            }">${t.severity}</span>
          </td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px;font-family:monospace">${t.sourceIp || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px">${t.targetPort || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px">${t.confidence != null ? t.confidence + '%' : '-'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-size:12px">
            <span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;color:${
              t.status==='Blocked'?'#d73a49':t.status==='Flagged'?'#e36209':t.status==='Quarantined'?'#b08800':'#555'
            }">${t.status || '-'}</span>
          </td>
        </tr>
      `).join('');

      const now = new Date().toLocaleString();
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#333;padding:40px;background:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #eee;padding-bottom:14px;margin-bottom:20px;">
            <div>
              <h1 style="margin:0;font-size:22px;color:#1a1a1a;">Detected Threats Report</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#555;">ML-classified network intrusions snapshot</p>
            </div>
            <div style="font-size:12px;color:#888;text-align:right;">Generated: ${now}<br/>Total shown: ${filtered.length} threats</div>
          </div>

          <div style="display:flex;gap:14px;margin-bottom:28px;">
            <div style="flex:1;border:1px solid #eaeaea;padding:14px;border-radius:8px;background:#fafafa">
              <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px">Total Threats</div>
              <div style="font-size:26px;font-weight:700;color:#1a6ef5;margin-top:4px">${counts.total}</div>
            </div>
            <div style="flex:1;border:1px solid #eaeaea;padding:14px;border-radius:8px;background:#fafafa">
              <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px">Critical</div>
              <div style="font-size:26px;font-weight:700;color:#d73a49;margin-top:4px">${counts.critical}</div>
            </div>
            <div style="flex:1;border:1px solid #eaeaea;padding:14px;border-radius:8px;background:#fafafa">
              <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px">High Severity</div>
              <div style="font-size:26px;font-weight:700;color:#e36209;margin-top:4px">${counts.high}</div>
            </div>
            <div style="flex:1;border:1px solid #eaeaea;padding:14px;border-radius:8px;background:#fafafa">
              <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px">Blocked</div>
              <div style="font-size:26px;font-weight:700;color:#22863a;margin-top:4px">${counts.blocked}</div>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">THREAT ID</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">TIME</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">TYPE</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">SEVERITY</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">SOURCE IP</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">PORT</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">CONFIDENCE</th>
                <th style="border:1px solid #ddd;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top:32px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:10px;">
            Generated by DefenXion Security Platform · Confidential
          </div>
        </div>
      `;

      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `DefenXion-Threats-${new Date().toISOString().slice(0,10)}.pdf`;
      await html2pdf().set({
        margin: 0.4,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc: any) => {
            clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((s: any) => s.remove());
          }
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
      }).from(element).save();
      toast.success('Downloaded PDF');
    } catch (e) {
      console.error(e);
      const { toast } = await import('sonner');
      toast.error('Failed to generate PDF');
    }
  };

  const activeFilters = [
    severityFilter !== 'all' && severityFilter,
    statusFilter !== 'all' && statusFilter,
  ].filter(Boolean) as string[];

  return (
    <>
      <style>{`
        @keyframes dt-spin { to{transform:rotate(360deg)} }
        @keyframes dt-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .dt-row { animation:dt-fadeup 0.35s ease both; }
        .dt-row:nth-child(2){animation-delay:.06s}
        .dt-row:nth-child(3){animation-delay:.12s}
        .dt-row:nth-child(4){animation-delay:.18s}
        .dt-trow:hover td { background:rgba(31,111,235,0.04) !important; }
        .dt-trow { cursor:pointer; transition:background 0.15s; }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="dt-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#E6EDF3', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>
              Detected Threats
            </h1>
            <p style={{ color:'#7D8590', fontSize:13, marginTop:4 }}>
              ML-classified network intrusions · 6s auto-refresh
            </p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button
              onClick={() => fetchThreats(true)}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                borderRadius:10, background:'rgba(255,255,255,0.05)',
                border:'1px solid #30363D', color:'#C9D1D9', fontSize:12,
                fontWeight:600, fontFamily:'inherit', cursor:'pointer', transition:'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#58A6FF')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363D')}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'dt-spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button
              onClick={() => downloadCSV(filtered, 'detected-threats.csv')}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                borderRadius:10, background:'linear-gradient(135deg,#1F6FEB,#2679f5)',
                border:'none', color:'white', fontSize:12, fontWeight:600,
                fontFamily:'inherit', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(31,111,235,0.35)', transition:'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                borderRadius:10, background:'linear-gradient(135deg,#BC8CFF,#8957e5)',
                border:'none', color:'white', fontSize:12, fontWeight:600,
                fontFamily:'inherit', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(188,140,255,0.35)', transition:'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Printer size={13} /> Export PDF
            </button>
          </div>
        </div>

        {/* ── Summary strip + pie ── */}
        <div className="dt-row" style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:12, flex:1, flexWrap:'wrap' }}>
            <SummaryCard label="Total Threats" value={counts.total}    color="#58A6FF" icon={<Globe size={15}/>} />
            <SummaryCard label="Critical"      value={counts.critical} color="#FF4D4D" icon={<ShieldAlert size={15}/>} />
            <SummaryCard label="High Severity" value={counts.high}     color="#FFA657" icon={<AlertTriangle size={15}/>} />
            <SummaryCard label="Blocked"       value={counts.blocked}  color="#3FB950" icon={<ShieldCheck size={15}/>} />
          </div>
          {/* severity pie */}
          {pieData.length > 0 && (
            <div style={{
              width: 260, flexShrink: 0,
              background:'linear-gradient(135deg,#161B22,#1a1f28)',
              border:'1px solid #21262D', borderRadius:14, padding:'14px 20px',
            }}>
              <div style={{ color:'#7D8590', fontSize:11, marginBottom:6 }}>SEVERITY BREAKDOWN</div>
              <ResponsiveContainer width="100%" height={118}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={32} outerRadius={50} strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, paddingTop:4 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="dt-row" style={{
          background:'linear-gradient(135deg,#161B22,#1a1f28)',
          border:'1px solid #21262D', borderRadius:14,
          padding:'16px 20px', marginBottom:16,
        }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            {/* search */}
            <div style={{ flex:1, minWidth:220, position:'relative' }}>
              <Search size={14} color="#7D8590" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search ID, type, IP address…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                style={{
                  width:'100%', background:'rgba(13,17,23,0.8)',
                  border:'1px solid #30363D', borderRadius:10,
                  padding:'9px 12px 9px 36px', color:'#E6EDF3', fontSize:13,
                  outline:'none', fontFamily:'inherit', boxSizing:'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(31,111,235,0.6)')}
                onBlur={e => (e.target.style.borderColor = '#30363D')}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}
                  style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',cursor:'pointer',color:'#7D8590',display:'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* severity filter */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Filter size={13} color="#7D8590" />
              <span style={{ color:'#7D8590', fontSize:12 }}>Severity:</span>
              {['all','Critical','High','Medium','Low'].map(v => (
                <button key={v} onClick={() => { setSeverityFilter(v); setPage(1); }}
                  style={{
                    padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                    fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s',
                    background: severityFilter === v
                      ? (SEV_CFG[v]?.bg || 'rgba(88,166,255,0.15)')
                      : 'rgba(255,255,255,0.04)',
                    color: severityFilter === v
                      ? (SEV_CFG[v]?.color || '#58A6FF')
                      : '#7D8590',
                    border: `1px solid ${severityFilter === v
                      ? ((SEV_CFG[v]?.color || '#58A6FF') + '44')
                      : '#30363D'}`,
                  }}>
                  {v === 'all' ? 'All' : v}
                </button>
              ))}
            </div>

            {/* status filter */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#7D8590', fontSize:12 }}>Status:</span>
              {['all','Blocked','Flagged','Logged'].map(v => (
                <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
                  style={{
                    padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                    fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s',
                    background: statusFilter === v ? 'rgba(63,185,80,0.1)' : 'rgba(255,255,255,0.04)',
                    color: statusFilter === v ? '#3FB950' : '#7D8590',
                    border: `1px solid ${statusFilter === v ? 'rgba(63,185,80,0.3)' : '#30363D'}`,
                  }}>
                  {v === 'all' ? 'All' : v}
                </button>
              ))}
            </div>

            {/* active filter pills */}
            {activeFilters.length > 0 && (
              <button onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); setPage(1); }}
                style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,
                  background:'rgba(255,166,87,0.08)',border:'1px solid rgba(255,166,87,0.2)',
                  color:'#FFA657',fontSize:11,fontFamily:'inherit',cursor:'pointer' }}>
                <X size={11}/> Clear filters
              </button>
            )}

            <div style={{ marginLeft:'auto', color:'#7D8590', fontSize:12 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="dt-row" style={{
          background:'linear-gradient(135deg,#161B22,#1a1f28)',
          border:'1px solid #21262D', borderRadius:14, overflow:'hidden',
        }}>
          {loading ? (
            <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#7D8590', gap:10 }}>
              <RefreshCw size={16} style={{ animation:'dt-spin 0.8s linear infinite' }} />
              Loading threats…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ height:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#7D8590', gap:12 }}>
              <ShieldCheck size={48} color="#21262D" />
              <span style={{ fontSize:14 }}>No threats match your current filters</span>
            </div>
          ) : (
            <>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {[
                        { label:'THREAT ID',  plain:true },
                        { label:'TIME',        sortCol:'timestamp' as SortKey },
                        { label:'TYPE',        plain:true },
                        { label:'SEVERITY',    sortCol:'severity' as SortKey },
                        { label:'SOURCE IP',   plain:true },
                        { label:'PORT',        plain:true },
                        { label:'CONFIDENCE',  sortCol:'confidence' as SortKey },
                        { label:'STATUS',      plain:true },
                        { label:'',            plain:true },
                      ].map(h => h.plain
                        ? <th key={h.label} style={{ padding:'11px 14px', textAlign:'left', color:'#7D8590', fontSize:11, fontWeight:600, letterSpacing:'0.06em', borderBottom:'1px solid #21262D', whiteSpace:'nowrap' }}>{h.label}</th>
                        : <SortHeader key={h.label} col={h.sortCol!} label={h.label} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((threat, i) => (
                      <tr key={threat.id || i} className="dt-trow" onClick={() => setSelectedThreat(threat)}>
                        <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, color:'#58A6FF', borderBottom:'1px solid #1a1f28' }}>{threat.id}</td>
                        <td style={{ padding:'11px 14px', fontSize:12, color:'#7D8590', whiteSpace:'nowrap', borderBottom:'1px solid #1a1f28' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <Clock size={11} color="#484F58" />
                            {threat.timestamp}
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:13, color:'#E6EDF3', fontWeight:500, borderBottom:'1px solid #1a1f28' }}>{threat.type}</td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid #1a1f28' }}><SevBadge sev={threat.severity} /></td>
                        <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, color:'#C9D1D9', borderBottom:'1px solid #1a1f28' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <Globe size={11} color="#484F58" />
                            {threat.sourceIp}
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:12, color:'#7D8590', borderBottom:'1px solid #1a1f28' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <Cpu size={11} color="#484F58" />
                            {threat.targetPort || '—'}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid #1a1f28' }}>
                          <ConfidenceBar value={threat.confidence} />
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid #1a1f28' }}><StatusBadge status={threat.status} /></td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid #1a1f28' }}>
                          <div style={{
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            width:28, height:28, borderRadius:8,
                            background:'rgba(88,166,255,0.08)', border:'1px solid rgba(88,166,255,0.15)',
                            color:'#58A6FF',
                          }}>
                            <Eye size={13} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid #21262D' }}>
                <span style={{ color:'#7D8590', fontSize:12 }}>
                  Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{
                        width:30, height:30, borderRadius:8, fontFamily:'inherit', cursor:'pointer',
                        fontSize:12, fontWeight:600, transition:'all 0.15s',
                        background: page === p ? '#1F6FEB' : 'rgba(255,255,255,0.04)',
                        border: page === p ? 'none' : '1px solid #30363D',
                        color: page === p ? 'white' : '#7D8590',
                        boxShadow: page === p ? '0 4px 12px rgba(31,111,235,0.35)' : 'none',
                      }}>
                      {p}
                    </button>
                  ))}
                  {totalPages > 7 && <span style={{ color:'#7D8590', fontSize:12, alignSelf:'center' }}>…{totalPages}</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedThreat && (
          <ThreatAnalysisModal threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
