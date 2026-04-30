import { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Zap, AlertTriangle, CheckCircle, XCircle, Plus, Pencil, Trash2, Save, X, Filter } from 'lucide-react';
import { getActiveResponses, getDefenseModules, toggleDefenseModule, getDefenseSettings, updateDefenseSettings, getFirewallRules, createFirewallRule, updateFirewallRule, deleteFirewallRule } from '../../services/api';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { Slider } from '../ui/slider';

const ICON_MAP: Record<string, any> = { Shield, Lock, Zap, AlertTriangle };

function getSensitivityLabel(val: number) {
  if (val <= 25) return 'Low';
  if (val <= 50) return 'Medium';
  if (val <= 80) return 'High';
  return 'Maximum';
}
function getBlockDurationLabel(h: number) {
  if (h < 24) return `${h}h`;
  if (h < 48) return '1 day';
  if (h < 72) return '2 days';
  if (h < 168) return `${Math.round(h / 24)} days`;
  return '1 week';
}

const ACTION_CLR: Record<string, string> = { DROP:'#FF4D4D', REJECT:'#FF4D4D', THROTTLE:'#FFA657', ALERT:'#E3B341', LOG:'#58A6FF', ALLOW:'#3FB950' };
const PRIORITY_CLR: Record<string, string> = { High:'#FF4D4D', Medium:'#FFA657', Low:'#7D8590' };

const EMPTY_FORM = { name: '', source_ip: '*', destination: '*', port: '*', protocol: 'TCP', priority: 'Medium', action: 'DROP' };

export function ActiveDefense() {
  const [modules, setModules]           = useState<any[]>([]);
  const [settings, setSettings]         = useState({ sensitivity: 80, block_duration_hours: 24 });
  const [rules, setRules]               = useState<any[]>([]);
  const [liveResponses, setLiveResponses] = useState<any[]>([]);
  const [showAddRule, setShowAddRule]   = useState(false);
  const [newRule, setNewRule]           = useState(EMPTY_FORM);
  const [editingRule, setEditingRule]   = useState<number | null>(null);
  const [editData, setEditData]         = useState<any>({});
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchAll = useCallback(() => {
    getDefenseModules().then(setModules).catch(console.error);
    getDefenseSettings().then(setSettings).catch(console.error);
    getFirewallRules().then(setRules).catch(console.error);
    getActiveResponses().then(r => { if (r?.length > 0) setLiveResponses(r); }).catch(console.error);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const handleToggleModule = async (name: string) => {
    try { const r = await toggleDefenseModule(name); toast.success(r.message); fetchAll(); }
    catch { toast.error('Failed to toggle module'); }
  };

  const handleAddRule = async () => {
    if (!newRule.name.trim()) { toast.error('Rule name is required'); return; }
    try {
      const created = await createFirewallRule(newRule);
      toast.success(`Rule "${created.name}" created`);
      setShowAddRule(false); setNewRule(EMPTY_FORM); fetchAll();
    } catch { toast.error('Failed to create rule'); }
  };

  const handleSaveEdit = async (ruleId: number) => {
    try {
      await updateFirewallRule(ruleId, editData);
      toast.success('Rule updated'); setEditingRule(null); fetchAll();
    } catch { toast.error('Failed to update rule'); }
  };

  const handleToggleStatus = async (ruleId: number, current: string) => {
    try {
      await updateFirewallRule(ruleId, { status: current === 'Active' ? 'Disabled' : 'Active' });
      toast.success(`Rule ${current === 'Active' ? 'disabled' : 'enabled'}`); fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Delete this firewall rule? This cannot be undone.')) return;
    try { await deleteFirewallRule(ruleId); toast.success('Rule deleted'); fetchAll(); }
    catch { toast.error('Failed to delete rule'); }
  };

  const isAllGood = modules.every(m => m.enabled);
  const activeRules = rules.filter(r => r.status === 'Active').length;
  const filteredRules = filterAction === 'ALL' ? rules : rules.filter(r => r.action === filterAction);
  const totalHits = rules.reduce((s, r) => s + (r.hits || 0), 0);

  const INPUT_S: React.CSSProperties = { width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:8, padding:'7px 10px', color:'#E6EDF3', fontSize:12, outline:'none', fontFamily:'inherit', boxSizing:'border-box' };

  const CARD = { background:'linear-gradient(135deg,#161B22,#1a1f28)', border:'1px solid #21262D', borderRadius:16 };

  return (
    <>
      <style>{`
        @keyframes ad-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ad-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .ad-row { animation:ad-fadeup 0.35s ease both; }
        .ad-row:nth-child(2){animation-delay:.06s} .ad-row:nth-child(3){animation-delay:.12s}
        .ad-row:nth-child(4){animation-delay:.18s} .ad-row:nth-child(5){animation-delay:.24s}
      `}</style>

    <div style={{ padding:'28px 32px', maxWidth:1440, margin:'0 auto' }}>

      {/* ── Header ── */}
      <div className="ad-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#3FB950,#2ea043)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(63,185,80,0.3)' }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 style={{ color:'#E6EDF3', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>Active Defense Systems</h1>
            <p style={{ color:'#7D8590', fontSize:13, marginTop:3 }}>Real-time threat mitigation & firewall policy management</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:20, background: isAllGood ? 'rgba(63,185,80,0.08)' : 'rgba(255,166,87,0.08)', border:`1px solid ${isAllGood ? 'rgba(63,185,80,0.2)' : 'rgba(255,166,87,0.2)'}` }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background: isAllGood ? '#3FB950' : '#FFA657', boxShadow:`0 0 8px ${isAllGood ? 'rgba(63,185,80,0.6)' : 'rgba(255,166,87,0.6)'}`, animation:'ad-blink 2s ease-in-out infinite' }} />
          <span style={{ fontSize:12, fontWeight:600, color: isAllGood ? '#3FB950' : '#FFA657' }}>
            {isAllGood ? 'All Systems Operational' : `${modules.filter(m => !m.enabled).length} Module(s) Disabled`}
          </span>
        </div>
      </div>

      {/* ── Defense Modules ── */}
      <div className="ad-row" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
        {modules.map((mod: any, i: number) => {
          const Icon = ICON_MAP[mod.icon] || Shield;
          const accent = mod.enabled ? '#58A6FF' : '#FF4D4D';
          return (
            <div key={i} style={{ ...CARD, padding:'20px 22px', border:`1px solid ${mod.enabled ? '#21262D' : 'rgba(255,77,77,0.25)'}`, position:'relative', overflow:'hidden', transition:'border-color 0.2s' }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:60, height:60, borderRadius:'50%', background:`radial-gradient(circle,${accent}20 0%,transparent 70%)`, pointerEvents:'none' }} />
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${accent}18`, border:`1px solid ${accent}33`, display:'flex', alignItems:'center', justifyContent:'center', color:accent }}>
                  <Icon size={17} />
                </div>
                <Switch checked={mod.enabled} onCheckedChange={() => handleToggleModule(mod.name)} />
              </div>
              <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:4 }}>{mod.name}</div>
              <div style={{ color:'#7D8590', fontSize:12, lineHeight:1.5, marginBottom:14 }}>{mod.description}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid #21262D' }}>
                <span style={{ color:'#7D8590', fontSize:11 }}>Threats Blocked</span>
                <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color: mod.enabled ? '#3FB950' : '#484F58' }}>
                  {mod.enabled ? (mod.blocked_today || 0).toLocaleString() : '—'}
                </span>
              </div>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${accent}55,transparent)` }} />
            </div>
          );
        })}
      </div>

      {/* ── Defense Settings ── */}
      <div className="ad-row" style={{ ...CARD, padding:'20px 24px', marginBottom:20 }}>
        <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:20 }}>Defense Settings</div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'rgba(13,17,23,0.5)', borderRadius:12, padding:'18px 20px', border:'1px solid #21262D' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ color:'#E6EDF3', fontSize:13, fontWeight:600 }}>Threat Sensitivity</div>
                <div style={{ color:'#7D8590', fontSize:11, marginTop:2 }}>ML classifier detection threshold</div>
              </div>
              <span style={{
                padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                color: settings.sensitivity >= 80 ? '#FF4D4D' : settings.sensitivity >= 50 ? '#FFA657' : '#58A6FF',
                background: settings.sensitivity >= 80 ? 'rgba(255,77,77,0.1)' : settings.sensitivity >= 50 ? 'rgba(255,166,87,0.1)' : 'rgba(88,166,255,0.1)',
                border: `1px solid ${settings.sensitivity >= 80 ? 'rgba(255,77,77,0.3)' : settings.sensitivity >= 50 ? 'rgba(255,166,87,0.3)' : 'rgba(88,166,255,0.3)'}`,
              }}>
                {getSensitivityLabel(settings.sensitivity)} — {settings.sensitivity}%
              </span>
            </div>
            <Slider value={[settings.sensitivity]} max={100} step={5} className="w-full"
              onValueCommit={async (v) => { try { await updateDefenseSettings({ sensitivity: v[0] }); toast.success('Sensitivity updated'); } catch {} }}
              onValueChange={(v) => setSettings(s => ({ ...s, sensitivity: v[0] }))} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#484F58', marginTop:8 }}>
              <span>Low</span><span>Medium</span><span>High</span><span>Maximum</span>
            </div>
          </div>

          <div style={{ background:'rgba(13,17,23,0.5)', borderRadius:12, padding:'18px 20px', border:'1px solid #21262D' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ color:'#E6EDF3', fontSize:13, fontWeight:600 }}>Auto-Block Duration</div>
                <div style={{ color:'#7D8590', fontSize:11, marginTop:2 }}>Default ban period for blocked IPs</div>
              </div>
              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, color:'#58A6FF', background:'rgba(88,166,255,0.1)', border:'1px solid rgba(88,166,255,0.25)' }}>
                {getBlockDurationLabel(settings.block_duration_hours)}
              </span>
            </div>
            <Slider value={[settings.block_duration_hours]} max={168} step={1} className="w-full"
              onValueCommit={async (v) => { try { await updateDefenseSettings({ block_duration_hours: v[0] }); toast.success('Block duration updated'); } catch {} }}
              onValueChange={(v) => setSettings(s => ({ ...s, block_duration_hours: v[0] }))} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#484F58', marginTop:8 }}>
              <span>1h</span><span>24h</span><span>72h</span><span>1 week</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Firewall Rules ── */}
      <div className="ad-row" style={{ ...CARD, overflow:'hidden', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid #21262D', background:'rgba(13,17,23,0.4)' }}>
          <div>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600 }}>Firewall Policy Rules</div>
            <div style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>{activeRules} active · {rules.length} total · {totalHits.toLocaleString()} hits all-time</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Filter size={13} color="#7D8590" />
              <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                style={{ background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:8, padding:'5px 8px', color:'#E6EDF3', fontSize:11, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                <option value="ALL">All Actions</option>
                {['DROP','REJECT','THROTTLE','ALLOW','LOG','ALERT'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button onClick={() => setShowAddRule(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'linear-gradient(135deg,#1F6FEB,#2679f5)', border:'none', color:'white', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 12px rgba(31,111,235,0.3)' }}>
              <Plus size={13} /> Add Rule
            </button>
          </div>
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div style={{ background:'rgba(13,17,23,0.5)', borderBottom:'1px solid rgba(31,111,235,0.2)', padding:'18px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#E6EDF3', fontSize:13, fontWeight:600 }}>
                <Plus size={14} color="#1F6FEB" /> New Firewall Rule
              </div>
              <button onClick={() => { setShowAddRule(false); setNewRule(EMPTY_FORM); }} style={{ background:'none', border:'none', color:'#7D8590', cursor:'pointer', padding:4 }}><X size={14} /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10, marginBottom:10 }}>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Rule Name *</div><input value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} placeholder="e.g. Block Tor Exit Nodes" style={INPUT_S} /></div>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Source IP / CIDR</div><input value={newRule.source_ip} onChange={e => setNewRule(r => ({ ...r, source_ip: e.target.value }))} placeholder="*" style={INPUT_S} /></div>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Destination</div><input value={newRule.destination} onChange={e => setNewRule(r => ({ ...r, destination: e.target.value }))} placeholder="*" style={INPUT_S} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Port</div><input value={newRule.port} onChange={e => setNewRule(r => ({ ...r, port: e.target.value }))} placeholder="*" style={INPUT_S} /></div>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Protocol</div><select value={newRule.protocol} onChange={e => setNewRule(r => ({ ...r, protocol: e.target.value }))} style={{ ...INPUT_S, cursor:'pointer' }}>{['TCP','UDP','ICMP','ANY'].map(p => <option key={p}>{p}</option>)}</select></div>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Priority</div><select value={newRule.priority} onChange={e => setNewRule(r => ({ ...r, priority: e.target.value }))} style={{ ...INPUT_S, cursor:'pointer' }}>{['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}</select></div>
              <div><div style={{ color:'#7D8590', fontSize:11, marginBottom:4 }}>Action</div><select value={newRule.action} onChange={e => setNewRule(r => ({ ...r, action: e.target.value }))} style={{ ...INPUT_S, cursor:'pointer' }}>{['DROP','REJECT','THROTTLE','ALLOW','ALERT','LOG'].map(a => <option key={a}>{a}</option>)}</select></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleAddRule} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:'linear-gradient(135deg,#3FB950,#2ea043)', border:'none', color:'white', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 12px rgba(63,185,80,0.3)' }}><Save size={13} /> Create Rule</button>
              <button onClick={() => { setShowAddRule(false); setNewRule(EMPTY_FORM); }} style={{ padding:'7px 14px', borderRadius:8, background:'none', border:'1px solid #30363D', color:'#7D8590', fontSize:12, fontFamily:'inherit', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #21262D' }}>
                {['#','Rule Name','Source IP','Dest.','Port','Proto','Priority','Action','Status','Hits',''].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#7D8590', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule: any) => {
                const ac = ACTION_CLR[rule.action] || '#7D8590';
                const pc = PRIORITY_CLR[rule.priority] || '#7D8590';
                const isEdit = editingRule === rule.rule_id;
                return (
                  <tr key={rule.rule_id} style={{ borderBottom:'1px solid #21262D', transition:'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(22,27,34,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding:'10px 12px', color:'#484F58', fontFamily:'monospace', fontSize:11 }}>{rule.rule_id}</td>
                    <td style={{ padding:'10px 12px', color:'#E6EDF3', fontWeight:500, minWidth:160 }}>
                      {isEdit ? <input value={editData.name ?? rule.name} onChange={e => setEditData((d:any) => ({...d, name:e.target.value}))} style={{...INPUT_S, width:160}} />
                        : <span style={rule.status === 'Disabled' ? {opacity:0.4, textDecoration:'line-through'} : {}}>{rule.name}</span>}
                    </td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:11, color:'#C9D1D9' }}>
                      {isEdit ? <input value={editData.source_ip ?? rule.source_ip ?? '*'} onChange={e => setEditData((d:any) => ({...d, source_ip:e.target.value}))} style={{...INPUT_S, width:120}} />
                        : <span style={{ background:'rgba(22,27,34,0.6)', padding:'2px 6px', borderRadius:4 }}>{rule.source_ip || '*'}</span>}
                    </td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:11, color:'#C9D1D9' }}>
                      <span style={{ background:'rgba(22,27,34,0.6)', padding:'2px 6px', borderRadius:4 }}>{rule.destination || '*'}</span>
                    </td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:11, color:'#C9D1D9' }}>
                      {isEdit ? <input value={editData.port ?? rule.port ?? '*'} onChange={e => setEditData((d:any) => ({...d, port:e.target.value}))} style={{...INPUT_S, width:60}} />
                        : rule.port || '*'}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:10, fontFamily:'monospace', color:'#7D8590', background:'rgba(13,17,23,0.6)', padding:'2px 6px', borderRadius:4, border:'1px solid #21262D' }}>{rule.protocol || 'TCP'}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      {isEdit ? <select value={editData.priority ?? rule.priority} onChange={e => setEditData((d:any) => ({...d, priority:e.target.value}))} style={{...INPUT_S, width:80, cursor:'pointer'}}>{['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}</select>
                        : <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, color:pc, background:`${pc}15`, border:`1px solid ${pc}33` }}>{rule.priority}</span>}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      {isEdit ? <select value={editData.action ?? rule.action} onChange={e => setEditData((d:any) => ({...d, action:e.target.value}))} style={{...INPUT_S, width:90, cursor:'pointer'}}>{['DROP','REJECT','THROTTLE','ALLOW','ALERT','LOG'].map(a => <option key={a}>{a}</option>)}</select>
                        : <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, color:ac, background:`${ac}15`, border:`1px solid ${ac}33` }}>{rule.action}</span>}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', userSelect:'none' }} onClick={() => handleToggleStatus(rule.rule_id, rule.status)}>
                        {rule.status === 'Active'
                          ? <><CheckCircle size={13} color="#3FB950" /><span style={{ color:'#3FB950', fontSize:11 }}>Active</span></>
                          : <><XCircle size={13} color="#484F58" /><span style={{ color:'#484F58', fontSize:11 }}>Disabled</span></>}
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:700, color: (rule.hits || 0) > 0 ? '#FF4D4D' : '#484F58' }}>
                      {(rule.hits || 0).toLocaleString()}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {isEdit ? (<>
                          <button onClick={() => handleSaveEdit(rule.rule_id)} style={{ padding:5, borderRadius:6, background:'rgba(63,185,80,0.15)', border:'none', color:'#3FB950', cursor:'pointer' }}><Save size={13} /></button>
                          <button onClick={() => setEditingRule(null)} style={{ padding:5, borderRadius:6, background:'#21262D', border:'none', color:'#7D8590', cursor:'pointer' }}><X size={13} /></button>
                        </>) : (<>
                          <button onClick={() => { setEditingRule(rule.rule_id); setEditData({ name:rule.name, source_ip:rule.source_ip, port:rule.port, priority:rule.priority, action:rule.action }); }}
                            style={{ padding:5, borderRadius:6, background:'rgba(31,111,235,0.12)', border:'none', color:'#58A6FF', cursor:'pointer' }}><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(rule.rule_id)}
                            style={{ padding:5, borderRadius:6, background:'rgba(255,77,77,0.08)', border:'none', color:'#FF4D4D', cursor:'pointer' }}><Trash2 size={13} /></button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRules.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign:'center', padding:'40px 0', color:'#484F58' }}>
                  <Shield size={32} color="#21262D" style={{ margin:'0 auto 8px', display:'block' }} />
                  <div style={{ fontSize:13 }}>No rules match the current filter</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Automated Responses ── */}
      <div className="ad-row" style={{ ...CARD, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600 }}>Automated Response Log</div>
            <div style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>ML-triggered defense actions</div>
          </div>
          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, color:'#3FB950', background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.25)' }}>
            {liveResponses.length} Recent
          </span>
        </div>
        {liveResponses.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {liveResponses.map((r: any, i: number) => {
              const color = ACTION_CLR[r.action] || '#58A6FF';
              return (
                <div key={i} style={{ background:'rgba(13,17,23,0.5)', borderRadius:12, padding:'14px 16px', border:'1px solid #21262D', transition:'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#30363D')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262D')}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ color:'#E6EDF3', fontSize:13, fontWeight:500 }}>{r.reason || r.trigger}</div>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, color, background:`${color}15`, border:`1px solid ${color}33`, flexShrink:0, marginLeft:8 }}>
                      {r.action}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid #21262D' }}>
                    <span style={{ color:'#7D8590', fontSize:11, fontFamily:'monospace' }}>Target: {r.target || 'N/A'}</span>
                    <span style={{ color:'#484F58', fontSize:11 }}>{r.timestamp || 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#484F58' }}>
            <Shield size={44} color="#21262D" style={{ margin:'0 auto 12px' }} />
            <div style={{ fontSize:13 }}>No automated responses recorded yet</div>
            <div style={{ fontSize:12, marginTop:6 }}>Run the traffic simulator to generate threat detections</div>
          </div>
        )}
      </div>

    </div>
    </>
  );
}
