import { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Zap, AlertTriangle, CheckCircle, XCircle, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import {
  getActiveResponses,
  getDefenseModules,
  toggleDefenseModule,
  getDefenseSettings,
  updateDefenseSettings,
  getFirewallRules,
  createFirewallRule,
  updateFirewallRule,
  deleteFirewallRule,
} from '../../services/api';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Slider } from '../ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const ICON_MAP: Record<string, any> = { Shield, Lock, Zap, AlertTriangle };

const SENSITIVITY_LABELS: Record<number, string> = { 0: 'Low', 25: 'Low', 50: 'Medium', 75: 'High', 100: 'Maximum' };
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

export function ActiveDefense() {
  // ── State ──
  const [modules, setModules] = useState<any[]>([]);
  const [settings, setSettings] = useState({ sensitivity: 80, block_duration_hours: 24 });
  const [rules, setRules] = useState<any[]>([]);
  const [liveResponses, setLiveResponses] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState('All Systems Operational');

  // Rule creation form
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePriority, setNewRulePriority] = useState('Medium');
  const [newRuleAction, setNewRuleAction] = useState('DROP');

  // Rule editing
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editRuleName, setEditRuleName] = useState('');
  const [editRulePriority, setEditRulePriority] = useState('');

  // ── Fetch all data ──
  const fetchModules = useCallback(() => {
    getDefenseModules()
      .then(data => {
        setModules(data);
        const disabledCount = data.filter((m: any) => !m.enabled).length;
        if (disabledCount > 0) setSystemStatus(`${disabledCount} Module${disabledCount > 1 ? 's' : ''} Disabled`);
        else setSystemStatus('All Systems Operational');
      })
      .catch(console.error);
  }, []);

  const fetchSettings = useCallback(() => {
    getDefenseSettings().then(setSettings).catch(console.error);
  }, []);

  const fetchRules = useCallback(() => {
    getFirewallRules().then(setRules).catch(console.error);
  }, []);

  const fetchResponses = useCallback(() => {
    getActiveResponses()
      .then(res => { if (res?.length > 0) setLiveResponses(res); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchModules();
    fetchSettings();
    fetchRules();
    fetchResponses();
  }, []);

  // ── Handlers ──
  const handleToggleModule = async (name: string) => {
    try {
      const res = await toggleDefenseModule(name);
      toast.success(res.message);
      fetchModules();
    } catch {
      toast.error('Failed to toggle module');
    }
  };

  const handleSensitivityChange = async (val: number[]) => {
    const v = val[0];
    setSettings(s => ({ ...s, sensitivity: v }));
    try {
      await updateDefenseSettings({ sensitivity: v });
    } catch { /* debounce errors silently */ }
  };

  const handleBlockDurationChange = async (val: number[]) => {
    const v = val[0];
    setSettings(s => ({ ...s, block_duration_hours: v }));
    try {
      await updateDefenseSettings({ block_duration_hours: v });
    } catch { /* debounce errors silently */ }
  };

  const handleAddRule = async () => {
    if (!newRuleName.trim()) { toast.error('Rule name is required'); return; }
    try {
      const created = await createFirewallRule({ name: newRuleName, priority: newRulePriority, action: newRuleAction });
      toast.success(`Rule "${created.name}" created`);
      setShowAddRule(false);
      setNewRuleName('');
      setNewRulePriority('Medium');
      setNewRuleAction('DROP');
      fetchRules();
    } catch {
      toast.error('Failed to create rule');
    }
  };

  const handleEditRule = async (ruleId: number) => {
    try {
      await updateFirewallRule(ruleId, { name: editRuleName, priority: editRulePriority });
      toast.success('Rule updated');
      setEditingRule(null);
      fetchRules();
    } catch {
      toast.error('Failed to update rule');
    }
  };

  const handleToggleRule = async (ruleId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    try {
      await updateFirewallRule(ruleId, { status: newStatus });
      toast.success(`Rule ${newStatus === 'Active' ? 'enabled' : 'disabled'}`);
      fetchRules();
    } catch {
      toast.error('Failed to update rule status');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Delete this firewall rule? This cannot be undone.')) return;
    try {
      await deleteFirewallRule(ruleId);
      toast.success('Rule deleted');
      fetchRules();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const disabledCount = modules.filter(m => !m.enabled).length;
  const isAllGood = disabledCount === 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#E6EDF3]">Active Defense Systems</h2>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isAllGood ? 'bg-[#3FB950]/10' : 'bg-[#FFA657]/10'}`}>
          <div className={`w-2 h-2 rounded-full ${isAllGood ? 'bg-[#3FB950]' : 'bg-[#FFA657] animate-pulse'}`} />
          <span className={`text-sm ${isAllGood ? 'text-[#3FB950]' : 'text-[#FFA657]'}`}>{systemStatus}</span>
        </div>
      </div>

      {/* ── Defense Modules ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {modules.map((module: any, index: number) => {
          const IconComp = ICON_MAP[module.icon] || Shield;
          return (
            <div key={module.name || index} className={`bg-[#1E232B] rounded-2xl p-6 border ${module.enabled ? 'border-[#30363D]' : 'border-[#FF4D4D]/30'} transition-colors`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${module.enabled ? 'bg-[#1F6FEB]/10' : 'bg-[#FF4D4D]/10'}`}>
                    <IconComp className={`w-5 h-5 ${module.enabled ? 'text-[#58A6FF]' : 'text-[#FF4D4D]'}`} />
                  </div>
                  <div>
                    <h3 className="text-[#E6EDF3]">{module.name}</h3>
                    <p className="text-[#7D8590] text-sm mt-1">{module.description}</p>
                  </div>
                </div>
                <Switch
                  checked={module.enabled}
                  onCheckedChange={() => handleToggleModule(module.name)}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#30363D]">
                <span className="text-[#7D8590] text-sm">Threats Blocked</span>
                <span className={`font-mono ${module.enabled ? 'text-[#E6EDF3]' : 'text-[#7D8590]'}`}>
                  {module.enabled ? (module.blocked_today || 0).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Defense Settings ── */}
      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D] mb-6">
        <h3 className="text-[#E6EDF3] mb-6">Defense Settings</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#E6EDF3]">Threat Sensitivity</div>
                <div className="text-[#7D8590] text-sm">Adjust detection sensitivity level</div>
              </div>
              <Badge variant="outline" className="border-[#58A6FF] text-[#58A6FF]">
                {getSensitivityLabel(settings.sensitivity)}
              </Badge>
            </div>
            <Slider
              value={[settings.sensitivity]}
              max={100}
              step={5}
              className="w-full"
              onValueCommit={handleSensitivityChange}
              onValueChange={(val) => setSettings(s => ({ ...s, sensitivity: val[0] }))}
            />
            <div className="flex justify-between text-xs text-[#7D8590] mt-2">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Maximum</span>
            </div>
          </div>

          <div className="h-px bg-[#30363D]" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#E6EDF3]">Auto-Block Duration</div>
                <div className="text-[#7D8590] text-sm">Default duration for automatic IP blocks</div>
              </div>
              <Badge variant="outline" className="border-[#58A6FF] text-[#58A6FF]">
                {getBlockDurationLabel(settings.block_duration_hours)}
              </Badge>
            </div>
            <Slider
              value={[settings.block_duration_hours]}
              max={168}
              step={1}
              className="w-full"
              onValueCommit={handleBlockDurationChange}
              onValueChange={(val) => setSettings(s => ({ ...s, block_duration_hours: val[0] }))}
            />
            <div className="flex justify-between text-xs text-[#7D8590] mt-2">
              <span>1h</span>
              <span>24h</span>
              <span>72h</span>
              <span>1 week</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Firewall Rules ── */}
      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D] mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#E6EDF3]">Firewall Rules</h3>
          <Button
            className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2"
            onClick={() => setShowAddRule(true)}
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div className="bg-[#0D1117] border border-[#1F6FEB]/40 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[#E6EDF3]">New Firewall Rule</h4>
              <Button variant="ghost" size="sm" className="text-[#7D8590]" onClick={() => setShowAddRule(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-[#7D8590] text-sm block mb-1">Rule Name</label>
                <input
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="e.g. Block Tor Exit Nodes"
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] placeholder:text-[#484F58]"
                />
              </div>
              <div>
                <label className="text-[#7D8590] text-sm block mb-1">Priority</label>
                <select
                  value={newRulePriority}
                  onChange={e => setNewRulePriority(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] cursor-pointer"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[#7D8590] text-sm block mb-1">Action</label>
                <select
                  value={newRuleAction}
                  onChange={e => setNewRuleAction(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-2.5 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#1F6FEB] cursor-pointer"
                >
                  <option value="DROP">DROP</option>
                  <option value="REJECT">REJECT</option>
                  <option value="THROTTLE">THROTTLE</option>
                  <option value="ALERT">ALERT</option>
                  <option value="LOG">LOG</option>
                </select>
              </div>
            </div>
            <Button className="bg-[#3FB950] hover:bg-[#3FB950]/90 gap-2" onClick={handleAddRule}>
              <Save className="w-4 h-4" />
              Create Rule
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#30363D] hover:bg-transparent">
                <TableHead className="text-[#7D8590]">Rule Name</TableHead>
                <TableHead className="text-[#7D8590]">Priority</TableHead>
                <TableHead className="text-[#7D8590]">Action</TableHead>
                <TableHead className="text-[#7D8590]">Status</TableHead>
                <TableHead className="text-[#7D8590]">Hits (24h)</TableHead>
                <TableHead className="text-[#7D8590]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule: any) => (
                <TableRow key={rule.rule_id} className="border-[#30363D] hover:bg-[#161B22]">
                  <TableCell className="text-[#E6EDF3]">
                    {editingRule === rule.rule_id ? (
                      <input
                        value={editRuleName}
                        onChange={e => setEditRuleName(e.target.value)}
                        className="bg-[#161B22] border border-[#1F6FEB] rounded px-2 py-1 text-sm text-[#E6EDF3] w-full focus:outline-none"
                      />
                    ) : rule.name}
                  </TableCell>
                  <TableCell>
                    {editingRule === rule.rule_id ? (
                      <select
                        value={editRulePriority}
                        onChange={e => setEditRulePriority(e.target.value)}
                        className="bg-[#161B22] border border-[#1F6FEB] rounded px-2 py-1 text-sm text-[#E6EDF3] focus:outline-none cursor-pointer"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          rule.priority === 'High' ? 'border-[#FF4D4D] text-[#FF4D4D]' :
                            rule.priority === 'Medium' ? 'border-[#FFA657] text-[#FFA657]' :
                              'border-[#7D8590] text-[#7D8590]'
                        }
                      >
                        {rule.priority}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-[#58A6FF] text-[#58A6FF]">{rule.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleRule(rule.rule_id, rule.status)}>
                      {rule.status === 'Active' ? (
                        <><CheckCircle className="w-4 h-4 text-[#3FB950]" /><span className="text-[#3FB950]">Active</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-[#FF4D4D]" /><span className="text-[#FF4D4D]">Disabled</span></>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#C9D1D9] font-mono">{rule.hits.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingRule === rule.rule_id ? (
                        <>
                          <Button variant="ghost" size="sm" className="text-[#3FB950] hover:text-[#3FB950]/80 gap-1" onClick={() => handleEditRule(rule.rule_id)}>
                            <Save className="w-3 h-3" /> Save
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[#7D8590]" onClick={() => setEditingRule(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost" size="sm"
                            className="text-[#58A6FF] hover:text-[#1F6FEB] gap-1"
                            onClick={() => { setEditingRule(rule.rule_id); setEditRuleName(rule.name); setEditRulePriority(rule.priority); }}
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[#FF4D4D] hover:text-[#FF4D4D]/80 gap-1" onClick={() => handleDeleteRule(rule.rule_id)}>
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Automated Response Actions ── */}
      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#E6EDF3]">Automated Response Actions</h3>
          <Badge variant="outline" className="border-[#3FB950] text-[#3FB950]">
            {liveResponses.length} Recent
          </Badge>
        </div>
        {liveResponses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveResponses.map((response: any, index: number) => (
              <div key={index} className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[#E6EDF3] mb-1">{response.reason || response.trigger}</div>
                    <div className="text-[#7D8590] text-sm">Action: <span className="text-[#FFA657]">{response.action}</span></div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      response.action === 'CRITICAL_BLOCK' ? 'border-[#FF4D4D] text-[#FF4D4D]' :
                        response.action === 'BLOCK_IP' ? 'border-[#FFA657] text-[#FFA657]' :
                          'border-[#D29922] text-[#D29922]'
                    }
                  >
                    {response.action}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#30363D]">
                  <span className="text-[#7D8590] text-sm">Target: {response.target || 'N/A'}</span>
                  <span className="text-[#7D8590] text-xs">{response.timestamp || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#7D8590]">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No automated responses recorded yet.</p>
            <p className="text-xs mt-1">Run the traffic simulator to generate threat detections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
