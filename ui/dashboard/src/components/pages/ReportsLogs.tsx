import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Calendar, Filter, Terminal, Trash2, Eye, Search, ChevronLeft, ChevronRight, BarChart3, Shield, AlertTriangle, X, Loader2 } from 'lucide-react';
import { getSystemLogs, getReports, generateReport, getReportDetail, deleteReport } from '../../services/api';
import { downloadCSV } from '../../utils/export';
import { toast } from 'sonner';

const LEVEL_CLR: Record<string, string> = { CRITICAL:'#FF4D4D', CRITICAL_BLOCK:'#FF4D4D', HIGH:'#FFA657', BLOCK_IP:'#FFA657', MEDIUM:'#E3B341', ALERT_ADMIN:'#E3B341', LOW:'#7D8590', LOG_ONLY:'#7D8590', INFO:'#3FB950' };
const PERIOD_CLR: Record<string, string> = { monthly:'#BC8CFF', weekly:'#3FB950', daily:'#58A6FF', all:'#FFA657', custom:'#58A6FF' };

export function ReportsLogs() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('daily');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'logs'>('reports');

  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(50);
  const [logLevel, setLogLevel] = useState('all-levels');
  const [logSource, setLogSource] = useState('all-sources');
  const [logSearch, setLogSearch] = useState('');
  const [logSearchInput, setLogSearchInput] = useState('');

  const fetchReports = useCallback(() => { getReports().then(setReports).catch(console.error); }, []);
  const fetchLogs = useCallback(() => {
    getSystemLogs(logsPage, logsLimit, logLevel, logSource, logSearch).then(res => {
      if (res) {
        setLogs((res.data || []).map((l: any) => ({
          timestamp: l.timestamp, level: l.level || l.details?.action || 'INFO',
          source: l.source || l.event_type || 'System',
          message: l.message || (l.details ? `${l.details.action} → ${l.details.source_ip} (conf: ${(l.details.confidence * 100).toFixed(1)}%)` : 'System event'),
        })));
        setLogsTotal(res.total_records || 0);
      }
    }).catch(console.error);
  }, [logsPage, logsLimit, logLevel, logSource, logSearch]);

  useEffect(() => { fetchReports(); }, []);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const report = await generateReport(reportPeriod, reportPeriod === 'custom' ? customStartDate : undefined, reportPeriod === 'custom' ? customEndDate : undefined);
      toast.success(`Report ${report.report_id} generated!`); fetchReports();
    } catch { toast.error('Failed to generate report'); }
    finally { setIsGenerating(false); }
  };
  const handleViewReport = async (id: string) => { try { setSelectedReport(await getReportDetail(id)); } catch { toast.error('Failed to load report'); } };
  const handleDeleteReport = async (id: string) => {
    if (!confirm(`Delete report ${id}?`)) return;
    try { await deleteReport(id); toast.success('Deleted'); if (selectedReport?.report_id === id) setSelectedReport(null); fetchReports(); }
    catch { toast.error('Failed to delete'); }
  };
  const handleExportReport = (r: any) => {
    const d = [{ field:'Report ID', value:r.report_id },{ field:'Title', value:r.title },{ field:'Generated', value:r.generated_at },{ field:'By', value:r.generated_by },{ field:'Detections', value:r.summary?.total_detections },{ field:'Blocks', value:r.summary?.total_blocks },{ field:'Alerts', value:r.summary?.total_alerts },{ field:'Active Alerts', value:r.summary?.active_alerts },{ field:'Logs', value:r.summary?.total_logs }];
    r.top_attack_sources?.forEach((s: any, i: number) => d.push({ field:`Top #${i+1}`, value:`${s.ip} (${s.count})` }));
    downloadCSV(d, `${r.report_id}.csv`); toast.success('Exported CSV');
  };
  const handleLogSearch = () => { setLogSearch(logSearchInput); setLogsPage(1); };
  const totalPages = Math.max(1, Math.ceil(logsTotal / logsLimit));

  const CARD: React.CSSProperties = { background:'linear-gradient(135deg,#161B22,#1a1f28)', border:'1px solid #21262D', borderRadius:16 };
  const INPUT_S: React.CSSProperties = { background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:8, padding:'7px 10px', color:'#E6EDF3', fontSize:12, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const };
  const BTN = (color: string): React.CSSProperties => ({ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, fontFamily:'inherit', cursor:'pointer', color, background:`${color}10`, border:`1px solid ${color}25`, transition:'all 0.15s' });

  return (
    <>
      <style>{`
        @keyframes rl-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rl-spin { to{transform:rotate(360deg)} }
        .rl-row { animation:rl-fadeup 0.35s ease both; }
        .rl-row:nth-child(2){animation-delay:.06s} .rl-row:nth-child(3){animation-delay:.12s}
        .rl-row:nth-child(4){animation-delay:.18s} .rl-row:nth-child(5){animation-delay:.24s}
      `}</style>

    <div style={{ padding:'28px 32px', maxWidth:1440, margin:'0 auto' }}>

      {/* ── Header ── */}
      <div className="rl-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#BC8CFF,#8957e5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(188,140,255,0.3)' }}>
            <FileText size={22} color="white" />
          </div>
          <div>
            <h1 style={{ color:'#E6EDF3', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>Reports & Logs</h1>
            <p style={{ color:'#7D8590', fontSize:13, marginTop:3 }}>Generate security reports & browse system logs</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Calendar size={13} color="#7D8590" />
            <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} style={{ ...INPUT_S, cursor:'pointer', width:140 }}>
              {[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['custom','Custom'],['all','All Time']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {reportPeriod === 'custom' && (<>
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ ...INPUT_S, colorScheme:'dark' }} />
            <span style={{ color:'#484F58', fontSize:12 }}>to</span>
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ ...INPUT_S, colorScheme:'dark' }} />
          </>)}
          <button disabled={isGenerating} onClick={handleGenerate}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:'none', cursor: isGenerating ? 'not-allowed' : 'pointer', background: isGenerating ? 'rgba(188,140,255,0.35)' : 'linear-gradient(135deg,#BC8CFF,#8957e5)', color:'white', fontSize:13, fontWeight:600, fontFamily:'inherit', boxShadow: isGenerating ? 'none' : '0 4px 16px rgba(188,140,255,0.35)', transition:'all 0.2s' }}>
            {isGenerating ? <Loader2 size={15} style={{ animation:'rl-spin 0.8s linear infinite' }} /> : <FileText size={15} />}
            {isGenerating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="rl-row" style={{ display:'flex', gap:4, marginBottom:20, background:'rgba(22,27,34,0.6)', borderRadius:10, padding:3, width:'fit-content' }}>
        {(['reports','logs'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, fontFamily:'inherit', cursor:'pointer', transition:'all 0.2s',
              background: activeTab === t ? 'linear-gradient(135deg,#1F6FEB,#2679f5)' : 'transparent',
              color: activeTab === t ? 'white' : '#7D8590',
              boxShadow: activeTab === t ? '0 2px 8px rgba(31,111,235,0.3)' : 'none',
            }}>
            {t === 'reports' ? `Reports (${reports.length})` : `System Logs (${logsTotal.toLocaleString()})`}
          </button>
        ))}
      </div>

      {/* ── Reports Tab ── */}
      {activeTab === 'reports' && (
        <div className="rl-row">
          {reports.length === 0 ? (
            <div style={{ ...CARD, padding:'60px 20px', textAlign:'center' }}>
              <FileText size={44} color="#21262D" style={{ margin:'0 auto 12px' }} />
              <div style={{ color:'#7D8590', fontSize:13 }}>No reports generated yet</div>
              <div style={{ color:'#484F58', fontSize:12, marginTop:6 }}>Click "Generate Report" to create your first security report</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {reports.map((r: any) => {
                const pc = PERIOD_CLR[r.period_type] || '#7D8590';
                return (
                  <div key={r.report_id} style={{ ...CARD, padding:'18px 22px', transition:'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(31,111,235,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262D')}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <span style={{ color:'#E6EDF3', fontSize:15, fontWeight:600 }}>{r.title}</span>
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, color:'#58A6FF', background:'rgba(88,166,255,0.1)', border:'1px solid rgba(88,166,255,0.25)' }}>{r.type}</span>
                          {r.period_type && <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, color:pc, background:`${pc}10`, border:`1px solid ${pc}33` }}>{r.period_type.charAt(0).toUpperCase() + r.period_type.slice(1)}</span>}
                        </div>
                        <div style={{ display:'flex', gap:20, flexWrap:'wrap', fontSize:12 }}>
                          <span><span style={{ color:'#7D8590' }}>ID:</span> <span style={{ color:'#C9D1D9', fontFamily:'monospace' }}>{r.report_id}</span></span>
                          <span><span style={{ color:'#7D8590' }}>Generated:</span> <span style={{ color:'#C9D1D9' }}>{r.generated_at}</span></span>
                          <span><span style={{ color:'#7D8590' }}>By:</span> <span style={{ color:'#C9D1D9' }}>{r.generated_by || 'system'}</span></span>
                          <span><span style={{ color:'#7D8590' }}>Period:</span> <span style={{ color:'#C9D1D9' }}>{r.period}</span></span>
                          <span><span style={{ color:'#7D8590' }}>Detections:</span> <span style={{ color:'#58A6FF', fontWeight:600, fontFamily:'monospace' }}>{(r.summary?.total_detections || 0).toLocaleString()}</span></span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
                        <button onClick={() => handleViewReport(r.report_id)} style={BTN('#C9D1D9')}><Eye size={12} /> View</button>
                        <button onClick={() => handleExportReport(r)} style={BTN('#58A6FF')}><Download size={12} /> CSV</button>
                        <button onClick={() => handleDeleteReport(r.report_id)} style={BTN('#FF4D4D')}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Report Detail */}
          {selectedReport && (
            <div style={{ ...CARD, padding:'24px 28px', marginTop:16, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(188,140,255,0.4),transparent)' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                  <div style={{ color:'#E6EDF3', fontSize:16, fontWeight:700 }}>{selectedReport.title}</div>
                  <span style={{ color:'#484F58', fontSize:12, fontFamily:'monospace' }}>{selectedReport.report_id}</span>
                </div>
                <button onClick={() => setSelectedReport(null)} style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid #30363D', color:'#C9D1D9', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}>Close</button>
              </div>

              {/* Summary stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { label:'Detections', value:selectedReport.summary?.total_detections, color:'#58A6FF', icon:Shield },
                  { label:'IP Blocks', value:selectedReport.summary?.total_blocks, color:'#FF4D4D', icon:Shield },
                  { label:'Total Alerts', value:selectedReport.summary?.total_alerts, color:'#FFA657', icon:AlertTriangle },
                  { label:'Active Alerts', value:selectedReport.summary?.active_alerts, color:'#E3B341', icon:AlertTriangle },
                  { label:'Log Entries', value:selectedReport.summary?.total_logs, color:'#3FB950', icon:BarChart3 },
                ].map((s, i) => (
                  <div key={i} style={{ background:'rgba(13,17,23,0.6)', borderRadius:12, padding:'14px 16px', border:'1px solid #21262D', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-16, right:-16, width:50, height:50, borderRadius:'50%', background:`radial-gradient(circle,${s.color}20 0%,transparent 70%)`, pointerEvents:'none' }} />
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}><s.icon size={14} color={s.color} /><span style={{ color:'#7D8590', fontSize:11 }}>{s.label}</span></div>
                    <div style={{ color:s.color, fontSize:22, fontWeight:700, fontFamily:'monospace' }}>{(s.value || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* Attack sources + Action distribution */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <div style={{ color:'#E6EDF3', fontSize:13, fontWeight:600, marginBottom:10 }}>Top Attack Sources</div>
                  {selectedReport.top_attack_sources?.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {selectedReport.top_attack_sources.map((s: any, i: number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(13,17,23,0.5)', borderRadius:8, padding:'8px 12px', border:'1px solid #21262D' }}>
                          <span style={{ color:'#E6EDF3', fontFamily:'monospace', fontSize:12 }}>{s.ip}</span>
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, color:'#FF4D4D', background:'rgba(255,77,77,0.1)', border:'1px solid rgba(255,77,77,0.25)' }}>{s.count} attacks</span>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ color:'#484F58', fontSize:12 }}>No attack sources found</div>}
                </div>
                <div>
                  <div style={{ color:'#E6EDF3', fontSize:13, fontWeight:600, marginBottom:10 }}>Action Distribution</div>
                  {selectedReport.action_distribution?.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {selectedReport.action_distribution.map((a: any, i: number) => {
                        const total = selectedReport.summary?.total_detections || 1;
                        const pct = ((a.count / total) * 100).toFixed(1);
                        const c = a.action === 'CRITICAL_BLOCK' ? '#FF4D4D' : a.action === 'BLOCK_IP' ? '#FFA657' : a.action === 'ALERT_ADMIN' ? '#E3B341' : '#3FB950';
                        return (
                          <div key={i} style={{ background:'rgba(13,17,23,0.5)', borderRadius:8, padding:'8px 12px', border:'1px solid #21262D' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                              <span style={{ color:'#E6EDF3', fontSize:12 }}>{a.action}</span>
                              <span style={{ color:'#7D8590', fontSize:11 }}>{a.count} ({pct}%)</span>
                            </div>
                            <div style={{ height:4, background:'#21262D', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:2, width:`${pct}%`, background:c, transition:'width 0.4s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div style={{ color:'#484F58', fontSize:12 }}>No action data available</div>}
                </div>
              </div>
              <div style={{ marginTop:14, color:'#484F58', fontSize:11 }}>Generated by <span style={{ color:'#C9D1D9' }}>{selectedReport.generated_by}</span> on {selectedReport.generated_at}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Logs Tab ── */}
      {activeTab === 'logs' && (
        <div className="rl-row" style={{ ...CARD, padding:'20px 24px' }}>
          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Filter size={13} color="#7D8590" />
              <select value={logLevel} onChange={e => { setLogLevel(e.target.value); setLogsPage(1); }} style={{ ...INPUT_S, cursor:'pointer', width:130 }}>
                {[['all-levels','All Levels'],['critical','Critical'],['high','High'],['medium','Medium'],['info','Info']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Terminal size={13} color="#7D8590" />
              <select value={logSource} onChange={e => { setLogSource(e.target.value); setLogsPage(1); }} style={{ ...INPUT_S, cursor:'pointer', width:140 }}>
                {[['all-sources','All Sources'],['IDS_RESPONSE','IDS Response'],['SYSTEM','System'],['AUTH','Auth']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex:1, position:'relative', minWidth:200 }}>
              <Search size={14} color="#484F58" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
              <input value={logSearchInput} onChange={e => setLogSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogSearch()}
                placeholder="Search logs…" style={{ ...INPUT_S, width:'100%', paddingLeft:32 }} />
            </div>
            {logSearch && <button onClick={() => { setLogSearch(''); setLogSearchInput(''); setLogsPage(1); }} style={{ padding:6, borderRadius:6, background:'#21262D', border:'none', color:'#7D8590', cursor:'pointer' }}><X size={13} /></button>}
            <button onClick={() => { downloadCSV(logs, 'system-logs.csv'); toast.success('Exported'); }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid #30363D', color:'#C9D1D9', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}>
              <Download size={13} /> Export
            </button>
          </div>

          {/* Log entries */}
          <div style={{ background:'rgba(13,17,23,0.6)', borderRadius:12, border:'1px solid #21262D', maxHeight:500, overflowY:'auto', padding:8 }}>
            {logs.length > 0 ? logs.map((log: any, i: number) => {
              const lc = LEVEL_CLR[log.level] || '#3FB950';
              return (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 10px', borderRadius:6, fontFamily:'monospace', fontSize:12, transition:'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(22,27,34,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ color:'#484F58', whiteSpace:'nowrap', minWidth:140, flexShrink:0 }}>{log.timestamp}</span>
                  <span style={{ padding:'1px 6px', borderRadius:4, fontSize:10, fontWeight:700, color:lc, background:`${lc}12`, border:`1px solid ${lc}30`, whiteSpace:'nowrap', minWidth:55, textAlign:'center', flexShrink:0 }}>{log.level}</span>
                  <span style={{ color:'#58A6FF', whiteSpace:'nowrap', flexShrink:0 }}>[{log.source}]</span>
                  <span style={{ color:'#C9D1D9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.message}</span>
                </div>
              );
            }) : (
              <div style={{ textAlign:'center', padding:'50px 0', color:'#484F58' }}>
                <Terminal size={36} color="#21262D" style={{ margin:'0 auto 10px' }} />
                <div style={{ fontSize:13 }}>No log entries found{logSearch ? ` matching "${logSearch}"` : ''}</div>
                <div style={{ fontSize:12, marginTop:6 }}>Run the traffic simulator to generate log data</div>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:14, borderTop:'1px solid #21262D' }}>
            <span style={{ color:'#7D8590', fontSize:12 }}>
              {Math.min((logsPage - 1) * logsLimit + 1, logsTotal)}–{Math.min(logsPage * logsLimit, logsTotal)} of {logsTotal.toLocaleString()}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button disabled={logsPage <= 1} onClick={() => setLogsPage(p => p - 1)}
                style={{ padding:'5px 10px', borderRadius:6, background: logsPage <= 1 ? 'transparent' : 'rgba(255,255,255,0.04)', border:'1px solid #30363D', color: logsPage <= 1 ? '#30363D' : '#C9D1D9', cursor: logsPage <= 1 ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ color:'#E6EDF3', fontSize:12 }}>Page {logsPage} / {totalPages}</span>
              <button disabled={logsPage >= totalPages} onClick={() => setLogsPage(p => p + 1)}
                style={{ padding:'5px 10px', borderRadius:6, background: logsPage >= totalPages ? 'transparent' : 'rgba(255,255,255,0.04)', border:'1px solid #30363D', color: logsPage >= totalPages ? '#30363D' : '#C9D1D9', cursor: logsPage >= totalPages ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
