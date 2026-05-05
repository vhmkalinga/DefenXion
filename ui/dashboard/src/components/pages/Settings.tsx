import { useState, useEffect } from 'react';
import { Shield, Mail, Database, Users, Globe, Lock, Bell, Slack, Clock, CheckCircle, Save, Eye, EyeOff, Server, HardDrive, FileText, Trash2, UserPlus, X, Crown, Key, Loader2, Settings as SI } from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from 'sonner';
import { getAppSettings, updateAppSettings, changePassword, getSystemInfo, listUsers, createUser, deleteUser, adminResetPassword, getMe, setup2FA, verifySetup2FA, disable2FA } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';

export function Settings() {
  const { setDark } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<any>({ organization_name:'DefenXion Security', timezone:'utc', dark_mode:true, reports: { auto_generate: true, frequency: 'weekly' }, notifications:{ critical_alerts:true, email_reports:true, slack_integration:false }, security:{ two_factor_enabled:false, session_timeout_minutes:30, ip_whitelist_enabled:false } });
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [resetUser, setResetUser] = useState<string|null>(null);
  const [adminResetPw, setAdminResetPw] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  
  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorUri, setTwoFactorUri] = useState('');
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [is2FASaving, setIs2FASaving] = useState(false);

  useEffect(() => { getAppSettings().then(d=>{if(d)setSettings(d)}).catch(console.error); getSystemInfo().then(setSystemInfo).catch(console.error); listUsers().then(setTeamUsers).catch(console.error); getMe().then(setProfile).catch(console.error); }, []);

  const updateField = (path: string, value: any) => { setSettings((p: any) => { const k=path.split('.'),u={...p}; let o=u; for(let i=0;i<k.length-1;i++){o[k[i]]={...o[k[i]]};o=o[k[i]]} o[k[k.length-1]]=value; return u; }); setHasChanges(true); };
  const handleSave = async () => { setIsSaving(true); try{await updateAppSettings(settings);setDark(settings.dark_mode);toast.success('Saved!');setHasChanges(false)}catch{toast.error('Failed')}finally{setIsSaving(false)} };
  const handleChangePw = async () => { if(!currentPassword){toast.error('Enter current password');return} if(newPassword.length<8){toast.error('Min 8 chars');return} if(newPassword!==confirmPassword){toast.error('Mismatch');return} setIsChangingPassword(true); try{await changePassword(currentPassword,newPassword);toast.success('Changed!');setCurrentPassword('');setNewPassword('');setConfirmPassword('');setShowPasswordForm(false)}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')}finally{setIsChangingPassword(false)} };
  const handleCreateUser = async () => { if(!newUsername.trim()||!newEmail.trim()||!newUserPassword.trim()){toast.error('All fields required');return} if(newUserPassword.length<8){toast.error('Min 8 chars');return} try{await createUser(newUsername,newEmail,newUserPassword,newUserRole);toast.success(`Created "${newUsername}"`);setShowAddUser(false);setNewUsername('');setNewEmail('');setNewUserPassword('');setNewUserRole('user');listUsers().then(setTeamUsers);getSystemInfo().then(setSystemInfo)}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')} };
  const handleDeleteUser = async (u:string) => { if(!confirm(`Delete "${u}"?`))return; try{await deleteUser(u);toast.success(`Deleted`);listUsers().then(setTeamUsers);getSystemInfo().then(setSystemInfo)}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')} };
  const handleResetPw = async () => { if(!resetUser)return; if(adminResetPw.length<8){toast.error('Min 8 chars');return} setIsResetting(true); try{await adminResetPassword(resetUser,adminResetPw);toast.success(`Reset for ${resetUser}`);setResetUser(null);setAdminResetPw('')}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')}finally{setIsResetting(false)} };

  const handleSetup2FA = async () => {
    try {
      const data = await setup2FA();
      setTwoFactorSecret(data.secret);
      setTwoFactorUri(data.uri);
      setShow2FAModal(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to start 2FA setup');
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorOtp.length !== 6) return;
    setIs2FASaving(true);
    try {
      await verifySetup2FA(twoFactorOtp);
      toast.success('2FA successfully enabled!');
      setProfile((p: any) => ({ ...p, two_factor_enabled: true }));
      setShow2FAModal(false);
      setTwoFactorOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid 2FA code');
    } finally {
      setIs2FASaving(false);
    }
  };

  const handleDisable2FA = async () => {
    setIs2FASaving(true);
    try {
      await disable2FA(disablePassword);
      toast.success('2FA successfully disabled');
      setProfile((p: any) => ({ ...p, two_factor_enabled: false }));
      setShowDisableModal(false);
      setDisablePassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setIs2FASaving(false);
    }
  };

  const C:React.CSSProperties={background:'linear-gradient(135deg,#161B22,#1a1f28)',border:'1px solid #21262D',borderRadius:16};
  const I:React.CSSProperties={width:'100%',background:'rgba(13,17,23,0.8)',border:'1px solid #30363D',borderRadius:8,padding:'8px 12px',color:'#E6EDF3',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'};
  const S:React.CSSProperties={background:'rgba(13,17,23,0.5)',borderRadius:12,padding:'16px 18px',border:'1px solid #21262D'};
  const L:React.CSSProperties={color:'#7D8590',fontSize:12,marginBottom:6,display:'block'};
  const pill=(c:string):React.CSSProperties=>({padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,color:c,background:`${c}10`,border:`1px solid ${c}33`,display:'flex',alignItems:'center',gap:4});

  const hasSMTP = Boolean(settings.smtp?.host && settings.smtp?.username && settings.smtp?.password);

  return (<>
    <style>{`@keyframes sf{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes ss{to{transform:rotate(360deg)}}.sr{animation:sf .35s ease both}.sr:nth-child(2){animation-delay:.06s}.sr:nth-child(3){animation-delay:.12s}`}</style>
    <div style={{padding:'28px 32px',maxWidth:1440,margin:'0 auto'}}>

    {/* Header */}
    <div className="sr" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#58A6FF,#1F6FEB)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 20px rgba(31,111,235,0.3)'}}><SI size={22} color="white"/></div>
        <div><h1 style={{color:'#E6EDF3',fontSize:22,fontWeight:700,letterSpacing:'-0.02em',margin:0}}>Settings</h1><p style={{color:'#7D8590',fontSize:13,marginTop:3}}>Configuration & team management</p></div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {hasChanges&&<span style={{...pill('#FFA657'),animation:'sf .3s ease'}}>Unsaved</span>}
        <button disabled={isSaving||!hasChanges} onClick={handleSave} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:'none',cursor:(isSaving||!hasChanges)?'not-allowed':'pointer',opacity:(isSaving||!hasChanges)?0.4:1,background:'linear-gradient(135deg,#1F6FEB,#2679f5)',color:'white',fontSize:13,fontWeight:600,fontFamily:'inherit',boxShadow:'0 4px 16px rgba(31,111,235,0.3)'}}>
          {isSaving?<Loader2 size={15} style={{animation:'ss .8s linear infinite'}}/>:<Save size={15}/>} {isSaving?'Saving…':'Save'}
        </button>
      </div>
    </div>

    {/* Tabs */}
    <div className="sr" style={{display:'flex',gap:4,marginBottom:20,background:'rgba(22,27,34,0.6)',borderRadius:10,padding:3,width:'fit-content'}}>
      {['general','notifications','security','integrations'].map(t=>(
        <button key={t} onClick={()=>setActiveTab(t)} style={{padding:'8px 18px',borderRadius:8,border:'none',fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer',textTransform:'capitalize',transition:'all .2s',background:activeTab===t?'linear-gradient(135deg,#1F6FEB,#2679f5)':'transparent',color:activeTab===t?'white':'#7D8590',boxShadow:activeTab===t?'0 2px 8px rgba(31,111,235,0.3)':'none'}}>{t}</button>
      ))}
    </div>

    {/* General */}
    {activeTab==='general'&&<div className="sr" style={{...C,padding:'20px 24px'}}><div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={S}><div style={L}>Organization Name</div><input value={settings.organization_name} onChange={e=>updateField('organization_name',e.target.value)} style={I}/></div>
      <div style={S}><div style={L}>Time Zone</div><div style={{display:'flex',alignItems:'center',gap:8}}><Globe size={14} color="#7D8590"/><select value={settings.timezone} onChange={e=>updateField('timezone',e.target.value)} style={{...I,cursor:'pointer',width:260}}>{[['utc','UTC'],['est','Eastern'],['cst','Central'],['mst','Mountain'],['pst','Pacific'],['gmt','GMT'],['cet','CET'],['ist','IST'],['jst','JST'],['aest','AEST']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div>
      <div style={{...S,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>Dark Mode</div><div style={{color:'#7D8590',fontSize:12,marginTop:2}}>Use dark theme</div></div><Switch checked={settings.dark_mode} onCheckedChange={v=>{updateField('dark_mode',v);setDark(v)}}/></div>
      <div style={S}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>Auto-Generate Reports</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>Automatically generate and save security reports</div></div>
          <Switch checked={settings.reports?.auto_generate !== false} onCheckedChange={v=>updateField('reports.auto_generate',v)}/>
        </div>
        {settings.reports?.auto_generate !== false && (
          <div style={{marginTop:12,paddingLeft:2}}>
            <div style={L}>Generation Frequency</div>
            <select value={settings.reports?.frequency || 'weekly'} onChange={e=>updateField('reports.frequency',e.target.value)} style={{...I, cursor:'pointer', width: 200}}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="all">All</option>
            </select>
          </div>
        )}
      </div>
    </div></div>}

    {/* Notifications */}
    {activeTab==='notifications'&&<div className="sr" style={{...C,padding:'20px 24px'}}><div style={{display:'flex',flexDirection:'column',gap:14}}>
      {[{icon:Shield,color:'#FF4D4D',title:'Critical Alerts',desc:'Instant push for high-risk threats',field:'notifications.critical_alerts',val:settings.notifications?.critical_alerts},
        {icon:Mail,color:'#58A6FF',title:'Email Reports',desc:'Periodic security summaries',field:'notifications.email_reports',val:settings.notifications?.email_reports},
        {icon:Slack,color:'#BC8CFF',title:'Slack Notifications',desc:'Send alerts to Slack',field:'notifications.slack_integration',val:settings.notifications?.slack_integration},
      ].map((n,i)=><div key={i} style={S}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><n.icon size={16} color={n.color}/><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>{n.title}</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>{n.desc}</div></div></div>
          <Switch checked={n.val} onCheckedChange={v => {
            if (v && (n.field === 'notifications.critical_alerts' || n.field === 'notifications.email_reports') && !hasSMTP) {
              toast.error('Please configure SMTP Server in Integrations first');
              return;
            }
            updateField(n.field, v);
          }}/>
        </div>
        {n.field==='notifications.email_reports'&&(settings.notifications?.email_reports||settings.notifications?.critical_alerts)&&<div style={{marginTop:12,paddingLeft:26}}>
          <div style={L}>Email Address</div>
          <input placeholder="admin@defenxion.com" value={settings.notifications?.email_address||''} onChange={e=>updateField('notifications.email_address',e.target.value)} style={{...I, marginBottom: settings.notifications?.email_reports ? 12 : 0}}/>
          {settings.notifications?.email_reports && (
            <>
              <div style={L}>Report Frequency</div>
              <select value={settings.notifications?.email_report_frequency || 'weekly'} onChange={e=>updateField('notifications.email_report_frequency',e.target.value)} style={{...I, cursor:'pointer', width: 200}}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="all">All</option>
              </select>
            </>
          )}
        </div>}
        {n.field==='notifications.slack_integration'&&settings.notifications?.slack_integration&&<div style={{marginTop:12,paddingLeft:26}}><div style={L}>Webhook URL</div><input placeholder="https://hooks.slack.com/..." value={settings.notifications?.slack_webhook_url||''} onChange={e=>updateField('notifications.slack_webhook_url',e.target.value)} style={I}/></div>}
      </div>)}
    </div></div>}

    {/* Security */}
    {activeTab==='security'&&<div className="sr" style={{...C,padding:'20px 24px'}}><div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={S}><div style={L}>Session Timeout</div><div style={{display:'flex',alignItems:'center',gap:8}}><Clock size={14} color="#7D8590"/><select value={String(settings.security?.session_timeout_minutes||30)} onChange={e=>updateField('security.session_timeout_minutes',parseInt(e.target.value))} style={{...I,cursor:'pointer',width:200}}>{[['15','15 min'],['30','30 min'],['60','1 hour'],['120','2 hours'],['480','8 hours']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div>
      <div style={S}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>IP Whitelist</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>Only allow access from specific IPs</div></div>
          <Switch checked={settings.security?.ip_whitelist_enabled} onCheckedChange={v=>updateField('security.ip_whitelist_enabled',v)}/>
        </div>
        {settings.security?.ip_whitelist_enabled && (
          <div style={{marginTop:12,paddingLeft:2}}>
            <div style={L}>Allowed IP Addresses (one per line)</div>
            <textarea 
              value={(settings.security?.ip_whitelist || []).join('\n')} 
              onChange={e=>updateField('security.ip_whitelist', e.target.value.split('\n').map(s=>s.trim()).filter(s=>s))} 
              placeholder="127.0.0.1&#10;192.168.1.100" 
              style={{...I, minHeight:80, resize:'vertical'}}
            />
            <div style={{color:'#FF4D4D',fontSize:11,marginTop:4,fontWeight:600}}>
              Warning: Ensure your current IP is listed to avoid locking yourself out! Localhost (127.0.0.1) is recommended.
            </div>
          </div>
        )}
      </div>
      
      <div style={{...S,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>Two-Factor Authentication (2FA)</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>{profile?.two_factor_enabled ? 'Currently enabled' : 'Not configured'}</div></div>
        {profile?.two_factor_enabled ? (
          <button onClick={() => setShowDisableModal(true)} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid rgba(255,77,77,0.3)', background:'rgba(255,77,77,0.1)', color:'#FF4D4D', fontSize:12, fontWeight:600, cursor:'pointer' }}>Disable</button>
        ) : (
          <button onClick={handleSetup2FA} style={{ padding:'6px 12px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#3FB950,#2ea043)', color:'white', fontSize:12, fontWeight:600, cursor:'pointer' }}>Enable 2FA</button>
        )}
      </div>

      <div style={S}>
        <button onClick={()=>setShowPasswordForm(!showPasswordForm)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid #30363D',color:'#E6EDF3',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}><Lock size={14}/> Change Password</button>
        {showPasswordForm&&<div style={{marginTop:14,background:'rgba(13,17,23,0.5)',borderRadius:10,padding:16,border:'1px solid #21262D',maxWidth:400,display:'flex',flexDirection:'column',gap:12}}>
          <div><div style={L}>Current Password</div><div style={{position:'relative'}}><input type={showCurrentPw?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} style={I}/><button onClick={()=>setShowCurrentPw(!showCurrentPw)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#7D8590',cursor:'pointer'}}>{showCurrentPw?<EyeOff size={14}/>:<Eye size={14}/>}</button></div></div>
          <div><div style={L}>New Password</div><div style={{position:'relative'}}><input type={showNewPw?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={I}/><button onClick={()=>setShowNewPw(!showNewPw)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#7D8590',cursor:'pointer'}}>{showNewPw?<EyeOff size={14}/>:<Eye size={14}/>}</button></div>{newPassword&&newPassword.length<8&&<div style={{color:'#FF4D4D',fontSize:11,marginTop:4}}>Min 8 chars</div>}</div>
          <div><div style={L}>Confirm</div><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={I}/>{confirmPassword&&newPassword!==confirmPassword&&<div style={{color:'#FF4D4D',fontSize:11,marginTop:4}}>Mismatch</div>}</div>
          <button disabled={isChangingPassword||newPassword.length<8||newPassword!==confirmPassword} onClick={handleChangePw} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#3FB950,#2ea043)',color:'white',fontSize:12,fontWeight:600,fontFamily:'inherit',opacity:(newPassword.length<8||newPassword!==confirmPassword)?0.4:1}}><CheckCircle size={13}/> {isChangingPassword?'Changing…':'Update'}</button>
        </div>}
      </div>
    </div></div>}

    {/* Integrations */}
    {activeTab==='integrations'&&<div className="sr" style={{...C,padding:'20px 24px'}}><div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* MongoDB */}
      <div style={S}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{display:'flex',alignItems:'center',gap:10}}><Database size={16} color="#3FB950"/><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>MongoDB</div><div style={{color:'#7D8590',fontSize:12}}>Primary database</div></div></div><span style={pill('#3FB950')}><CheckCircle size={10}/> Connected</span></div>
        {systemInfo&&<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[{l:'Collections',v:systemInfo.database?.collections,ic:HardDrive},{l:'Detections',v:systemInfo.database?.detections,ic:Shield},{l:'Users',v:systemInfo.database?.users,ic:Users},{l:'Logs',v:systemInfo.database?.logs,ic:FileText}].map((s,i)=><div key={i} style={{background:'rgba(13,17,23,0.5)',borderRadius:8,padding:'10px 12px',border:'1px solid #21262D'}}><div style={{display:'flex',alignItems:'center',gap:4,color:'#7D8590',fontSize:10,marginBottom:4}}><s.ic size={11}/>{s.l}</div><div style={{color:'#E6EDF3',fontFamily:'monospace',fontSize:16,fontWeight:700}}>{(s.v||0).toLocaleString()}</div></div>)}</div>}
      </div>
      {/* API */}
      <div style={{...S,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Server size={16} color="#58A6FF"/><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>API Server</div><div style={{color:'#7D8590',fontSize:12}}>{systemInfo?`${systemInfo.server?.framework} v${systemInfo.server?.version}`:'Loading…'}</div></div></div><span style={pill('#3FB950')}><CheckCircle size={10}/> Active</span></div>
      {/* SMTP */}
      <div style={S}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><Mail size={16} color="#7D8590"/><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>SMTP Server</div><div style={{color:'#7D8590',fontSize:12}}>Outbound email</div></div></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><div style={L}>Host</div><input value={settings.smtp?.host||''} onChange={e=>updateField('smtp.host',e.target.value)} placeholder="smtp.gmail.com" style={I}/></div>
          <div><div style={L}>Port</div><input value={settings.smtp?.port||''} onChange={e=>updateField('smtp.port',parseInt(e.target.value)||587)} placeholder="587" style={I}/></div>
          <div><div style={L}>Username</div><input value={settings.smtp?.username||''} onChange={e=>updateField('smtp.username',e.target.value)} placeholder="admin@example.com" style={I}/></div>
          <div><div style={L}>Password</div><input type="password" value={settings.smtp?.password||''} onChange={e=>updateField('smtp.password',e.target.value)} placeholder="••••••••" style={I}/></div>
        </div>
      </div>
      {/* Team */}
      <div style={S}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{display:'flex',alignItems:'center',gap:10}}><Users size={16} color="#FFA657"/><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>Team</div><div style={{color:'#7D8590',fontSize:12}}>{teamUsers.length} users</div></div></div><button onClick={()=>setShowAddUser(!showAddUser)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,background:'linear-gradient(135deg,#1F6FEB,#2679f5)',border:'none',color:'white',fontSize:11,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}><UserPlus size={12}/> Add</button></div>
        {showAddUser&&<div style={{background:'rgba(13,17,23,0.5)',border:'1px solid rgba(31,111,235,0.2)',borderRadius:10,padding:16,marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><div style={{color:'#E6EDF3',fontSize:13,fontWeight:600}}>Create User</div><button onClick={()=>setShowAddUser(false)} style={{background:'none',border:'none',color:'#7D8590',cursor:'pointer'}}><X size={14}/></button></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><div style={L}>Username</div><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="john" style={I}/></div>
            <div><div style={L}>Email</div><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="john@ex.com" style={I}/></div>
            <div><div style={L}>Password</div><input type="password" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} placeholder="Min 8" style={I}/></div>
            <div><div style={L}>Role</div><select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} style={{...I,cursor:'pointer'}}><option value="user">User</option><option value="admin">Admin</option></select></div>
          </div>
          <button onClick={handleCreateUser} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,background:'linear-gradient(135deg,#3FB950,#2ea043)',border:'none',color:'white',fontSize:11,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}><CheckCircle size={12}/> Create</button>
        </div>}
        <div style={{display:'flex',flexDirection:'column',gap:6}}>{teamUsers.map((u:any)=>{const a=u.role==='admin';const ac=a?'#FFA657':'#58A6FF';return(
          <div key={u.username} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(13,17,23,0.5)',borderRadius:10,padding:'10px 14px',border:'1px solid #21262D'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:32,height:32,borderRadius:'50%',background:`${ac}18`,color:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>{u.username?.charAt(0).toUpperCase()}</div><div><div style={{display:'flex',alignItems:'center',gap:5,color:'#E6EDF3',fontSize:13}}>{u.username}{a&&<Crown size={12} color="#FFA657"/>}</div><div style={{color:'#7D8590',fontSize:11}}>{u.email}</div></div></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={pill(ac)}>{u.role}</span>{u.account_locked&&<span style={pill('#FF4D4D')}>Locked</span>}<button onClick={()=>setResetUser(u.username)} style={{padding:5,borderRadius:6,background:'rgba(88,166,255,0.1)',border:'none',color:'#58A6FF',cursor:'pointer'}}><Key size={13}/></button><button onClick={()=>handleDeleteUser(u.username)} style={{padding:5,borderRadius:6,background:'rgba(255,77,77,0.08)',border:'none',color:'#FF4D4D',cursor:'pointer'}}><Trash2 size={13}/></button></div>
          </div>);})}</div>
      </div>
    </div></div>}

    {/* Reset Modal */}
    {resetUser&&<div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={()=>{setResetUser(null);setAdminResetPw('')}}>
      <div onClick={e=>e.stopPropagation()} style={{...C,padding:'24px 28px',width:400}}>
        <div style={{color:'#E6EDF3',fontSize:16,fontWeight:700,marginBottom:6}}>Reset Password</div>
        <div style={{color:'#7D8590',fontSize:12,marginBottom:16}}>New password for <span style={{color:'#E6EDF3',fontWeight:600}}>{resetUser}</span></div>
        <div style={L}>New Password</div>
        <input type="password" value={adminResetPw} onChange={e=>setAdminResetPw(e.target.value)} placeholder="Min 8 characters" style={{...I,marginBottom:14}}/>
        <button disabled={isResetting} onClick={handleResetPw} style={{width:'100%',padding:'9px 0',borderRadius:8,border:'none',background:'linear-gradient(135deg,#1F6FEB,#2679f5)',color:'white',fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:isResetting?'not-allowed':'pointer'}}>{isResetting?'Resetting…':'Confirm Reset'}</button>
      </div>
    </div>}

    {/* 2FA Setup Modal */}
    {show2FAModal && (
      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} onClick={()=>{setShow2FAModal(false);setTwoFactorOtp('');}}>
        <div onClick={e=>e.stopPropagation()} style={{ ...C, padding:'24px 28px', width:400 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ color:'#E6EDF3', fontSize:16, fontWeight:700 }}>Enable Two-Factor Auth</div>
            <button onClick={()=>{setShow2FAModal(false);setTwoFactorOtp('');}} style={{ background:'none', border:'none', color:'#7D8590', cursor:'pointer' }}><X size={16}/></button>
          </div>
          <div style={{ color:'#7D8590', fontSize:13, marginBottom:20 }}>
            1. Scan this QR code with an authenticator app (like Google Authenticator or Authy).
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16, background:'white', padding:16, borderRadius:12, width:'fit-content', margin:'0 auto 16px' }}>
            <QRCodeSVG value={twoFactorUri} size={150} />
          </div>
          <div style={{ color:'#7D8590', fontSize:13, marginBottom:20, textAlign:'center' }}>
            Secret Key: <span style={{ color:'#E6EDF3', fontFamily:'monospace', fontWeight:600 }}>{twoFactorSecret}</span>
          </div>
          <div style={{ color:'#7D8590', fontSize:13, marginBottom:10 }}>
            2. Enter the 6-digit code generated by the app.
          </div>
          <input 
            type="text" 
            maxLength={6}
            value={twoFactorOtp} 
            onChange={e=>setTwoFactorOtp(e.target.value.replace(/[^0-9]/g, ''))} 
            placeholder="000000" 
            style={{ ...I, textAlign:'center', fontSize:20, letterSpacing:'0.2em', marginBottom:20 }}
          />
          <button 
            disabled={twoFactorOtp.length !== 6 || is2FASaving} 
            onClick={handleVerify2FA} 
            style={{ width:'100%', padding:'10px 0', borderRadius:8, border:'none', background:twoFactorOtp.length === 6 ? 'linear-gradient(135deg,#3FB950,#2ea043)' : 'rgba(63,185,80,0.3)', color:'white', fontSize:13, fontWeight:600, cursor:twoFactorOtp.length === 6 ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            {is2FASaving ? <Loader2 size={16} style={{ animation:'ss .8s linear infinite' }} /> : <CheckCircle size={16}/>}
            Verify & Enable
          </button>
        </div>
      </div>
    )}

    {/* 2FA Disable Modal */}
    {showDisableModal && (
      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} onClick={()=>{setShowDisableModal(false);setDisablePassword('');}}>
        <div onClick={e=>e.stopPropagation()} style={{ ...C, padding:'24px 28px', width:400 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ color:'#E6EDF3', fontSize:16, fontWeight:700 }}>Disable Two-Factor Auth</div>
            <button onClick={()=>{setShowDisableModal(false);setDisablePassword('');}} style={{ background:'none', border:'none', color:'#7D8590', cursor:'pointer' }}><X size={16}/></button>
          </div>
          <div style={{ color:'#7D8590', fontSize:13, marginBottom:20 }}>
            Are you sure you want to disable two-factor authentication? Your account will be less secure. Please enter your password to confirm.
          </div>
          <div style={L}>Account Password</div>
          <input 
            type="password" 
            value={disablePassword} 
            onChange={e=>setDisablePassword(e.target.value)} 
            placeholder="Enter password" 
            style={{ ...I, marginBottom:20 }}
          />
          <button 
            disabled={!disablePassword || is2FASaving} 
            onClick={handleDisable2FA} 
            style={{ width:'100%', padding:'10px 0', borderRadius:8, border:'none', background:disablePassword ? 'linear-gradient(135deg,#FF4D4D,#d73a49)' : 'rgba(255,77,77,0.3)', color:'white', fontSize:13, fontWeight:600, cursor:disablePassword ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            {is2FASaving ? <Loader2 size={16} style={{ animation:'ss .8s linear infinite' }} /> : <Lock size={16}/>}
            Disable 2FA
          </button>
        </div>
      </div>
    )}

    </div>
  </>);
}
