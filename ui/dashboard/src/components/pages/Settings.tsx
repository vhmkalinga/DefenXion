import { useState, useEffect } from 'react';
import { Shield, Mail, Database, Users, Globe, Lock, Bell, Slack, Clock, CheckCircle, Save, Eye, EyeOff, Server, HardDrive, FileText, Trash2, UserPlus, X, Crown, Key, Loader2, Settings as SI } from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from 'sonner';
import { getAppSettings, updateAppSettings, changePassword, getSystemInfo, listUsers, createUser, deleteUser, adminResetPassword } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export function Settings() {
  const { setDark } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<any>({ organization_name:'DefenXion Security', timezone:'utc', dark_mode:true, notifications:{ critical_alerts:true, email_reports:true, weekly_digest:true, slack_integration:false }, security:{ two_factor_enabled:false, session_timeout_minutes:30, ip_whitelist_enabled:false } });
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

  useEffect(() => { getAppSettings().then(d=>{if(d)setSettings(d)}).catch(console.error); getSystemInfo().then(setSystemInfo).catch(console.error); listUsers().then(setTeamUsers).catch(console.error); }, []);

  const updateField = (path: string, value: any) => { setSettings((p: any) => { const k=path.split('.'),u={...p}; let o=u; for(let i=0;i<k.length-1;i++){o[k[i]]={...o[k[i]]};o=o[k[i]]} o[k[k.length-1]]=value; return u; }); setHasChanges(true); };
  const handleSave = async () => { setIsSaving(true); try{await updateAppSettings(settings);setDark(settings.dark_mode);toast.success('Saved!');setHasChanges(false)}catch{toast.error('Failed')}finally{setIsSaving(false)} };
  const handleChangePw = async () => { if(!currentPassword){toast.error('Enter current password');return} if(newPassword.length<8){toast.error('Min 8 chars');return} if(newPassword!==confirmPassword){toast.error('Mismatch');return} setIsChangingPassword(true); try{await changePassword(currentPassword,newPassword);toast.success('Changed!');setCurrentPassword('');setNewPassword('');setConfirmPassword('');setShowPasswordForm(false)}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')}finally{setIsChangingPassword(false)} };
  const handleCreateUser = async () => { if(!newUsername.trim()||!newEmail.trim()||!newUserPassword.trim()){toast.error('All fields required');return} if(newUserPassword.length<8){toast.error('Min 8 chars');return} try{await createUser(newUsername,newEmail,newUserPassword,newUserRole);toast.success(`Created "${newUsername}"`);setShowAddUser(false);setNewUsername('');setNewEmail('');setNewUserPassword('');setNewUserRole('user');listUsers().then(setTeamUsers);getSystemInfo().then(setSystemInfo)}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')} };
  const handleDeleteUser = async (u:string) => { if(!confirm(`Delete "${u}"?`))return; try{await deleteUser(u);toast.success(`Deleted`);listUsers().then(setTeamUsers);getSystemInfo().then(setSystemInfo)}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')} };
  const handleResetPw = async () => { if(!resetUser)return; if(adminResetPw.length<8){toast.error('Min 8 chars');return} setIsResetting(true); try{await adminResetPassword(resetUser,adminResetPw);toast.success(`Reset for ${resetUser}`);setResetUser(null);setAdminResetPw('')}catch(e:any){toast.error(e?.response?.data?.detail||'Failed')}finally{setIsResetting(false)} };

  const C:React.CSSProperties={background:'linear-gradient(135deg,#161B22,#1a1f28)',border:'1px solid #21262D',borderRadius:16};
  const I:React.CSSProperties={width:'100%',background:'rgba(13,17,23,0.8)',border:'1px solid #30363D',borderRadius:8,padding:'8px 12px',color:'#E6EDF3',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'};
  const S:React.CSSProperties={background:'rgba(13,17,23,0.5)',borderRadius:12,padding:'16px 18px',border:'1px solid #21262D'};
  const L:React.CSSProperties={color:'#7D8590',fontSize:12,marginBottom:6,display:'block'};
  const pill=(c:string):React.CSSProperties=>({padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600,color:c,background:`${c}10`,border:`1px solid ${c}33`,display:'flex',alignItems:'center',gap:4});

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
    </div></div>}

    {/* Notifications */}
    {activeTab==='notifications'&&<div className="sr" style={{...C,padding:'20px 24px'}}><div style={{display:'flex',flexDirection:'column',gap:14}}>
      {[{icon:Shield,color:'#FF4D4D',title:'Critical Alerts',desc:'Instant push for high-risk threats',field:'notifications.critical_alerts',val:settings.notifications?.critical_alerts},
        {icon:Mail,color:'#58A6FF',title:'Email Reports',desc:'Periodic security summaries',field:'notifications.email_reports',val:settings.notifications?.email_reports},
        {icon:Bell,color:'#E3B341',title:'Weekly Digest',desc:'Weekly security digest',field:'notifications.weekly_digest',val:settings.notifications?.weekly_digest},
        {icon:Slack,color:'#BC8CFF',title:'Slack Notifications',desc:'Send alerts to Slack',field:'notifications.slack_integration',val:settings.notifications?.slack_integration},
      ].map((n,i)=><div key={i} style={S}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:10}}><n.icon size={16} color={n.color}/><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>{n.title}</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>{n.desc}</div></div></div><Switch checked={n.val} onCheckedChange={v=>updateField(n.field,v)}/></div>
        {n.field==='notifications.email_reports'&&(settings.notifications?.email_reports||settings.notifications?.critical_alerts)&&<div style={{marginTop:12,paddingLeft:26}}><div style={L}>Email</div><input placeholder="admin@defenxion.com" value={settings.notifications?.email_address||''} onChange={e=>updateField('notifications.email_address',e.target.value)} style={I}/></div>}
        {n.field==='notifications.slack_integration'&&settings.notifications?.slack_integration&&<div style={{marginTop:12,paddingLeft:26}}><div style={L}>Webhook URL</div><input placeholder="https://hooks.slack.com/..." value={settings.notifications?.slack_webhook_url||''} onChange={e=>updateField('notifications.slack_webhook_url',e.target.value)} style={I}/></div>}
      </div>)}
    </div></div>}

    {/* Security */}
    {activeTab==='security'&&<div className="sr" style={{...C,padding:'20px 24px'}}><div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{...S,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>Two-Factor Auth</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>Extra security layer</div></div><Switch checked={settings.security?.two_factor_enabled} onCheckedChange={v=>updateField('security.two_factor_enabled',v)}/></div>
      <div style={S}><div style={L}>Session Timeout</div><div style={{display:'flex',alignItems:'center',gap:8}}><Clock size={14} color="#7D8590"/><select value={String(settings.security?.session_timeout_minutes||30)} onChange={e=>updateField('security.session_timeout_minutes',parseInt(e.target.value))} style={{...I,cursor:'pointer',width:200}}>{[['15','15 min'],['30','30 min'],['60','1 hour'],['120','2 hours'],['480','8 hours']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div>
      <div style={{...S,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><div style={{color:'#E6EDF3',fontSize:13,fontWeight:500}}>IP Whitelist</div><div style={{color:'#7D8590',fontSize:12,marginTop:1}}>Only whitelisted IPs</div></div><Switch checked={settings.security?.ip_whitelist_enabled} onCheckedChange={v=>updateField('security.ip_whitelist_enabled',v)}/></div>
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

    </div>
  </>);
}
