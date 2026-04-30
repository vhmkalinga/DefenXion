import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Award, Activity, Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getMe, updateMe } from '../../services/api';

const AVATARS = ['admin','felix','aneka','jack','oliver','leo','salem','milo','cyber','shield','shadow','neon'];
const ACTIVITY = [
  { action:'Generated security report', time:'2 hours ago', type:'report' },
  { action:'Updated firewall rules', time:'5 hours ago', type:'config' },
  { action:'Blocked DDoS attack', time:'1 day ago', type:'threat' },
  { action:'Trained AI model v3.2', time:'3 days ago', type:'model' },
  { action:'Added new team member', time:'1 week ago', type:'user' },
];
const ACHIEVE = [
  { title:'Test Execution', desc:'Passed 1000+ threat scenarios', icon:Shield, color:'#FF4D4D' },
  { title:'Model Accuracy', desc:'Achieved 95% detection rate', icon:Award, color:'#FFA657' },
  { title:'Data Processing', desc:'Processed 50,000+ test packets', icon:Activity, color:'#58A6FF' },
];
const TYPE_CLR:Record<string,string> = { threat:'#FF4D4D', config:'#FFA657', model:'#58A6FF', report:'#3FB950', user:'#7D8590' };
const STATS = [{l:'Threats Blocked',v:'2,847',c:'#FF4D4D'},{l:'Reports Generated',v:'142',c:'#3FB950'},{l:'Models Trained',v:'12',c:'#58A6FF'},{l:'Active Days',v:'298',c:'#BC8CFF'}];

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [profile, setProfile] = useState<any>({ username:'...', role:'...', full_name:'...', email:'...', phone:'...', location:'...', member_since:'...' });
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', location:'', avatar:'' });

  useEffect(() => { getMe().then(d => { setProfile(d); setForm({ full_name:d.full_name||'', email:d.email||'', phone:d.phone||'', location:d.location||'', avatar:d.avatar||'' }); }).catch(console.error); }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2*1024*1024) { toast.error('Max 2MB'); return; }
    const r = new FileReader(); r.onloadend = () => { setForm(p=>({...p, avatar:r.result as string})); setShowAvatarModal(false); }; r.readAsDataURL(f);
  };
  const selectAvatar = (s:string) => { setForm(p=>({...p, avatar:`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`})); setShowAvatarModal(false); };
  const handleSave = async () => { setIsSaving(true); try { await updateMe(form); setProfile((p:any)=>({...p,...form})); setIsEditing(false); window.dispatchEvent(new Event('profileUpdated')); toast.success('Saved!'); } catch { toast.error('Failed'); } finally { setIsSaving(false); } };
  const cancel = () => { setIsEditing(false); setForm({ full_name:profile.full_name||'', email:profile.email||'', phone:profile.phone||'', location:profile.location||'', avatar:profile.avatar||'' }); };

  const C:React.CSSProperties = { background:'linear-gradient(135deg,#161B22,#1a1f28)', border:'1px solid #21262D', borderRadius:16 };
  const I:React.CSSProperties = { width:'100%', background:'rgba(13,17,23,0.8)', border:'1px solid #30363D', borderRadius:8, padding:'8px 12px', color:'#E6EDF3', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
  const L:React.CSSProperties = { color:'#7D8590', fontSize:12, marginBottom:6, display:'flex', alignItems:'center', gap:6 };
  const avatarUrl = form.avatar || profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username||'admin'}`;

  return (<>
    <style>{`@keyframes pf{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes ps{to{transform:rotate(360deg)}}.pr{animation:pf .35s ease both}.pr:nth-child(2){animation-delay:.06s}.pr:nth-child(3){animation-delay:.12s}.pr:nth-child(4){animation-delay:.18s}`}</style>
    <div style={{ padding:'28px 32px', maxWidth:1440, margin:'0 auto' }}>

      {/* Header */}
      <div className="pr" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#3FB950,#2ea043)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 20px rgba(63,185,80,0.3)' }}><User size={22} color="white"/></div>
          <div><h1 style={{ color:'#E6EDF3', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0 }}>Profile</h1><p style={{ color:'#7D8590', fontSize:13, marginTop:3 }}>Manage your account details</p></div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {isEditing ? (<>
            <button onClick={cancel} disabled={isSaving} style={{ padding:'8px 16px', borderRadius:8, background:'none', border:'1px solid #30363D', color:'#7D8590', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={isSaving} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1F6FEB,#2679f5)', color:'white', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:isSaving?'not-allowed':'pointer', boxShadow:'0 4px 12px rgba(31,111,235,0.3)' }}>
              {isSaving?<Loader2 size={14} style={{ animation:'ps .8s linear infinite' }}/>:null} {isSaving?'Saving…':'Save Profile'}
            </button>
          </>) : (
            <button onClick={()=>setIsEditing(true)} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid #30363D', color:'#E6EDF3', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}>Edit Profile</button>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        {/* Left Column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Profile Card */}
          <div className="pr" style={{ ...C, padding:'24px 28px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:80, background:'linear-gradient(135deg,rgba(31,111,235,0.15),rgba(63,185,80,0.1))', pointerEvents:'none' }}/>
            <div style={{ display:'flex', alignItems:'flex-start', gap:20, position:'relative', zIndex:1, marginBottom:20 }}>
              {/* Avatar */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:88, height:88, borderRadius:'50%', border:'3px solid #21262D', overflow:'hidden', background:'#0D1117' }}>
                  <img src={avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
                {isEditing && <button onClick={()=>setShowAvatarModal(true)} style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='0')}><Camera size={16} color="white"/><span style={{ color:'white', fontSize:9, fontWeight:600, marginTop:2 }}>CHANGE</span></button>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:'#E6EDF3', fontSize:18, fontWeight:700 }}>{profile.full_name||profile.username}</div>
                <div style={{ color:'#7D8590', fontSize:13, textTransform:'capitalize', marginTop:2 }}>{profile.role}</div>
                <div style={{ marginTop:8 }}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:600, color:'#3FB950', background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.25)' }}>Active</span></div>
              </div>
            </div>
            {/* Form Fields */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { icon:User, label:'Full Name', key:'full_name', ph:'Enter full name' },
                { icon:Mail, label:'Email', key:'email', ph:'Enter email', type:'email' },
                { icon:Phone, label:'Phone', key:'phone', ph:'Enter phone' },
                { icon:MapPin, label:'Location', key:'location', ph:'Enter location' },
              ].map(f => (
                <div key={f.key}>
                  <div style={L}><f.icon size={12}/> {f.label}</div>
                  <input type={f.type||'text'} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} disabled={!isEditing} placeholder={f.ph} style={{ ...I, opacity:isEditing?1:0.7, cursor:isEditing?'text':'not-allowed' }}/>
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <div style={L}><Calendar size={12}/> Member Since</div>
                <input value={profile.member_since} disabled style={{ ...I, opacity:0.5, cursor:'not-allowed' }}/>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="pr" style={{ ...C, padding:'20px 24px' }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:14 }}>Recent Activity</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ACTIVITY.map((a,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:8, background:'rgba(13,17,23,0.4)', border:'1px solid transparent', transition:'border-color 0.15s' }} onMouseEnter={e=>(e.currentTarget.style.borderColor='#21262D')} onMouseLeave={e=>(e.currentTarget.style.borderColor='transparent')}>
                  <div style={{ width:8, height:8, borderRadius:'50%', marginTop:5, background:TYPE_CLR[a.type]||'#7D8590', boxShadow:`0 0 8px ${TYPE_CLR[a.type]||'#7D8590'}40`, flexShrink:0 }}/>
                  <div style={{ flex:1 }}><div style={{ color:'#E6EDF3', fontSize:13 }}>{a.action}</div><div style={{ color:'#484F58', fontSize:11, marginTop:2 }}>{a.time}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Login History */}
          <div className="pr" style={{ ...C, padding:'20px 24px' }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:14 }}>Login History</div>
            {profile.login_history?.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[...profile.login_history].reverse().map((l:any,i:number) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', borderRadius:6, background:'rgba(13,17,23,0.4)' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', marginTop:5, background:'#1F6FEB', flexShrink:0 }}/>
                    <div><div style={{ color:'#E6EDF3', fontFamily:'monospace', fontSize:12 }}>{l.ip}</div><div style={{ color:'#484F58', fontSize:10, marginTop:2 }}>{new Date(l.timestamp).toLocaleString()}</div></div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color:'#484F58', fontSize:12 }}>No recent logins</div>}
          </div>

          {/* Achievements */}
          <div className="pr" style={{ ...C, padding:'20px 24px' }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:14 }}>Achievements</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {ACHIEVE.map((a,i) => (
                <div key={i} style={{ background:'rgba(13,17,23,0.5)', border:'1px solid #21262D', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-10, right:-10, width:40, height:40, borderRadius:'50%', background:`radial-gradient(circle,${a.color}15,transparent)`, pointerEvents:'none' }}/>
                  <div style={{ padding:7, borderRadius:8, background:`${a.color}15` }}><a.icon size={16} color={a.color}/></div>
                  <div><div style={{ color:'#E6EDF3', fontSize:13, fontWeight:500 }}>{a.title}</div><div style={{ color:'#7D8590', fontSize:11, marginTop:2 }}>{a.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="pr" style={{ ...C, padding:'20px 24px' }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:14 }}>Statistics</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {STATS.map((s,i) => (
                <div key={i} style={{ background:'rgba(13,17,23,0.5)', borderRadius:10, padding:'12px 14px', border:'1px solid #21262D', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-12, right:-12, width:36, height:36, borderRadius:'50%', background:`radial-gradient(circle,${s.c}18,transparent)`, pointerEvents:'none' }}/>
                  <div style={{ color:'#7D8590', fontSize:10, marginBottom:4 }}>{s.l}</div>
                  <div style={{ color:s.c, fontSize:18, fontWeight:700, fontFamily:'monospace' }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="pr" style={{ ...C, padding:'20px 24px' }}>
            <div style={{ color:'#E6EDF3', fontSize:14, fontWeight:600, marginBottom:14 }}>Project Details</div>
            {[{l:'Course',v:'Computer Science',c:'#58A6FF'},{l:'Module',v:'Final Year Project',c:'#E6EDF3'},{l:'Status',v:'Prototype',c:'#3FB950'}].map((p,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<2?'1px solid #21262D':'none' }}>
                <span style={{ color:'#7D8590', fontSize:12 }}>{p.l}</span><span style={{ color:p.c, fontSize:12, fontWeight:500 }}>{p.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} onClick={()=>setShowAvatarModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ ...C, padding:'24px 28px', width:420, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ color:'#E6EDF3', fontSize:16, fontWeight:700 }}>Choose Avatar</div>
              <button onClick={()=>setShowAvatarModal(false)} style={{ background:'none', border:'none', color:'#7D8590', cursor:'pointer' }}><X size={16}/></button>
            </div>
            <div style={{ color:'#7D8590', fontSize:12, marginBottom:16 }}>Select a predefined avatar or upload your own</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
              {AVATARS.map(s=>(
                <button key={s} onClick={()=>selectAvatar(s)} style={{ width:64, height:64, borderRadius:'50%', border:'2px solid transparent', overflow:'hidden', cursor:'pointer', background:'#0D1117', transition:'border-color 0.15s', padding:0 }} onMouseEnter={e=>(e.currentTarget.style.borderColor='#1F6FEB')} onMouseLeave={e=>(e.currentTarget.style.borderColor='transparent')}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} alt={s} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </button>
              ))}
            </div>
            <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 16px', border:'1px dashed #30363D', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }} onMouseEnter={e=>(e.currentTarget.style.background='rgba(22,27,34,0.5)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <Upload size={16} color="#7D8590"/><span style={{ color:'#E6EDF3', fontSize:13 }}>Upload custom image</span>
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange}/>
            </label>
            <div style={{ color:'#484F58', fontSize:11, textAlign:'center', marginTop:8 }}>Max 2MB</div>
          </div>
        </div>
      )}

    </div>
  </>);
}
