import { useEffect, useState, useRef } from "react";
import { Search, Bell, LogOut, Shield, AlertTriangle, ShieldAlert, AlertOctagon, Info } from "lucide-react";
import { toast } from 'sonner';
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

interface TopBarProps { onLogout: () => void; onNavigate: (page: string) => void; }
interface User { username: string; role: string; avatar?: string; full_name?: string; }
interface Alert { id: string; time: string; timestamp: string; type: string; severity: string; sourceIp: string; targetPort: string; confidence: number; status: string; details: string; }

export function TopBar({ onLogout, onNavigate }: TopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchUser = async () => { try { setUser((await api.get("/auth/me")).data); } catch { console.error("Failed to load user"); } };
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/dashboard/recent-alerts");
        setNotifications(res.data);
        const lastRead = localStorage.getItem("last_read_notification");
        if (!lastRead) {
          setUnreadCount(res.data.length);
        } else {
          const unread = res.data.filter((n: Alert) => new Date(n.timestamp).getTime() > new Date(lastRead).getTime());
          setUnreadCount(unread.length);
        }
      } catch { console.error("Failed to load notifications"); }
    };

    fetchUser();
    fetchNotifications();

    const h = () => fetchUser();
    window.addEventListener('profileUpdated', h);

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Poll for notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('profileUpdated', h);
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && notifications.length > 0) {
      setUnreadCount(0);
      localStorage.setItem("last_read_notification", notifications[0].timestamp);
    }
  };

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
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button onClick={toggleNotifications} title="Notifications"
            style={{
              position: 'relative', padding: 7, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: showNotifications ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
              color: isDark ? '#8B949E' : '#57606A', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!showNotifications) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={e => { if (!showNotifications) e.currentTarget.style.background = 'transparent'; }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: 3, right: 3, padding: '0 4px', height: 14,
                borderRadius: 7, background: '#FF4D4D', color: '#FFF', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${isDark ? '#161B22' : '#FFFFFF'}`, boxShadow: '0 0 6px rgba(255,77,77,0.4)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 10, width: 320,
              background: isDark ? 'rgba(22,27,34,0.95)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`, borderRadius: 12,
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#E6EDF3' : '#1F2328' }}>Notifications</span>
                {unreadCount > 0 && <span style={{ fontSize: 11, color: '#FF4D4D', fontWeight: 600 }}>{unreadCount} New</span>}
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: isDark ? '#8B949E' : '#57606A', fontSize: 13 }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif, i) => (
                    <div key={notif.id || i} style={{
                      padding: '12px 16px', borderBottom: i < notifications.length - 1 ? `1px solid ${isDark ? '#21262D' : '#F3F4F6'}` : 'none',
                      display: 'flex', gap: 12, transition: 'background 0.15s', cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => { setShowNotifications(false); onNavigate('threats'); }}
                    >
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {notif.severity === 'Critical' ? <AlertOctagon size={16} color="#FF4D4D" /> :
                         notif.severity === 'High' ? <ShieldAlert size={16} color="#FF9000" /> :
                         notif.severity === 'Medium' ? <AlertTriangle size={16} color="#E3B341" /> :
                         <Info size={16} color="#1F6FEB" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#E6EDF3' : '#1F2328', marginBottom: 4 }}>
                          {notif.type}
                        </div>
                        <div style={{ fontSize: 11, color: isDark ? '#8B949E' : '#57606A', lineHeight: 1.4 }}>
                          {notif.details}
                        </div>
                        <div style={{ fontSize: 10, color: isDark ? '#484F58' : '#8C959F', marginTop: 6, fontWeight: 500 }}>
                          {notif.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{
                padding: '10px 16px', borderTop: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`,
                textAlign: 'center', background: isDark ? 'rgba(13,17,23,0.5)' : '#F9FAFB'
              }}>
                <button onClick={() => { setShowNotifications(false); onNavigate('threats'); }}
                  style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: '#1F6FEB', cursor: 'pointer' }}>
                  View All Activity
                </button>
              </div>
            </div>
          )}
        </div>

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
