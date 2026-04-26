import { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";

import { Toaster } from "./components/ui/sonner";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatCard } from "./components/StatCard";
import { AnalyticsSection } from "./components/AnalyticsSection";
import { RecentAlertsTable } from "./components/RecentAlertsTable";

import { MobileNav } from "./components/MobileNav";
import { MobileHome } from "./components/MobileHome";
import { MobileAlerts } from "./components/MobileAlerts";
import { MobileAnalytics } from "./components/MobileAnalytics";
import { MobileReports } from "./components/MobileReports";
import { MobileSettings } from "./components/MobileSettings";

import { LiveAnalytics } from "./components/pages/LiveAnalytics";
import { DetectedThreats } from "./components/pages/DetectedThreats";
import { AIModel } from "./components/pages/AIModel";
import { ActiveDefense } from "./components/pages/ActiveDefense";
import { ReportsLogs } from "./components/pages/ReportsLogs";
import { Settings } from "./components/pages/Settings";
import { Profile } from "./components/pages/Profile";

import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { MobileLogin } from "./components/auth/MobileLogin";

import { ThreatNotificationSystem } from "./components/ThreatNotificationSystem";
import { getDashboardStats } from "./services/api";
import { useTheme } from "./context/ThemeContext";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup" | "forgot">("login");
  const [activeItem, setActiveItem] = useState("dashboard");
  const [mobileTab, setMobileTab] = useState("home");
  const [isMobile, setIsMobile] = useState(false);
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    total_attacks: 2847,
    high_severity: 127,
    avg_detection_time: "0.23s",
    auto_responses: 1934
  });

  useEffect(() => {
    if (isAuthenticated) {
      getDashboardStats().then(data => {
        if (data) setStats(data);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  // =========================
  // Detect Mobile Screen
  // =========================
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // =========================
  // Check Token On Load
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setAuthView("login");
  };

  // =========================
  // AUTHENTICATION SECTION
  // =========================
  if (!isAuthenticated) {
    if (isMobile) {
      return (
        <MobileLogin
          onLogin={() => setIsAuthenticated(true)}
          onSwitchToSignup={() => setAuthView("signup")}
        />
      );
    }

    if (authView === "login") {
      return (
        <Login
          onLogin={() => setIsAuthenticated(true)}
          onSwitchToSignup={() => setAuthView("signup")}
          onForgotPassword={() => setAuthView("forgot")}
        />
      );
    }

    if (authView === "signup") {
      return (
        <Signup
          onSignup={() => setIsAuthenticated(true)}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }

    if (authView === "forgot") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D1117] text-[#E6EDF3]">
          <div className="bg-[#161B22] p-8 rounded-xl border border-[#30363D] text-center">
            <h2 className="text-xl mb-4">Reset Password</h2>
            <p className="text-[#7D8590] mb-6">
              Password reset feature coming soon.
            </p>
            <button
              className="text-[#58A6FF]"
              onClick={() => setAuthView("login")}
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }
  }

  // =========================
  // MOBILE UI
  // =========================
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-[#0D1117]">
          {mobileTab === "home" && (
            <MobileHome onNavigate={setMobileTab} />
          )}
          {mobileTab === "alerts" && <MobileAlerts />}
          {mobileTab === "analytics" && <MobileAnalytics />}
          {mobileTab === "reports" && <MobileReports />}
          {mobileTab === "settings" && (
            <MobileSettings onLogout={handleLogout} />
          )}

          <MobileNav
            activeTab={mobileTab}
            onTabClick={setMobileTab}
          />
        </div>

        <ThreatNotificationSystem />
        <Toaster position="bottom-right" />
      </>
    );
  }

  // =========================
  // DESKTOP PAGE RENDERER
  // =========================
  const renderPage = () => {
    switch (activeItem) {
      case "analytics":
        return <LiveAnalytics />;
      case "threats":
        return <DetectedThreats />;
      case "model":
        return <AIModel />;
      case "defense":
        return <ActiveDefense />;
      case "reports":
        return <ReportsLogs />;
      case "settings":
        return <Settings onLogout={handleLogout} />;
      case "profile":
        return <Profile />;
      default:
        return (
          <div className="p-8 max-w-[1400px] mx-auto">
            <h2 className="text-xl font-semibold mb-6" style={{ color: isDark ? '#E6EDF3' : '#1F2328' }}>
              Dashboard Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Attacks Detected"
                value={stats.total_attacks.toLocaleString()}
                change="+12.5%"
                icon={<Shield className="w-5 h-5" />}
              />
              <StatCard
                title="High Severity Threats"
                value={stats.high_severity.toLocaleString()}
                change="+8.3%"
                icon={<AlertTriangle className="w-5 h-5" />}
              />
              <StatCard
                title="Avg Detection Time"
                value={stats.avg_detection_time}
                change="-8.2%"
                icon={<Clock className="w-5 h-5" />}
              />
              <StatCard
                title="Auto Responses Executed"
                value={stats.auto_responses.toLocaleString()}
                change="+15.7%"
                icon={<Zap className="w-5 h-5" />}
              />
            </div>

            <div className="mb-8">
              <AnalyticsSection />
            </div>

            <div className="mb-8">
              <RecentAlertsTable />
            </div>

            <footer className="text-center text-xs py-6 mt-6" style={{ color: isDark ? '#484F58' : '#8C959F', borderTop: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}` }}>
              DefenXion © 2026 — Intelligent Defense System
            </footer>
          </div>
        );
    }
  };

  // =========================
  // DESKTOP UI
  // =========================
  return (
    <>
      <div className="min-h-screen flex" style={{ backgroundColor: isDark ? '#0D1117' : '#F0F3F6' }}>
        <Sidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
        />

        <div className="flex-1 flex flex-col">
          <TopBar onLogout={handleLogout} onNavigate={setActiveItem} />

          <main className="flex-1 overflow-auto" style={{ backgroundColor: isDark ? '#0D1117' : '#F0F3F6' }}>
            {renderPage()}
          </main>
        </div>
      </div>

      <ThreatNotificationSystem />
      <Toaster position="bottom-right" />
    </>
  );
}
