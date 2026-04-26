import { motion } from "motion/react";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import {
  Bell,
  RefreshCw,
  Users,
  Shield,
  Lock,
  Moon,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface MobileSettingsProps {
  onLogout: () => void;
}

export function MobileSettings({ onLogout }: MobileSettingsProps) {
  return (
    <div className="p-4 space-y-6 pb-24 bg-[#0D1117] min-h-screen">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[#E6EDF3]"
      >
        Settings
      </motion.h2>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]"
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-[#E6EDF3]">Admin User</div>
            <div className="text-[#7D8590] text-sm">
              admin@defenxion.ai
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#7D8590]" />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-[#E6EDF3]">Notifications</h3>

        <div className="bg-[#1E232B] rounded-2xl border border-[#30363D] divide-y divide-[#30363D]">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#FF4D4D]" />
              <div>
                <div className="text-[#E6EDF3] text-sm">
                  Critical Threats
                </div>
                <div className="text-[#7D8590] text-xs">
                  Instant notifications
                </div>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#FFA657]" />
              <div>
                <div className="text-[#E6EDF3] text-sm">
                  System Alerts
                </div>
                <div className="text-[#7D8590] text-xs">
                  Important updates
                </div>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </motion.div>

      {/* System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-[#E6EDF3]">System</h3>

        <div className="bg-[#1E232B] rounded-2xl border border-[#30363D] divide-y divide-[#30363D]">
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-[#161B22] transition-colors"
            onClick={() => toast.success('Data synchronized successfully.')}
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[#3FB950]" />
              <div className="text-left">
                <div className="text-[#E6EDF3] text-sm">
                  Sync Data
                </div>
                <div className="text-[#7D8590] text-xs">
                  Last synced 5 min ago
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#7D8590]" />
          </button>

          <button
            className="w-full p-4 flex items-center justify-between hover:bg-[#161B22] transition-colors"
            onClick={() => toast.info('User management requires desktop access.')}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#58A6FF]" />
              <div className="text-left">
                <div className="text-[#E6EDF3] text-sm">
                  Manage Users
                </div>
                <div className="text-[#7D8590] text-xs">
                  Team & permissions
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#7D8590]" />
          </button>
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant="outline"
          onClick={onLogout}
          className="w-full border-[#FF4D4D] text-[#FF4D4D] hover:bg-[#FF4D4D]/10 py-6"
        >
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
}
