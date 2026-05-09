import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSearch, ShieldAlert, ShieldCheck, Info,
  AlertTriangle, X, CheckCircle2, RefreshCw, Download,
  ChevronDown, ChevronUp, Wifi, Cpu, Globe,
} from 'lucide-react';
import { analyzePcap } from '../../services/api';
import { toast } from 'sonner';
import { downloadCSV } from '../../utils/export';


/* ── types ── */
interface FlowResult {
  flow_id: number;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  pkt_count: number;
  prediction: 'Attack' | 'Benign';
  confidence: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  explanations: { feature: string; importance: number; value: number }[];
  timestamp: string;
}

interface PcapReport {
  filename: string;
  total_flows: number;
  attack_count: number;
  benign_count: number;
  results: FlowResult[];
}

/* ── helpers ── */
const SEV_COLOR: Record<string, string> = {
  Critical: '#FF4D4D', High: '#FFA657', Medium: '#E3B341', Low: '#58A6FF',
};
const SEV_BG: Record<string, string> = {
  Critical: 'rgba(255,77,77,0.1)', High: 'rgba(255,166,87,0.1)',
  Medium: 'rgba(227,179,65,0.1)', Low: 'rgba(88,166,255,0.1)',
};

function SevBadge({ sev }: { sev: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: SEV_COLOR[sev] || '#7D8590',
      background: SEV_BG[sev] || 'rgba(125,133,144,0.1)',
      border: `1px solid ${(SEV_COLOR[sev] || '#7D8590')}33`,
    }}>
      {sev}
    </span>
  );
}

function PredBadge({ pred }: { pred: string }) {
  const isAttack = pred === 'Attack';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: isAttack ? '#FF4D4D' : '#3FB950',
      background: isAttack ? 'rgba(255,77,77,0.1)' : 'rgba(63,185,80,0.1)',
      border: `1px solid ${isAttack ? 'rgba(255,77,77,0.3)' : 'rgba(63,185,80,0.3)'}`,
    }}>
      {isAttack ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
      {pred}
    </span>
  );
}

function ConfBar({ value, isAttack }: { value: number; isAttack: boolean }) {
  const color = isAttack ? (value >= 95 ? '#FF4D4D' : value >= 85 ? '#FFA657' : '#E3B341') : '#3FB950';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#21262D', maxWidth: 72 }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.4s' }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 700, minWidth: 38 }}>{value}%</span>
    </div>
  );
}

/* ── expandable row for XAI explanations ── */
function FlowRow({ flow }: { flow: FlowResult }) {
  const [expanded, setExpanded] = useState(false);
  const isAttack = flow.prediction === 'Attack';
  const hasXai = flow.explanations && flow.explanations.length > 0;

  return (
    <>
      <tr
        className="pcap-trow"
        onClick={() => hasXai && setExpanded(e => !e)}
        style={{ cursor: hasXai ? 'pointer' : 'default' }}
      >
        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#58A6FF', borderBottom: '1px solid #1a1f28' }}>
          {flow.flow_id}
        </td>
        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#C9D1D9', borderBottom: '1px solid #1a1f28' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Globe size={10} color="#484F58" /> {flow.src_ip}:{flow.src_port}
          </div>
        </td>
        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#C9D1D9', borderBottom: '1px solid #1a1f28' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Cpu size={10} color="#484F58" /> {flow.dst_ip}:{flow.dst_port}
          </div>
        </td>
        <td style={{ padding: '10px 14px', fontSize: 11, color: '#7D8590', borderBottom: '1px solid #1a1f28' }}>
          <span style={{
            padding: '2px 8px', borderRadius: 20,
            background: flow.protocol === 'TCP' ? 'rgba(31,111,235,0.1)' : 'rgba(63,185,80,0.1)',
            color: flow.protocol === 'TCP' ? '#58A6FF' : '#3FB950',
            border: `1px solid ${flow.protocol === 'TCP' ? 'rgba(31,111,235,0.3)' : 'rgba(63,185,80,0.3)'}`,
            fontWeight: 600,
          }}>
            {flow.protocol}
          </span>
        </td>
        <td style={{ padding: '10px 14px', fontSize: 12, color: '#7D8590', borderBottom: '1px solid #1a1f28' }}>{flow.pkt_count}</td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1a1f28' }}><PredBadge pred={flow.prediction} /></td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1a1f28' }}><ConfBar value={flow.confidence} isAttack={isAttack} /></td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1a1f28' }}><SevBadge sev={flow.severity} /></td>
        <td style={{ padding: '10px 14px', borderBottom: '1px solid #1a1f28', textAlign: 'center' }}>
          {hasXai
            ? (expanded ? <ChevronUp size={14} color="#58A6FF" /> : <ChevronDown size={14} color="#484F58" />)
            : <span style={{ color: '#30363D', fontSize: 10 }}>—</span>}
        </td>
      </tr>
      {expanded && hasXai && (
        <tr>
          <td colSpan={9} style={{ padding: 0, borderBottom: '1px solid #1a1f28', background: 'rgba(13,17,23,0.6)' }}>
            <div style={{ padding: '14px 20px 14px 48px' }}>
              <div style={{ color: '#58A6FF', fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>
                ⚡ EXPLAINABLE AI — TOP CONTRIBUTING FEATURES
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {flow.explanations.map((exp, i) => (
                  <div key={i} style={{ minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#C9D1D9', fontSize: 12, fontFamily: 'monospace' }}>{exp.feature}</span>
                      <span style={{ color: '#58A6FF', fontSize: 12, fontWeight: 700 }}>{exp.importance}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#21262D' }}>
                      <div style={{ width: `${Math.min(exp.importance, 100)}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#1F6FEB,#58A6FF)' }} />
                    </div>
                    <div style={{ color: '#484F58', fontSize: 10, marginTop: 3 }}>Value: {exp.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export function PcapInspector() {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PcapReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'Attack' | 'Benign'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(pcap|pcapng|cap)$/i)) {
      toast.error('Only .pcap / .pcapng / .cap files are supported');
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const data = await analyzePcap(file);
      setReport(data);
      toast.success(`Analyzed ${data.total_flows} flows — ${data.attack_count} threats detected`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Analysis failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const filtered = report
    ? (filter === 'all' ? report.results : report.results.filter(r => r.prediction === filter))
    : [];

  const attackPct = report && report.total_flows > 0
    ? Math.round((report.attack_count / report.total_flows) * 100)
    : 0;

  return (
    <>
      <style>{`
        @keyframes pcap-spin { to { transform:rotate(360deg) } }
        @keyframes pcap-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pcap-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pcap-row { animation: pcap-fadeup 0.35s ease both }
        .pcap-row:nth-child(2){animation-delay:.05s}
        .pcap-row:nth-child(3){animation-delay:.1s}
        .pcap-trow:hover td { background:rgba(31,111,235,0.04) !important }
        .pcap-trow { transition:background 0.15s }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="pcap-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: '#E6EDF3', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              PCAP Inspector
            </h1>
            <p style={{ color: '#7D8590', fontSize: 13, marginTop: 4 }}>
              Deep Packet Inspection · Upload a .pcap file to classify every network flow with the live ML model
            </p>
          </div>
          {report && (
            <button
              onClick={() => { setReport(null); setFilter('all'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 10, background: 'rgba(255,77,77,0.08)',
                border: '1px solid rgba(255,77,77,0.25)', color: '#FF4D4D',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> New Analysis
            </button>
          )}
        </div>

        {/* ── Drop Zone ── */}
        {!report && !loading && (
          <div
            className="pcap-row"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#1F6FEB' : '#30363D'}`,
              borderRadius: 20,
              padding: '64px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver
                ? 'rgba(31,111,235,0.06)'
                : 'linear-gradient(135deg,#161B22,#1a1f28)',
              transition: 'all 0.2s',
              marginBottom: 24,
              boxShadow: dragOver ? '0 0 0 4px rgba(31,111,235,0.15)' : 'none',
            }}
          >
            <input ref={inputRef} type="file" accept=".pcap,.pcapng,.cap" style={{ display: 'none' }} onChange={onFileInput} />

            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: dragOver ? 'rgba(31,111,235,0.15)' : 'rgba(31,111,235,0.08)',
              border: `1px solid ${dragOver ? 'rgba(31,111,235,0.5)' : 'rgba(31,111,235,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <Upload size={30} color={dragOver ? '#58A6FF' : '#1F6FEB'} />
            </div>

            <div style={{ color: '#E6EDF3', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {dragOver ? 'Drop to analyze' : 'Drop your .pcap file here'}
            </div>
            <div style={{ color: '#7D8590', fontSize: 13, marginBottom: 20 }}>
              or click to browse — supports .pcap, .pcapng, .cap up to 50 MB
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {['Feature Extraction', 'ML Classification', 'XAI Explanations'].map(cap => (
                <span key={cap} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(31,111,235,0.08)',
                  border: '1px solid rgba(31,111,235,0.2)',
                  color: '#58A6FF', fontSize: 11, fontWeight: 600,
                }}>
                  <CheckCircle2 size={11} />{cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="pcap-row" style={{
            border: '1px solid #21262D', borderRadius: 20, padding: '64px 32px',
            textAlign: 'center', background: 'linear-gradient(135deg,#161B22,#1a1f28)',
            marginBottom: 24,
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, margin: '0 auto',
                background: 'rgba(31,111,235,0.1)', border: '1px solid rgba(31,111,235,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RefreshCw size={30} color="#1F6FEB" style={{ animation: 'pcap-spin 1s linear infinite' }} />
              </div>
            </div>
            <div style={{ color: '#E6EDF3', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Analyzing PCAP…</div>
            <div style={{ color: '#7D8590', fontSize: 13 }}>
              Scapy is extracting flows · ML model is classifying each flow · Building XAI report
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {report && (
          <>
            {/* Summary cards */}
            <div className="pcap-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'File', value: report.filename, color: '#58A6FF', icon: <FileSearch size={16} /> },
                { label: 'Total Flows', value: report.total_flows, color: '#58A6FF', icon: <Wifi size={16} /> },
                { label: 'Attack Flows', value: report.attack_count, color: '#FF4D4D', icon: <ShieldAlert size={16} /> },
                { label: 'Benign Flows', value: report.benign_count, color: '#3FB950', icon: <ShieldCheck size={16} /> },
                { label: 'Attack Rate', value: `${attackPct}%`, color: attackPct > 50 ? '#FF4D4D' : '#FFA657', icon: <AlertTriangle size={16} /> },
              ].map(c => (
                <div key={c.label} style={{
                  padding: '16px 20px', borderRadius: 14,
                  background: 'linear-gradient(135deg,#161B22,#1a1f28)',
                  border: `1px solid ${c.color}33`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: c.color }}>
                    {c.icon}
                    <span style={{ color: '#7D8590', fontSize: 11, fontWeight: 600 }}>{c.label}</span>
                  </div>
                  <div style={{
                    color: '#E6EDF3', fontSize: typeof c.value === 'string' && c.value.length > 12 ? 12 : 22,
                    fontWeight: 700, letterSpacing: '-0.02em', wordBreak: 'break-all',
                  }}>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Attack rate bar */}
            <div className="pcap-row" style={{
              marginBottom: 20, padding: '14px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg,#161B22,#1a1f28)',
              border: '1px solid #21262D',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#7D8590', fontSize: 12 }}>Attack vs Benign breakdown</span>
                <span style={{ color: '#FF4D4D', fontSize: 12, fontWeight: 700 }}>{attackPct}% malicious</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#21262D', overflow: 'hidden' }}>
                <div style={{
                  width: `${attackPct}%`, height: '100%',
                  background: attackPct > 70 ? '#FF4D4D' : attackPct > 30 ? '#FFA657' : '#3FB950',
                  borderRadius: 4, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* Filter + Export bar */}
            <div className="pcap-row" style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '12px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg,#161B22,#1a1f28)',
              border: '1px solid #21262D', flexWrap: 'wrap',
            }}>
              <span style={{ color: '#7D8590', fontSize: 12 }}>Filter:</span>
              {(['all', 'Attack', 'Benign'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
                    background: filter === f
                      ? (f === 'Attack' ? 'rgba(255,77,77,0.15)' : f === 'Benign' ? 'rgba(63,185,80,0.15)' : 'rgba(88,166,255,0.15)')
                      : 'rgba(255,255,255,0.04)',
                    color: filter === f
                      ? (f === 'Attack' ? '#FF4D4D' : f === 'Benign' ? '#3FB950' : '#58A6FF')
                      : '#7D8590',
                    border: `1px solid ${filter === f
                      ? (f === 'Attack' ? 'rgba(255,77,77,0.4)' : f === 'Benign' ? 'rgba(63,185,80,0.4)' : 'rgba(88,166,255,0.4)')
                      : '#30363D'}`,
                  }}>
                  {f === 'all' ? 'All' : f} {f !== 'all' && `(${report.results.filter(r => r.prediction === f).length})`}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { downloadCSV(filtered, `${report.filename.replace('.pcap','')}-analysis.csv`); toast.success('CSV exported'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 8, background: 'linear-gradient(135deg,#1F6FEB,#2679f5)',
                    border: 'none', color: 'white', fontSize: 11, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(31,111,235,0.3)',
                  }}
                >
                  <Download size={12} /> Export CSV
                </button>
              </div>
              <span style={{ color: '#7D8590', fontSize: 12 }}>{filtered.length} flows shown</span>
            </div>

            {/* Flow Table */}
            <div className="pcap-row" style={{
              background: 'linear-gradient(135deg,#161B22,#1a1f28)',
              border: '1px solid #21262D', borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Source', 'Destination', 'Proto', 'Packets', 'Prediction', 'Confidence', 'Severity', 'XAI'].map(h => (
                        <th key={h} style={{
                          padding: '11px 14px', textAlign: 'left', color: '#7D8590',
                          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                          borderBottom: '1px solid #21262D', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#7D8590', fontSize: 13 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <Info size={32} color="#30363D" />
                            No flows match the current filter
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(flow => <FlowRow key={flow.flow_id} flow={flow} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
