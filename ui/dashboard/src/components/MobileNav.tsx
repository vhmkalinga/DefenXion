import { Home, AlertTriangle, BarChart3, FileText, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileNavProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ activeTab, onTabClick }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#161B22] border-t border-[#30363D] px-2 py-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-[#1F6FEB]'
                : 'text-[#7D8590]'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#1F6FEB]/10 rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon className={`w-5 h-5 relative z-10 ${
              activeTab === tab.id ? 'scale-110' : ''
            } transition-transform`} />
            <span className={`text-xs relative z-10 ${
              activeTab === tab.id ? '' : ''
            }`}>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1F6FEB] rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
