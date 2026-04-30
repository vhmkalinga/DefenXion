import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, User, AlertCircle, Loader2, Wifi, WifiOff, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface MobileLoginProps { onLogin: () => void; }

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function MobileLogin({ onLogin }: MobileLoginProps) {
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    axios.get(`${API}/health`, { timeout: 4000 })
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const form = new URLSearchParams(); form.append('username', username); form.append('password', password);
      const res = await axios.post(`${API}/auth/login`, form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      localStorage.setItem('access_token', res.data.access_token);
      if (res.data.refresh_token) localStorage.setItem('refresh_token', res.data.refresh_token);
      onLogin();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed';
      setError(msg); setShake(true); setTimeout(() => setShake(false), 600);
    } finally { setLoading(false); }
  };

  return (<>
    <style>{`
      @keyframes ml-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ml-scale{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
      @keyframes ml-spin{to{transform:rotate(360deg)}}
      @keyframes ml-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
      @keyframes ml-glow{0%,100%{box-shadow:0 0 20px rgba(31,111,235,0.15)}50%{box-shadow:0 0 40px rgba(31,111,235,0.3)}}
    `}</style>
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0D1117 0%,#0a0f18 50%,#0D1117 100%)', display:'flex', flexDirection:'column', padding:'24px 20px', position:'relative', overflow:'hidden' }}>

      {/* Ambient glow */}
      <div style={{ position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(31,111,235,0.08),transparent 70%)', pointerEvents:'none' }} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:400, margin:'0 auto', width:'100%', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36, animation:'ml-up 0.5s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:16, animation:'ml-scale 0.6s ease both' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1F6FEB,#58A6FF)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(31,111,235,0.4)', flexShrink:0 }}>
              <Shield size={22} color="white" />
            </div>
            <span style={{ color:'#E6EDF3', fontWeight:700, fontSize:22, letterSpacing:'-0.02em' }}>Defen<span style={{ color:'#58A6FF' }}>Xion</span></span>
          </div>
          <p style={{ color:'#7D8590', fontSize:13, marginBottom:10 }}>Sign in to your security dashboard</p>

          {/* Status pill */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20,
            background: backendOnline === false ? 'rgba(255,77,77,0.08)' : backendOnline === true ? 'rgba(63,185,80,0.08)' : 'rgba(125,133,144,0.08)',
            border: `1px solid ${backendOnline === false ? 'rgba(255,77,77,0.2)' : backendOnline === true ? 'rgba(63,185,80,0.2)' : 'rgba(125,133,144,0.2)'}`,
          }}>
            {backendOnline === false
              ? <><WifiOff size={10} color="#FF4D4D" /><span style={{ fontSize:10, color:'#FF4D4D' }}>Backend Offline</span></>
              : backendOnline === true
              ? <><Wifi size={10} color="#3FB950" /><span style={{ fontSize:10, color:'#3FB950' }}>Backend Online</span></>
              : <><span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid #7D8590', borderTopColor:'transparent', display:'inline-block', animation:'ml-spin 0.8s linear infinite' }} /><span style={{ fontSize:10, color:'#7D8590' }}>Checking…</span></>
            }
          </div>
        </div>

        {/* Form card */}
        <div style={{ background:'linear-gradient(135deg,rgba(22,27,34,0.9),rgba(13,17,23,0.95))', border:'1px solid #21262D', borderRadius:20, padding:'28px 24px', animation:'ml-up 0.5s ease 0.15s both', position:'relative', overflow:'hidden' }}>
          {/* Accent line */}
          <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(88,166,255,0.5),transparent)' }} />

          {error && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'rgba(255,77,77,0.08)', border:'1px solid rgba(255,77,77,0.2)', borderRadius:10, padding:'10px 12px', marginBottom:18, animation: shake ? 'ml-shake 0.5s ease' : 'ml-up 0.3s ease' }}>
              <AlertCircle size={14} color="#FF4D4D" style={{ flexShrink:0, marginTop:1 }} />
              <span style={{ color:'#FF4D4D', fontSize:12 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Username */}
            <div>
              <label style={{ display:'block', color:'#C9D1D9', fontSize:13, fontWeight:500, marginBottom:7 }}>Username</label>
              <div style={{ position:'relative' }}>
                <User size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#484F58' }} />
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username"
                  style={{ width:'100%', padding:'12px 14px 12px 38px', borderRadius:10, border:'1px solid #30363D', background:'rgba(13,17,23,0.8)', color:'#E6EDF3', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor='#1F6FEB'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,111,235,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor='#30363D'; e.currentTarget.style.boxShadow='none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', color:'#C9D1D9', fontSize:13, fontWeight:500, marginBottom:7 }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#484F58' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password"
                  style={{ width:'100%', padding:'12px 44px 12px 38px', borderRadius:10, border:'1px solid #30363D', background:'rgba(13,17,23,0.8)', color:'#E6EDF3', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor='#1F6FEB'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,111,235,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor='#30363D'; e.currentTarget.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#7D8590', cursor:'pointer', padding:0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || backendOnline === false}
              style={{
                width:'100%', padding:'13px 0', borderRadius:12, border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,#1F6FEB,#58A6FF)', color:'white', fontSize:15, fontWeight:700,
                fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:'0 4px 20px rgba(31,111,235,0.3)', opacity: (loading || backendOnline === false) ? 0.6 : 1,
                transition:'opacity 0.2s, transform 0.1s',
              }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? <><Loader2 size={18} style={{ animation:'ml-spin 0.8s linear infinite' }} /> Signing in…</>
                : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', color:'#30363D', fontSize:11, marginTop:20, animation:'ml-up 0.5s ease 0.4s both' }}>
        DefenXion © 2026 — Intelligent Network Defence
      </div>
    </div>
  </>);
}
