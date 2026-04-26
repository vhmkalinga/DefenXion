import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { FileText, Download, TrendingUp, Shield, Clock } from 'lucide-react';

export function MobileReports() {
  return (
    <div className="p-4 space-y-6 pb-24 bg-[#0D1117] min-h-screen">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[#E6EDF3]"
      >
        Reports
      </motion.h2>

      {/* Time Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="text-[#C9D1D9] text-sm mb-2 block">Time Range</label>
        <Select defaultValue="24h">
          <SelectTrigger className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161B22] border-[#30363D]">
            <SelectItem value="24h" className="text-[#E6EDF3]">Last 24 hours</SelectItem>
            <SelectItem value="7d" className="text-[#E6EDF3]">Last 7 days</SelectItem>
            <SelectItem value="30d" className="text-[#E6EDF3]">Last 30 days</SelectItem>
            <SelectItem value="90d" className="text-[#E6EDF3]">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-[#E6EDF3]">Summary</h3>

        <div className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#FF4D4D]/10 rounded-xl">
              <Shield className="w-6 h-6 text-[#FF4D4D]" />
            </div>
            <TrendingUp className="w-5 h-5 text-[#3FB950]" />
          </div>
          <div className="text-[#7D8590] mb-1">Total Threats</div>
          <div className="text-[#E6EDF3]">2,847</div>
          <div className="text-[#3FB950] text-xs mt-2">+12.5% from last period</div>
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#FFA657]/10 rounded-xl">
              <FileText className="w-6 h-6 text-[#FFA657]" />
            </div>
          </div>
          <div className="text-[#7D8590] mb-1">Top Source</div>
          <div className="text-[#E6EDF3] font-mono text-sm mb-1">192.168.1.45</div>
          <div className="text-[#58A6FF] text-xs">234 attacks detected</div>
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#58A6FF]/10 rounded-xl">
              <Clock className="w-6 h-6 text-[#58A6FF]" />
            </div>
            <TrendingUp className="w-5 h-5 text-[#3FB950] rotate-180" />
          </div>
          <div className="text-[#7D8590] mb-1">Avg Response Time</div>
          <div className="text-[#E6EDF3]">0.23s</div>
          <div className="text-[#3FB950] text-xs mt-2">-8.2% faster than before</div>
        </div>
      </motion.div>

      {/* Threat Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-[#E6EDF3]">Threat Breakdown</h3>

        <div className="bg-[#1E232B] rounded-2xl p-5 border border-[#30363D]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FF4D4D]"></div>
                <span className="text-[#C9D1D9] text-sm">DDoS Attacks</span>
              </div>
              <span className="text-[#E6EDF3]">856</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FFA657]"></div>
                <span className="text-[#C9D1D9] text-sm">Malware</span>
              </div>
              <span className="text-[#E6EDF3]">623</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#58A6FF]"></div>
                <span className="text-[#C9D1D9] text-sm">Phishing</span>
              </div>
              <span className="text-[#E6EDF3]">547</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#1F6FEB]"></div>
                <span className="text-[#C9D1D9] text-sm">SQL Injection</span>
              </div>
              <span className="text-[#E6EDF3]">456</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#3FB950]"></div>
                <span className="text-[#C9D1D9] text-sm">Other</span>
              </div>
              <span className="text-[#E6EDF3]">365</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Generate Report Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          className="w-full bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 gap-2 py-6"
          onClick={() => {
            toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
              loading: 'Generating comprehensive mobile report...',
              success: 'Report generated successfully!',
              error: 'Failed to generate report'
            });
          }}
        >
          <Download className="w-5 h-5" />
          <span>Generate PDF Report</span>
        </Button>
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <h3 className="text-[#E6EDF3]">Recent Reports</h3>

        <div className="space-y-2">
          <div className="bg-[#1E232B] rounded-xl p-4 border border-[#30363D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#58A6FF]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#58A6FF]" />
              </div>
              <div>
                <div className="text-[#E6EDF3] text-sm">Weekly Summary</div>
                <div className="text-[#7D8590] text-xs">Oct 14 - Oct 21</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#58A6FF]"
              onClick={() => {
                toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                  loading: 'Preparing PDF download...',
                  success: 'PDF downloaded!',
                  error: 'Failed to prepare PDF'
                });
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-[#1E232B] rounded-xl p-4 border border-[#30363D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#58A6FF]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#58A6FF]" />
              </div>
              <div>
                <div className="text-[#E6EDF3] text-sm">Monthly Report</div>
                <div className="text-[#7D8590] text-xs">September 2025</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#58A6FF]"
              onClick={() => {
                toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                  loading: 'Preparing PDF download...',
                  success: 'PDF downloaded!',
                  error: 'Failed to prepare PDF'
                });
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
