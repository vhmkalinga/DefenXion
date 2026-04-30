import { useEffect, useState } from "react";
import { Search, Bell, LogOut, Shield } from "lucide-react";
import { toast } from 'sonner';
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

interface TopBarProps { onLogout: () => void; onNavigate: (page: string) => void; }
interface User { username: string; role: string; avatar?: string; full_name?: string; }

export function TopBar({ onLogout, onNavigate }: TopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchUser = async () => { try { setUser((await api.get("/auth/me")).data); } catch { console.error("Failed to load user"); } };
    fetchUser();
    const h = () => fetchUser();
    window.addEventListener('profileUpdated', h);
    return () => window.removeEventListener('profileUpdated', h);
  }, []);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch { console.error("Logout failed"); }
    localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); onLogout();
  };

  const avatarUrl = user ? (user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`) : '';

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
      background: isDark ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
    }}>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 420 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: isDark ? '#484F58' : '#8C959F' }} />
          <input type="text" placeholder="Search logs, threats, or commands…"
            style={{
              width: '100%', borderRadius: 10, padding: '7px 14px 7px 34px', fontSize: 13,
              background: isDark ? 'rgba(13,17,23,0.8)' : '#F6F8FA',
              border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`,
              color: isDark ? '#C9D1D9' : '#1F2328', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1F6FEB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,111,235,0.12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#30363D' : '#D0D7DE'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 24 }}>

        {/* Defense Status Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20,
          background: isDark ? 'rgba(63,185,80,0.08)' : 'rgba(26,127,55,0.06)',
          border: `1px solid ${isDark ? 'rgba(63,185,80,0.2)' : 'rgba(26,127,55,0.15)'}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3FB950', boxShadow: '0 0 6px rgba(63,185,80,0.5)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#3FB950' : '#1A7F37' }}>Protected</span>
        </div>

        {/* Notifications */}
        <button onClick={() => toast.info('No pending alerts.')} title="Notifications"
          style={{
            position: 'relative', padding: 7, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: isDark ? '#8B949E' : '#57606A', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell size={17} />
          <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#FF4D4D', border: `2px solid ${isDark ? '#161B22' : '#FFFFFF'}`, boxShadow: '0 0 6px rgba(255,77,77,0.4)' }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: isDark ? '#21262D' : '#D0D7DE' }} />

        {/* User */}
        {user && (
          <button onClick={() => onNavigate('profile')} title="View Profile"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 10,
              border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${isDark ? '#21262D' : '#D0D7DE'}`, background: '#0D1117',
            }}>
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#E6EDF3' : '#1F2328', lineHeight: 1.2 }}>
                {user.full_name || user.username}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#8B949E' : '#57606A', lineHeight: 1.2, letterSpacing: '0.04em' }}>
                {user.role}
              </div>
            </div>
          </button>
        )}

        {/* Logout */}
        <button onClick={handleLogout} title="Log out"
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            background: isDark ? 'rgba(248,81,73,0.06)' : 'rgba(207,34,46,0.04)',
            color: isDark ? '#F85149' : '#CF222E', fontSize: 12, fontWeight: 600,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(248,81,73,0.14)' : 'rgba(207,34,46,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(248,81,73,0.06)' : 'rgba(207,34,46,0.04)'; }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
