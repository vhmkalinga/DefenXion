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
import { MobileLogin } from "./components/auth/MobileLogin";

import { ThreatNotificationSystem } from "./components/ThreatNotificationSystem";
import { SecurityCopilot } from "./components/SecurityCopilot";
import { getDashboardStats } from "./services/api";
import { useTheme } from "./context/ThemeContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";

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
    auto_responses: 1934,
    changes: {
      total_attacks: "+12.5%",
      high_severity: "+8.3%",
      avg_detection_time: "-8.2%",
      auto_responses: "+15.7%"
    }
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = () => {
      getDashboardStats().then(data => {
        if (data && data.total_attacks !== undefined) {
          setStats(data);
        }
      }).catch(console.error);
    };

    fetchStats(); // fetch immediately
    const interval = setInterval(fetchStats, 5000); // refresh every 5s
    return () => clearInterval(interval);
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
  // Copilot Navigation
  // =========================
  useEffect(() => {
    const handleCopilotNav = (e: Event) => {
      const page = (e as CustomEvent).detail as string;
      // page is a key like "threats", "reports", "defense", "settings", "model", "analytics"
      const validPages = ["threats", "reports", "defense", "settings", "model", "analytics", "profile", "dashboard"];
      if (validPages.includes(page)) {
        setActiveItem(page);
      }
    };
    window.addEventListener('copilot-navigate', handleCopilotNav);
    return () => window.removeEventListener('copilot-navigate', handleCopilotNav);
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
        />
      );
    }

    return (
      <Login
        onLogin={() => setIsAuthenticated(true)}
      />
    );
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
        <SecurityCopilot />
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
        return <Settings />;
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
                change={stats.changes.total_attacks}
                icon={<Shield className="w-5 h-5" />}
              />
              <StatCard
                title="High Severity Threats"
                value={stats.high_severity.toLocaleString()}
                change={stats.changes.high_severity}
                icon={<AlertTriangle className="w-5 h-5" />}
              />
              <StatCard
                title="Avg Detection Time"
                value={stats.avg_detection_time}
                change={stats.changes.avg_detection_time}
                icon={<Clock className="w-5 h-5" />}
              />
              <StatCard
                title="Auto Responses Executed"
                value={stats.auto_responses.toLocaleString()}
                change={stats.changes.auto_responses}
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
    <AnalyticsProvider>
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
      <SecurityCopilot />
      <Toaster position="bottom-right" />
    </AnalyticsProvider>
  );
}
