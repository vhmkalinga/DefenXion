import { useEffect, useState } from "react";
import {
  Home,
  BarChart3,
  AlertTriangle,
  Brain,
  Shield,
  FileText,
  Settings,
  User,
  LucideIcon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// =====================================================
// MENU CONFIGURATION
// =====================================================
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

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [role, setRole] = useState<string | null>(null);
  const { isDark } = useTheme();

  // =====================================================
  // Load Role From JWT
  // =====================================================
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
      } catch {
        setRole(null);
      }
    }
  }, []);

  // =====================================================
  // Render Menu Item
  // =====================================================
  const renderMenuItem = (item: MenuItem) => {
    // Hide admin-only items for non-admin users
    if (item.adminOnly && role !== "admin") {
      return null;
    }

    const Icon = item.icon;
    const isActive = activeItem === item.id;

    // Active styles for each theme
    const activeStyle = isDark
      ? {
        backgroundColor: 'rgba(31, 111, 235, 0.18)',
        color: '#58A6FF',
        borderLeft: '3px solid #1F6FEB',
      }
      : {
        backgroundColor: 'rgba(9, 105, 218, 0.1)',
        color: '#0550AE',
        borderLeft: '3px solid #0969DA',
      };

    const inactiveStyle = {
      backgroundColor: 'transparent',
      color: isDark ? '#8B949E' : '#57606A',
      borderLeft: '3px solid transparent',
    };

    return (
      <button
        key={item.id}
        onClick={() => onItemClick(item.id)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg mb-0.5 transition-all duration-200 text-sm font-medium"
        style={isActive ? activeStyle : inactiveStyle}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = isDark
              ? 'rgba(31, 111, 235, 0.08)'
              : 'rgba(9, 105, 218, 0.06)';
            e.currentTarget.style.color = isDark ? '#C9D1D9' : '#1F2328';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isDark ? '#8B949E' : '#57606A';
          }
        }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      className="w-60 h-screen flex flex-col flex-shrink-0"
      style={{
        backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
        borderRight: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
      }}
    >

      {/* ================= BRAND ================= */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, #1F6FEB, #0550AE)',
              boxShadow: '0 2px 8px rgba(31, 111, 235, 0.3)'
            }}
          >
            DX
          </div>
          <div>
            <h1
              className="font-semibold tracking-tight text-[15px] leading-tight"
              style={{ color: isDark ? '#E6EDF3' : '#1F2328' }}
            >
              DefenXion
            </h1>
            <p
              className="text-[11px] leading-tight"
              style={{ color: isDark ? '#1F6FEB' : '#0969DA' }}
            >
              Intelligent Defense
            </p>
          </div>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 pl-1 pr-3 py-4 overflow-y-auto">
        <div className="mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#484F58' : '#8C959F' }}>
            Navigation
          </span>
        </div>
        {menuItems.slice(0, 3).map(renderMenuItem)}

        <div className="mt-4 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#484F58' : '#8C959F' }}>
            Administration
          </span>
        </div>
        {menuItems.slice(3, 6).map(renderMenuItem)}

        <div className="mt-4 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#484F58' : '#8C959F' }}>
            Account
          </span>
        </div>
        {menuItems.slice(6).map(renderMenuItem)}
      </nav>

      {/* ================= FOOTER ================= */}
      <div
        className="px-5 py-3 text-[10px]"
        style={{
          borderTop: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
          color: isDark ? '#484F58' : '#8C959F',
        }}
      >
        DefenXion v2.0 · © 2026
      </div>
    </aside>
  );
}
