import { Shield, BarChart3, Settings as SettingsIcon, Zap, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';

interface MobileHomeProps {
  onNavigate?: (tab: string) => void;
}

export function MobileHome({ onNavigate }: MobileHomeProps) {
  return (
    <div className="p-4 space-y-6 pb-24 bg-[#0D1117] min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-[#E6EDF3]">CyberGuard AI</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3FB950]/10 rounded-full border border-[#3FB950]/30">
          <span className="w-2 h-2 bg-[#3FB950] rounded-full animate-pulse"></span>
          <span className="text-[#3FB950]">Active</span>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#FF4D4D]/10 rounded-xl">
              <Shield className="w-6 h-6 text-[#FF4D4D]" />
            </div>
            <span className="text-xs px-2 py-1 bg-[#3FB950]/10 text-[#3FB950] rounded-full">
              +12.5%
            </span>
          </div>
          <div className="text-[#C9D1D9]">Total Attacks Detected</div>
          <div className="text-[#E6EDF3] mt-1">2,847</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#58A6FF]/10 rounded-xl">
              <Activity className="w-6 h-6 text-[#58A6FF]" />
            </div>
            <span className="text-xs px-2 py-1 bg-[#3FB950]/10 text-[#3FB950] rounded-full">
              -8.2%
            </span>
          </div>
          <div className="text-[#C9D1D9]">Avg Detection Time</div>
          <div className="text-[#E6EDF3] mt-1">0.23s</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#FFA657]/10 rounded-xl">
              <Zap className="w-6 h-6 text-[#FFA657]" />
            </div>
            <span className="text-xs px-2 py-1 bg-[#3FB950]/10 text-[#3FB950] rounded-full">
              +15.7%
            </span>
          </div>
          <div className="text-[#C9D1D9]">Auto Responses Executed</div>
          <div className="text-[#E6EDF3] mt-1">1,934</div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-[#E6EDF3]">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={() => onNavigate?.('defense')}
            className="flex flex-col h-auto py-5 gap-2 bg-[#1E232B] hover:bg-[#1F6FEB] border border-[#30363D] transition-all"
          >
            <Shield className="w-6 h-6 text-[#58A6FF]" />
            <span className="text-xs text-[#C9D1D9]">Defense</span>
          </Button>
          <Button 
            onClick={() => onNavigate?.('analytics')}
            className="flex flex-col h-auto py-5 gap-2 bg-[#1E232B] hover:bg-[#1F6FEB] border border-[#30363D] transition-all"
          >
            <BarChart3 className="w-6 h-6 text-[#58A6FF]" />
            <span className="text-xs text-[#C9D1D9]">Analytics</span>
          </Button>
          <Button 
            onClick={() => onNavigate?.('settings')}
            className="flex flex-col h-auto py-5 gap-2 bg-[#1E232B] hover:bg-[#1F6FEB] border border-[#30363D] transition-all"
          >
            <SettingsIcon className="w-6 h-6 text-[#58A6FF]" />
            <span className="text-xs text-[#C9D1D9]">Settings</span>
          </Button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[#E6EDF3]">Recent Activity</h3>
          <button className="text-[#58A6FF] text-sm">View All</button>
        </div>
        <div className="space-y-2">
          <div className="bg-[#1E232B] rounded-xl p-3 border border-[#30363D] flex items-center gap-3">
            <div className="w-2 h-2 bg-[#FF4D4D] rounded-full"></div>
            <div className="flex-1">
              <div className="text-[#E6EDF3] text-sm">DDoS Attack Blocked</div>
              <div className="text-[#7D8590] text-xs">2 minutes ago</div>
            </div>
          </div>
          <div className="bg-[#1E232B] rounded-xl p-3 border border-[#30363D] flex items-center gap-3">
            <div className="w-2 h-2 bg-[#FFA657] rounded-full"></div>
            <div className="flex-1">
              <div className="text-[#E6EDF3] text-sm">SQL Injection Prevented</div>
              <div className="text-[#7D8590] text-xs">5 minutes ago</div>
            </div>
          </div>
          <div className="bg-[#1E232B] rounded-xl p-3 border border-[#30363D] flex items-center gap-3">
            <div className="w-2 h-2 bg-[#3FB950] rounded-full"></div>
            <div className="flex-1">
              <div className="text-[#E6EDF3] text-sm">System Backup Complete</div>
              <div className="text-[#7D8590] text-xs">1 hour ago</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
