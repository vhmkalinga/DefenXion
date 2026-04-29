import { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Zap, AlertTriangle, CheckCircle, XCircle, Plus, Pencil, Trash2, Save, X, Filter } from 'lucide-react';
import { getActiveResponses, getDefenseModules, toggleDefenseModule, getDefenseSettings, updateDefenseSettings, getFirewallRules, createFirewallRule, updateFirewallRule, deleteFirewallRule } from '../../services/api';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Slider } from '../ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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

const ACTION_COLORS: Record<string, string> = {
  DROP:     'border-[#FF4D4D] text-[#FF4D4D] bg-[#FF4D4D]/10',
  REJECT:   'border-[#FF4D4D] text-[#FF4D4D] bg-[#FF4D4D]/10',
  THROTTLE: 'border-[#FFA657] text-[#FFA657] bg-[#FFA657]/10',
  ALERT:    'border-[#D29922] text-[#D29922] bg-[#D29922]/10',
  LOG:      'border-[#58A6FF] text-[#58A6FF] bg-[#58A6FF]/10',
  ALLOW:    'border-[#3FB950] text-[#3FB950] bg-[#3FB950]/10',
};
const PRIORITY_COLORS: Record<string, string> = {
  High:   'border-[#FF4D4D] text-[#FF4D4D]',
  Medium: 'border-[#FFA657] text-[#FFA657]',
  Low:    'border-[#7D8590] text-[#7D8590]',
};

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

  const inputCls = "w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] placeholder:text-[#484F58]";
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#E6EDF3] text-2xl font-bold">Active Defense Systems</h2>
          <p className="text-[#7D8590] text-sm mt-1">Real-time threat mitigation and firewall policy management</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isAllGood ? 'bg-[#3FB950]/10 border border-[#3FB950]/30' : 'bg-[#FFA657]/10 border border-[#FFA657]/30'}`}>
          <div className={`w-2 h-2 rounded-full ${isAllGood ? 'bg-[#3FB950]' : 'bg-[#FFA657] animate-pulse'}`} />
          <span className={`text-sm font-medium ${isAllGood ? 'text-[#3FB950]' : 'text-[#FFA657]'}`}>
            {isAllGood ? 'All Systems Operational' : `${modules.filter(m => !m.enabled).length} Module(s) Disabled`}
          </span>
        </div>
      </div>

      {/* Defense Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod: any, i: number) => {
          const Icon = ICON_MAP[mod.icon] || Shield;
          return (
            <div key={i} className={`bg-[#1E232B] rounded-2xl p-5 border transition-all ${mod.enabled ? 'border-[#30363D]' : 'border-[#FF4D4D]/40'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${mod.enabled ? 'bg-[#1F6FEB]/10' : 'bg-[#FF4D4D]/10'}`}>
                  <Icon className={`w-5 h-5 ${mod.enabled ? 'text-[#58A6FF]' : 'text-[#FF4D4D]'}`} />
                </div>
                <Switch checked={mod.enabled} onCheckedChange={() => handleToggleModule(mod.name)} />
              </div>
              <h3 className="text-[#E6EDF3] font-semibold text-sm mb-1">{mod.name}</h3>
              <p className="text-[#7D8590] text-xs leading-relaxed mb-3">{mod.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[#30363D]">
                <span className="text-[#7D8590] text-xs">Threats Blocked</span>
                <span className={`font-mono text-sm font-bold ${mod.enabled ? 'text-[#3FB950]' : 'text-[#484F58]'}`}>
                  {mod.enabled ? (mod.blocked_today || 0).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Defense Settings */}
      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
        <h3 className="text-[#E6EDF3] font-semibold mb-6">Defense Settings</h3>
        <div className="space-y-6">

          {/* Threat Sensitivity */}
          <div className="bg-[#161B22] rounded-xl p-5 border border-[#30363D]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#E6EDF3] text-sm font-semibold">Threat Sensitivity</div>
                <div className="text-[#7D8590] text-xs mt-0.5">Adjust the ML classifier detection threshold</div>
              </div>
              <Badge variant="outline" className={`ml-4 shrink-0 ${
                settings.sensitivity >= 80 ? 'border-[#FF4D4D] text-[#FF4D4D]'
                : settings.sensitivity >= 50 ? 'border-[#FFA657] text-[#FFA657]'
                : 'border-[#58A6FF] text-[#58A6FF]'
              }`}>
                {getSensitivityLabel(settings.sensitivity)} — {settings.sensitivity}%
              </Badge>
            </div>
            <Slider value={[settings.sensitivity]} max={100} step={5} className="w-full"
              onValueCommit={async (v) => { try { await updateDefenseSettings({ sensitivity: v[0] }); toast.success('Sensitivity updated'); } catch {} }}
              onValueChange={(v) => setSettings(s => ({ ...s, sensitivity: v[0] }))} />
            <div className="flex justify-between text-xs text-[#484F58] mt-2">
              <span>Low</span><span>Medium</span><span>High</span><span>Maximum</span>
            </div>
          </div>

          {/* Auto-Block Duration */}
          <div className="bg-[#161B22] rounded-xl p-5 border border-[#30363D]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#E6EDF3] text-sm font-semibold">Auto-Block Duration</div>
                <div className="text-[#7D8590] text-xs mt-0.5">Default ban period applied to automatically blocked IPs</div>
              </div>
              <Badge variant="outline" className="ml-4 shrink-0 border-[#58A6FF] text-[#58A6FF]">
                {getBlockDurationLabel(settings.block_duration_hours)}
              </Badge>
            </div>
            <Slider value={[settings.block_duration_hours]} max={168} step={1} className="w-full"
              onValueCommit={async (v) => { try { await updateDefenseSettings({ block_duration_hours: v[0] }); toast.success('Block duration updated'); } catch {} }}
              onValueChange={(v) => setSettings(s => ({ ...s, block_duration_hours: v[0] }))} />
            <div className="flex justify-between text-xs text-[#484F58] mt-2">
              <span>1h</span><span>24h</span><span>72h</span><span>1 week</span>
            </div>
          </div>

        </div>
      </div>

      {/* Firewall Rules */}
      <div className="bg-[#1E232B] rounded-2xl border border-[#30363D] overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D] bg-[#161B22]">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-[#E6EDF3] font-semibold">Firewall Policy Rules</h3>
              <p className="text-[#7D8590] text-xs mt-0.5">{activeRules} active · {rules.length} total · {totalHits.toLocaleString()} hits all-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#7D8590]" />
              <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                className="bg-[#0D1117] border border-[#30363D] rounded-lg px-2 py-1.5 text-[#E6EDF3] text-xs focus:outline-none focus:border-[#1F6FEB] cursor-pointer">
                <option value="ALL">All Actions</option>
                <option value="DROP">DROP</option>
                <option value="REJECT">REJECT</option>
                <option value="THROTTLE">THROTTLE</option>
                <option value="ALLOW">ALLOW</option>
                <option value="LOG">LOG</option>
                <option value="ALERT">ALERT</option>
              </select>
            </div>
            <Button className="bg-[#1F6FEB] hover:bg-[#388BFD] gap-2 h-8 text-sm px-3" onClick={() => setShowAddRule(v => !v)}>
              <Plus className="w-4 h-4" /> Add Rule
            </Button>
          </div>
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div className="bg-[#0D1117] border-b border-[#1F6FEB]/30 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[#E6EDF3] font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1F6FEB]" /> New Firewall Rule
              </h4>
              <button onClick={() => { setShowAddRule(false); setNewRule(EMPTY_FORM); }} className="text-[#7D8590] hover:text-[#E6EDF3]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-[#7D8590] text-xs block mb-1">Rule Name *</label>
                <input value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} placeholder="e.g. Block Tor Exit Nodes" className={inputCls} />
              </div>
              <div>
                <label className="text-[#7D8590] text-xs block mb-1">Source IP / CIDR</label>
                <input value={newRule.source_ip} onChange={e => setNewRule(r => ({ ...r, source_ip: e.target.value }))} placeholder="* or 192.168.1.0/24" className={inputCls} />
              </div>
              <div>
                <label className="text-[#7D8590] text-xs block mb-1">Destination</label>
                <input value={newRule.destination} onChange={e => setNewRule(r => ({ ...r, destination: e.target.value }))} placeholder="* or 10.0.0.1" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-[#7D8590] text-xs block mb-1">Port</label>
                <input value={newRule.port} onChange={e => setNewRule(r => ({ ...r, port: e.target.value }))} placeholder="* or 443" className={inputCls} />
              </div>
              <div>
                <label className="text-[#7D8590] text-xs block mb-1">Protocol</label>
                <select value={newRule.protocol} onChange={e => setNewRule(r => ({ ...r, protocol: e.target.value }))} className={selectCls}>
                  {['TCP','UDP','ICMP','ANY'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[#7D8590] text-xs block mb-1">Priority</label>
                <select value={newRule.priority} onChange={e => setNewRule(r => ({ ...r, priority: e.target.value }))} className={selectCls}>
                  {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[#7D8590] text-xs block mb-1">Action</label>
                <select value={newRule.action} onChange={e => setNewRule(r => ({ ...r, action: e.target.value }))} className={selectCls}>
                  {['DROP','REJECT','THROTTLE','ALLOW','ALERT','LOG'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-[#3FB950] hover:bg-[#3FB950]/90 gap-2 h-8 text-sm px-4" onClick={handleAddRule}>
                <Save className="w-3.5 h-3.5" /> Create Rule
              </Button>
              <Button variant="ghost" className="text-[#7D8590] h-8 text-sm" onClick={() => { setShowAddRule(false); setNewRule(EMPTY_FORM); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#30363D] hover:bg-transparent">
                {['#','Rule Name','Source IP','Dest.','Port','Proto','Priority','Action','Status','Hits',''].map(h => (
                  <TableHead key={h} className="text-[#7D8590] text-xs font-semibold whitespace-nowrap">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule: any) => (
                <TableRow key={rule.rule_id} className="border-[#30363D] hover:bg-[#161B22] transition-colors group">
                  <TableCell className="text-[#484F58] font-mono text-xs w-8">{rule.rule_id}</TableCell>

                  {/* Name */}
                  <TableCell className="text-[#E6EDF3] font-medium text-sm min-w-[180px]">
                    {editingRule === rule.rule_id
                      ? <input value={editData.name ?? rule.name} onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))} className={inputCls + ' py-1'} />
                      : <span className={rule.status === 'Disabled' ? 'opacity-40 line-through' : ''}>{rule.name}</span>
                    }
                  </TableCell>

                  {/* Source IP */}
                  <TableCell className="font-mono text-xs text-[#C9D1D9]">
                    {editingRule === rule.rule_id
                      ? <input value={editData.source_ip ?? rule.source_ip ?? '*'} onChange={e => setEditData((d: any) => ({ ...d, source_ip: e.target.value }))} className={inputCls + ' py-1 w-32'} />
                      : <span className="bg-[#161B22] px-2 py-0.5 rounded">{rule.source_ip || '*'}</span>
                    }
                  </TableCell>

                  {/* Destination */}
                  <TableCell className="font-mono text-xs text-[#C9D1D9]">
                    <span className="bg-[#161B22] px-2 py-0.5 rounded">{rule.destination || '*'}</span>
                  </TableCell>

                  {/* Port */}
                  <TableCell className="font-mono text-xs text-[#C9D1D9]">
                    {editingRule === rule.rule_id
                      ? <input value={editData.port ?? rule.port ?? '*'} onChange={e => setEditData((d: any) => ({ ...d, port: e.target.value }))} className={inputCls + ' py-1 w-16'} />
                      : <span>{rule.port || '*'}</span>
                    }
                  </TableCell>

                  {/* Protocol */}
                  <TableCell>
                    <span className="text-[#7D8590] text-xs font-mono bg-[#0D1117] px-2 py-0.5 rounded border border-[#30363D]">{rule.protocol || 'TCP'}</span>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    {editingRule === rule.rule_id
                      ? <select value={editData.priority ?? rule.priority} onChange={e => setEditData((d: any) => ({ ...d, priority: e.target.value }))} className={selectCls + ' py-1 w-24'}>
                          {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                        </select>
                      : <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[rule.priority] || ''}`}>{rule.priority}</Badge>
                    }
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    {editingRule === rule.rule_id
                      ? <select value={editData.action ?? rule.action} onChange={e => setEditData((d: any) => ({ ...d, action: e.target.value }))} className={selectCls + ' py-1 w-28'}>
                          {['DROP','REJECT','THROTTLE','ALLOW','ALERT','LOG'].map(a => <option key={a}>{a}</option>)}
                        </select>
                      : <Badge variant="outline" className={`text-xs font-bold ${ACTION_COLORS[rule.action] || ''}`}>{rule.action}</Badge>
                    }
                  </TableCell>

                  {/* Status toggle */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => handleToggleStatus(rule.rule_id, rule.status)}>
                      {rule.status === 'Active'
                        ? <><CheckCircle className="w-3.5 h-3.5 text-[#3FB950]" /><span className="text-[#3FB950] text-xs">Active</span></>
                        : <><XCircle className="w-3.5 h-3.5 text-[#484F58]" /><span className="text-[#484F58] text-xs">Disabled</span></>
                      }
                    </div>
                  </TableCell>

                  {/* Hits */}
                  <TableCell>
                    <span className={`font-mono text-sm font-bold ${(rule.hits || 0) > 0 ? 'text-[#FF4D4D]' : 'text-[#484F58]'}`}>
                      {(rule.hits || 0).toLocaleString()}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingRule === rule.rule_id ? (
                        <>
                          <button onClick={() => handleSaveEdit(rule.rule_id)} className="p-1.5 rounded bg-[#3FB950]/20 text-[#3FB950] hover:bg-[#3FB950]/30" title="Save"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingRule(null)} className="p-1.5 rounded bg-[#30363D] text-[#7D8590] hover:bg-[#484F58]" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingRule(rule.rule_id); setEditData({ name: rule.name, source_ip: rule.source_ip, port: rule.port, priority: rule.priority, action: rule.action }); }}
                            className="p-1.5 rounded bg-[#1F6FEB]/20 text-[#58A6FF] hover:bg-[#1F6FEB]/30" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(rule.rule_id)}
                            className="p-1.5 rounded bg-[#FF4D4D]/10 text-[#FF4D4D] hover:bg-[#FF4D4D]/20" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-[#484F58]">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No rules match the current filter.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Automated Responses */}
      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[#E6EDF3] font-semibold">Automated Response Log</h3>
          <Badge variant="outline" className="border-[#3FB950] text-[#3FB950]">{liveResponses.length} Recent</Badge>
        </div>
        {liveResponses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveResponses.map((r: any, i: number) => (
              <div key={i} className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 hover:border-[#484F58] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[#E6EDF3] text-sm font-medium">{r.reason || r.trigger}</div>
                  <Badge variant="outline" className={`text-xs ${ACTION_COLORS[r.action] || ''}`}>{r.action}</Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#21262D]">
                  <span className="text-[#7D8590] text-xs font-mono">Target: {r.target || 'N/A'}</span>
                  <span className="text-[#484F58] text-xs">{r.timestamp || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-[#484F58]">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No automated responses recorded yet.</p>
            <p className="text-xs mt-1">Run the traffic simulator to generate threat detections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
