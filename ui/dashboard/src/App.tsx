import { useState, useEffect } from "react";

import { Toaster } from "./components/ui/sonner";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";

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
import { DashboardOverview } from "./components/pages/DashboardOverview";

import { Login } from "./components/auth/Login";
import { MobileLogin } from "./components/auth/MobileLogin";

import { ThreatNotificationSystem } from "./components/ThreatNotificationSystem";
import { SecurityCopilot } from "./components/SecurityCopilot";
import { useTheme } from "./context/ThemeContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [mobileTab, setMobileTab] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const toggleSidebar = () => setSidebarCollapsed(p => { const v = !p; localStorage.setItem('sidebar_collapsed', String(v)); return v; });
  const [isMobile, setIsMobile] = useState(false);
  const { isDark } = useTheme();
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
        return <DashboardOverview onNavigate={setActiveItem} />;
    }
  };

  // =========================
  // DESKTOP UI
  // =========================
  return (
    <AnalyticsProvider>
      <div style={{ minHeight:'100vh', display:'flex', backgroundColor:'#0D1117' }}>
        <Sidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />

        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, transition:'margin-left 0.25s ease' }}>
          <TopBar onLogout={handleLogout} onNavigate={setActiveItem} />

          <main style={{ flex:1, overflowY:'auto', backgroundColor:'#0D1117' }}>
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
