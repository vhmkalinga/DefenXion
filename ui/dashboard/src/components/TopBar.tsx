import { useEffect, useState } from "react";
import { Search, Bell, LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { toast } from 'sonner';
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

interface TopBarProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface User {
  username: string;
  role: string;
  avatar?: string;
  full_name?: string;
}

export function TopBar({ onLogout, onNavigate }: TopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const { isDark } = useTheme();

  // ==========================================
  // Load Current User Profile
  // ==========================================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to load user profile");
      }
    };

    fetchUser();

    // Listen for custom event from Profile.tsx to refresh data
    const handleProfileUpdate = () => fetchUser();
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // ==========================================
  // Handle Logout (Backend + Frontend)
  // ==========================================
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed");
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    onLogout();
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        backgroundColor: isDark ? '#161B22' : '#FFFFFF',
        borderBottom: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >

      {/* ================= SEARCH ================= */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: isDark ? '#484F58' : '#8C959F' }}
          />
          <input
            type="text"
            placeholder="Search logs or threats…"
            className="w-full rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none transition-colors"
            style={{
              backgroundColor: isDark ? '#0D1117' : '#F6F8FA',
              border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`,
              color: isDark ? '#C9D1D9' : '#1F2328',
            }}
          />
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex items-center gap-3 ml-6">

        {/* Defense Status */}
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(63, 185, 80, 0.1)' : 'rgba(26, 127, 55, 0.08)',
            color: isDark ? '#3FB950' : '#1A7F37',
          }}
        >
          <Shield className="w-3 h-3" />
          <span className="font-medium">Active</span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded-lg transition-colors"
          style={{ color: isDark ? '#8B949E' : '#57606A' }}
          onClick={() => toast.info('System is operating normally. No pending alerts.')}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell className="w-[18px] h-[18px]" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#FF4D4D' }}
          ></span>
        </button>

        {/* Divider */}
        <div className="w-px h-6" style={{ backgroundColor: isDark ? '#30363D' : '#D0D7DE' }} />

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('profile')}>
            <Avatar className="w-7 h-7">
              <AvatarImage
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              />
              <AvatarFallback style={{ fontSize: '11px' }}>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <div
                className="text-sm font-medium leading-tight"
                style={{ color: isDark ? '#E6EDF3' : '#1F2328' }}
              >
                {user.full_name || user.username}
              </div>
              <div
                className="text-[10px] uppercase font-medium leading-tight"
                style={{ color: isDark ? '#8B949E' : '#57606A' }}
              >
                {user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1.5 h-8 px-2.5"
          style={{
            color: isDark ? '#F85149' : '#CF222E',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(248,81,73,0.1)' : 'rgba(207,34,46,0.06)'}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-medium">Logout</span>
        </Button>
      </div>
    </header>
  );
}
