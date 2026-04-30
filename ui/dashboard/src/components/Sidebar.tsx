import { useEffect, useState } from "react";
import { Home, BarChart3, AlertTriangle, Brain, Shield, FileText, Settings, User, LucideIcon, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps { activeItem: string; onItemClick: (item: string) => void; collapsed: boolean; onToggle: () => void; }
interface MenuItem { id: string; label: string; icon: LucideIcon; adminOnly?: boolean; }

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard Overview", icon: Home },
  { id: "analytics", label: "Live Analytics", icon: BarChart3 },
  { id: "threats", label: "Detected Threats", icon: AlertTriangle },
  { id: "model", label: "AI Model", icon: Brain, adminOnly: true },
  { id: "defense", label: "Active Defense", icon: Shield, adminOnly: true },
  { id: "reports", label: "Reports & Logs", icon: FileText, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
];

export function Sidebar({ activeItem, onItemClick, collapsed, onToggle }: SidebarProps) {
  const [role, setRole] = useState<string | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) { try { setRole(JSON.parse(atob(token.split(".")[1])).role); } catch { setRole(null); } }
  }, []);

  const W = collapsed ? 68 : 240;

  const renderItem = (item: MenuItem) => {
    if (item.adminOnly && role !== "admin") return null;
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    return (
      <div key={item.id} style={{ position:'relative' }}>
        <button onClick={() => onItemClick(item.id)} title={collapsed ? item.label : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '9px 14px',
            borderRadius: collapsed ? 10 : '0 10px 10px 0', marginBottom: 2, border: 'none', fontFamily: 'inherit',
            fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
            transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
            borderLeft: collapsed ? 'none' : (isActive ? '3px solid #1F6FEB' : '3px solid transparent'),
            background: isActive
              ? (isDark ? 'rgba(31,111,235,0.12)' : 'rgba(9,105,218,0.08)')
              : 'transparent',
            color: isActive
              ? (isDark ? '#58A6FF' : '#0550AE')
              : (isDark ? '#8B949E' : '#57606A'),
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.background = isDark ? 'rgba(31,111,235,0.06)' : 'rgba(9,105,218,0.04)';
              e.currentTarget.style.color = isDark ? '#C9D1D9' : '#1F2328';
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = isDark ? '#8B949E' : '#57606A';
            }
          }}
        >
          {isActive && !collapsed && <div style={{ position:'absolute', top:0, bottom:0, left:0, width:3, background:'linear-gradient(180deg,#58A6FF,#1F6FEB)', borderRadius:'0 2px 2px 0' }} />}
          {isActive && collapsed && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:20, background:'linear-gradient(180deg,#58A6FF,#1F6FEB)', borderRadius:'0 2px 2px 0' }} />}
          <div style={{
            width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? (isDark ? 'rgba(31,111,235,0.15)' : 'rgba(9,105,218,0.1)') : 'transparent',
            transition: 'background 0.2s', flexShrink: 0,
          }}>
            <Icon size={16} />
          </div>
          {!collapsed && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
          {isActive && !collapsed && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#1F6FEB', boxShadow:'0 0 8px rgba(31,111,235,0.5)', flexShrink:0 }} />}
        </button>
      </div>
    );
  };

  const sectionLabel = (text: string) => {
    if (collapsed) return <div style={{ height:8 }} />;
    return (
      <div style={{ padding:'4px 16px', marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color: isDark ? '#484F58' : '#8C959F' }}>{text}</span>
      </div>
    );
  };

  return (
    <aside style={{
      width: W, minWidth: W, height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0,
      background: isDark ? 'linear-gradient(180deg,#0D1117 0%,#0a0e14 100%)' : '#FFFFFF',
      borderRight: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
      transition: 'width 0.25s ease, min-width 0.25s ease',
    }}>

      {/* Brand */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 20px',
        display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1F6FEB, #58A6FF)',
          boxShadow: '0 4px 16px rgba(31,111,235,0.4)', flexShrink: 0,
        }}>
          <Shield size={18} color="white" />
        </div>
        {!collapsed && <div style={{ overflow:'hidden', whiteSpace:'nowrap' }}>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.2 }}>
            <span style={{ color: isDark ? '#E6EDF3' : '#1F2328' }}>Defen</span><span style={{ color:'#58A6FF' }}>Xion</span>
          </div>
          <div style={{ color: isDark ? '#484F58' : '#8C959F', fontSize:11, fontWeight:500, lineHeight:1.2, marginTop:2 }}>Intelligent Defence</div>
        </div>}
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding: collapsed ? '14px 6px' : '14px 12px 14px 2px', overflowY:'auto', overflowX:'hidden' }}>
        {sectionLabel('Navigation')}
        {menuItems.slice(0, 3).map(renderItem)}
        <div style={{ height:12 }} />
        {sectionLabel('Administration')}
        {menuItems.slice(3, 6).map(renderItem)}
        <div style={{ height:12 }} />
        {sectionLabel('Account')}
        {menuItems.slice(6).map(renderItem)}
      </nav>

      {/* Toggle Button */}
      <div style={{ padding: collapsed ? '8px 0' : '8px 12px', display:'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
            color: isDark ? '#7D8590' : '#57606A', cursor:'pointer', transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(31,111,235,0.12)' : 'rgba(9,105,218,0.08)'; e.currentTarget.style.color = isDark ? '#58A6FF' : '#0550AE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = isDark ? '#7D8590' : '#57606A'; }}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '10px 0' : '12px 20px',
        borderTop: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
        color: isDark ? '#30363D' : '#8C959F', fontSize:10, fontWeight:500,
        textAlign: collapsed ? 'center' : 'left', overflow:'hidden', whiteSpace:'nowrap',
      }}>
        {collapsed ? 'v2.0' : 'DefenXion v2.0 · © 2026'}
      </div>
    </aside>
  );
}
