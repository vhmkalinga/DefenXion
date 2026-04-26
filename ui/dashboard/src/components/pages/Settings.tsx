import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Mail, Database, Users, Globe, Lock, Bell, Slack,
  Clock, CheckCircle, Save, Eye, EyeOff, Server, HardDrive,
  FileText, AlertTriangle, Plus, Trash2, UserPlus, X, Crown
} from "lucide-react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { toast } from 'sonner';
import {
  getAppSettings, updateAppSettings, changePassword, getSystemInfo,
  listUsers, createUser, deleteUser
} from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const { isDark, setDark } = useTheme();

  // ── State ──
  const [settings, setSettings] = useState<any>({
    organization_name: 'DefenXion Security',
    timezone: 'utc',
    dark_mode: true,
    notifications: {
      critical_alerts: true,
      email_reports: true,
      weekly_digest: true,
      slack_integration: false,
    },
    security: {
      two_factor_enabled: false,
      session_timeout_minutes: 30,
      ip_whitelist_enabled: false,
    },
  });
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Team management
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  // ── Fetch ──
  useEffect(() => {
    getAppSettings().then(data => {
      if (data) setSettings(data);
    }).catch(console.error);

    getSystemInfo().then(setSystemInfo).catch(console.error);

    listUsers().then(setTeamUsers).catch(console.error);
  }, []);

  // ── Helpers ──
  const updateField = (path: string, value: any) => {
    setSettings((prev: any) => {
      const keys = path.split('.');
      const updated = { ...prev };
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAppSettings(settings);
      // Sync theme with saved settings
      setDark(settings.dark_mode);
      toast.success('Settings saved successfully!');
      setHasChanges(false);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error('Enter your current password'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newUserPassword.trim()) {
      toast.error('All fields are required'); return;
    }
    if (newUserPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    try {
      await createUser(newUsername, newEmail, newUserPassword, newUserRole);
      toast.success(`User "${newUsername}" created!`);
      setShowAddUser(false);
      setNewUsername(''); setNewEmail(''); setNewUserPassword(''); setNewUserRole('user');
      listUsers().then(setTeamUsers).catch(console.error);
      getSystemInfo().then(setSystemInfo).catch(console.error);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(username);
      toast.success(`User "${username}" deleted`);
      listUsers().then(setTeamUsers).catch(console.error);
      getSystemInfo().then(setSystemInfo).catch(console.error);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete user');
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto" style={{ color: 'var(--dx-text-primary)' }}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--dx-text-primary)' }}>Settings</h2>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="border-[#FFA657] text-[#FFA657] animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button
            className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2"
            disabled={isSaving || !hasChanges}
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList style={{ backgroundColor: 'var(--dx-bg-card)', border: '1px solid var(--dx-border)' }}>
          <TabsTrigger value="general" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">General</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">Security</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">Integrations</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general">
          <div className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: 'var(--dx-bg-card)', border: '1px solid var(--dx-border)' }}>
            <div>
              <label className="text-sm mb-2 block" style={{ color: 'var(--dx-text-secondary)' }}>Organization Name</label>
              <Input
                value={settings.organization_name}
                onChange={e => updateField('organization_name', e.target.value)}
                style={{ backgroundColor: 'var(--dx-bg-input)', borderColor: 'var(--dx-border)', color: 'var(--dx-text-primary)' }}
              />
            </div>

            <div>
              <label className="text-sm mb-2 block" style={{ color: 'var(--dx-text-secondary)' }}>Time Zone</label>
              <Select value={settings.timezone} onValueChange={v => updateField('timezone', v)}>
                <SelectTrigger className="flex items-center gap-2" style={{ backgroundColor: 'var(--dx-bg-input)', borderColor: 'var(--dx-border)', color: 'var(--dx-text-primary)' }}>
                  <Globe className="w-4 h-4" />
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--dx-bg-secondary)', borderColor: 'var(--dx-border)' }}>
                  <SelectItem value="utc" style={{ color: 'var(--dx-text-primary)' }}>UTC (GMT+0)</SelectItem>
                  <SelectItem value="est" style={{ color: 'var(--dx-text-primary)' }}>Eastern Time (GMT-5)</SelectItem>
                  <SelectItem value="cst" style={{ color: 'var(--dx-text-primary)' }}>Central Time (GMT-6)</SelectItem>
                  <SelectItem value="mst" style={{ color: 'var(--dx-text-primary)' }}>Mountain Time (GMT-7)</SelectItem>
                  <SelectItem value="pst" style={{ color: 'var(--dx-text-primary)' }}>Pacific Time (GMT-8)</SelectItem>
                  <SelectItem value="gmt" style={{ color: 'var(--dx-text-primary)' }}>GMT (London)</SelectItem>
                  <SelectItem value="cet" style={{ color: 'var(--dx-text-primary)' }}>CET (Berlin, Paris)</SelectItem>
                  <SelectItem value="ist" style={{ color: 'var(--dx-text-primary)' }}>IST (India, GMT+5:30)</SelectItem>
                  <SelectItem value="jst" style={{ color: 'var(--dx-text-primary)' }}>JST (Tokyo, GMT+9)</SelectItem>
                  <SelectItem value="aest" style={{ color: 'var(--dx-text-primary)' }}>AEST (Sydney, GMT+10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator style={{ background: 'var(--dx-border)' }} />

            <div className="flex justify-between items-center">
              <div>
                <div style={{ color: 'var(--dx-text-primary)' }}>Dark Mode</div>
                <div className="text-sm" style={{ color: 'var(--dx-text-muted)' }}>Use dark theme across the application</div>
              </div>
              <Switch
                checked={settings.dark_mode}
                onCheckedChange={v => {
                  updateField('dark_mode', v);
                  setDark(v);
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications">
          <div className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: 'var(--dx-bg-card)', border: '1px solid var(--dx-border)' }}>
            {[
              { key: 'notifications.critical_alerts', icon: Shield, iconColor: 'text-red-500', title: 'Critical Threat Alerts', desc: 'Instant push notifications for high-risk threats' },
              { key: 'notifications.email_reports', icon: Mail, iconColor: 'text-blue-400', title: 'Email Reports', desc: 'Periodic security summary emails' },
              { key: 'notifications.weekly_digest', icon: Bell, iconColor: 'text-yellow-400', title: 'Weekly Digest', desc: 'Comprehensive weekly security digest' },
              { key: 'notifications.slack_integration', icon: Slack, iconColor: 'text-purple-400', title: 'Slack Notifications', desc: 'Send alerts to a Slack channel' },
            ].map((item, i) => (
              <div key={item.key}>
                {i > 0 && <Separator style={{ background: 'var(--dx-border)' }} className="mb-6" />}
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    <div>
                      <div style={{ color: 'var(--dx-text-primary)' }}>{item.title}</div>
                      <div className="text-sm" style={{ color: 'var(--dx-text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                  <Switch
                    checked={item.key.split('.').reduce((o: any, k) => o?.[k], settings)}
                    onCheckedChange={v => updateField(item.key, v)}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security">
          <div className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: 'var(--dx-bg-card)', border: '1px solid var(--dx-border)' }}>
            {/* 2FA */}
            <div className="flex justify-between items-center">
              <div>
                <div style={{ color: 'var(--dx-text-primary)' }}>Two-Factor Authentication</div>
                <div className="text-sm" style={{ color: 'var(--dx-text-muted)' }}>Extra layer of security for your account</div>
              </div>
              <Switch
                checked={settings.security?.two_factor_enabled}
                onCheckedChange={v => updateField('security.two_factor_enabled', v)}
              />
            </div>

            <Separator style={{ background: 'var(--dx-border)' }} />

            {/* Session Timeout */}
            <div>
              <label className="text-sm mb-2 block" style={{ color: 'var(--dx-text-secondary)' }}>Session Timeout</label>
              <Select
                value={String(settings.security?.session_timeout_minutes || 30)}
                onValueChange={v => updateField('security.session_timeout_minutes', parseInt(v))}
              >
                <SelectTrigger className="w-[240px]" style={{ backgroundColor: 'var(--dx-bg-input)', borderColor: 'var(--dx-border)', color: 'var(--dx-text-primary)' }}>
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--dx-bg-secondary)', borderColor: 'var(--dx-border)' }}>
                  <SelectItem value="15" style={{ color: 'var(--dx-text-primary)' }}>15 minutes</SelectItem>
                  <SelectItem value="30" style={{ color: 'var(--dx-text-primary)' }}>30 minutes</SelectItem>
                  <SelectItem value="60" style={{ color: 'var(--dx-text-primary)' }}>1 hour</SelectItem>
                  <SelectItem value="120" style={{ color: 'var(--dx-text-primary)' }}>2 hours</SelectItem>
                  <SelectItem value="480" style={{ color: 'var(--dx-text-primary)' }}>8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator style={{ background: 'var(--dx-border)' }} />

            {/* IP Whitelist */}
            <div className="flex justify-between items-center">
              <div>
                <div style={{ color: 'var(--dx-text-primary)' }}>IP Whitelist</div>
                <div className="text-sm" style={{ color: 'var(--dx-text-muted)' }}>Only allow access from whitelisted IPs</div>
              </div>
              <Switch
                checked={settings.security?.ip_whitelist_enabled}
                onCheckedChange={v => updateField('security.ip_whitelist_enabled', v)}
              />
            </div>

            <Separator style={{ background: 'var(--dx-border)' }} />

            {/* Change Password */}
            <div>
              <Button
                variant="outline"
                className="gap-2" style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-text-primary)' }}
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>

              {showPasswordForm && (
                <div className="mt-4 rounded-xl p-5 space-y-4 max-w-md" style={{ backgroundColor: 'var(--dx-bg-input)', border: '1px solid var(--dx-border)' }}>
                  <div>
                    <label className="text-sm block mb-1" style={{ color: 'var(--dx-text-muted)' }}>Current Password</label>
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ backgroundColor: 'var(--dx-bg-secondary)', borderColor: 'var(--dx-border)', color: 'var(--dx-text-primary)' }}
                        className="pr-10"
                        placeholder="Enter current password"
                      />
                      <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dx-text-muted)' }}>
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm block mb-1" style={{ color: 'var(--dx-text-muted)' }}>New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ backgroundColor: 'var(--dx-bg-secondary)', borderColor: 'var(--dx-border)', color: 'var(--dx-text-primary)' }}
                        className="pr-10"
                        placeholder="Min 8 characters"
                      />
                      <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8590]">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 8 && (
                      <p className="text-[#FF4D4D] text-xs mt-1">Password must be at least 8 characters</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#7D8590] text-sm block mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                      placeholder="Re-enter new password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[#FF4D4D] text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                  <Button
                    className="bg-[#3FB950] hover:bg-[#3FB950]/90 gap-2"
                    disabled={isChangingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    onClick={handleChangePassword}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isChangingPassword ? 'Changing...' : 'Update Password'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Integrations ── */}
        <TabsContent value="integrations">
          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D] space-y-6">
            {/* MongoDB Status */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3 items-center">
                  <Database className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-[#E6EDF3]">MongoDB Integration</div>
                    <div className="text-[#7D8590] text-sm">Primary database connection</div>
                  </div>
                </div>
                <Badge variant="outline" className="border-[#3FB950] text-[#3FB950] gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </Badge>
              </div>
              {systemInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Collections', value: systemInfo.database?.collections, icon: HardDrive },
                    { label: 'Detections', value: systemInfo.database?.detections, icon: Shield },
                    { label: 'Users', value: systemInfo.database?.users, icon: Users },
                    { label: 'Log Entries', value: systemInfo.database?.logs, icon: FileText },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                      <div className="flex items-center gap-2 text-[#7D8590] text-xs mb-1">
                        <s.icon className="w-3 h-3" />
                        {s.label}
                      </div>
                      <div className="text-[#E6EDF3] font-mono text-lg">{(s.value || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-[#30363D]" />

            {/* Server Info */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <Server className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-[#E6EDF3]">API Server</div>
                  <div className="text-[#7D8590] text-sm">
                    {systemInfo ? `${systemInfo.server?.framework} v${systemInfo.server?.version}` : 'Loading...'}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-[#3FB950] text-[#3FB950] gap-1">
                <CheckCircle className="w-3 h-3" /> Active
              </Badge>
            </div>

            <Separator className="bg-[#30363D]" />

            {/* Team Management */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3 items-center">
                  <Users className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-[#E6EDF3]">Team Management</div>
                    <div className="text-[#7D8590] text-sm">{teamUsers.length} registered user(s)</div>
                  </div>
                </div>
                <Button className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2" onClick={() => setShowAddUser(!showAddUser)}>
                  <UserPlus className="w-4 h-4" /> Add User
                </Button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <div className="bg-[#0D1117] border border-[#1F6FEB]/40 rounded-xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[#E6EDF3]">Create New User</h4>
                    <Button variant="ghost" size="sm" className="text-[#7D8590]" onClick={() => setShowAddUser(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[#7D8590] text-sm block mb-1">Username</label>
                      <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. john_doe" className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]" />
                    </div>
                    <div>
                      <label className="text-[#7D8590] text-sm block mb-1">Email</label>
                      <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="john@example.com" className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]" />
                    </div>
                    <div>
                      <label className="text-[#7D8590] text-sm block mb-1">Password</label>
                      <Input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Min 8 characters" className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]" />
                    </div>
                    <div>
                      <label className="text-[#7D8590] text-sm block mb-1">Role</label>
                      <Select value={newUserRole} onValueChange={setNewUserRole}>
                        <SelectTrigger className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#161B22] border-[#30363D]">
                          <SelectItem value="user" className="text-[#E6EDF3]">User</SelectItem>
                          <SelectItem value="admin" className="text-[#E6EDF3]">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="bg-[#3FB950] hover:bg-[#3FB950]/90 gap-2" onClick={handleCreateUser}>
                    <CheckCircle className="w-4 h-4" /> Create User
                  </Button>
                </div>
              )}

              {/* User List */}
              <div className="space-y-2">
                {teamUsers.map((user: any) => (
                  <div key={user.username} className="flex items-center justify-between bg-[#0D1117] rounded-lg px-4 py-3 border border-[#30363D]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${user.role === 'admin' ? 'bg-[#FFA657]/20 text-[#FFA657]' : 'bg-[#58A6FF]/20 text-[#58A6FF]'
                        }`}>
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#E6EDF3]">{user.username}</span>
                          {user.role === 'admin' && <Crown className="w-3 h-3 text-[#FFA657]" />}
                        </div>
                        <span className="text-[#7D8590] text-sm">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={
                        user.role === 'admin' ? 'border-[#FFA657] text-[#FFA657]' : 'border-[#58A6FF] text-[#58A6FF]'
                      }>
                        {user.role}
                      </Badge>
                      {user.account_locked && (
                        <Badge variant="outline" className="border-[#FF4D4D] text-[#FF4D4D]">Locked</Badge>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        className="text-[#FF4D4D] hover:text-[#FF4D4D]/80 gap-1"
                        onClick={() => handleDeleteUser(user.username)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-10 flex justify-between">
        <Button
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-500/10"
          onClick={onLogout}
        >
          Logout
        </Button>
        <Button
          className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2"
          disabled={isSaving || !hasChanges}
          onClick={handleSave}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
