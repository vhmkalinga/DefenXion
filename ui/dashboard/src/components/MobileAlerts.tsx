import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, MapPin, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const alerts = [
  { 
    id: 'THR-001',
    severity: 'critical',
    type: 'DDoS Attack',
    sourceIp: '192.168.1.45',
    confidence: 98,
    time: '2 min ago',
    description: 'Large-scale distributed denial of service attack detected from multiple sources.',
    targetPort: '443',
    status: 'Blocked'
  },
  { 
    id: 'THR-002',
    severity: 'high',
    type: 'SQL Injection',
    sourceIp: '203.45.67.89',
    confidence: 95,
    time: '5 min ago',
    description: 'SQL injection attempt detected in login form with DROP TABLE commands.',
    targetPort: '3306',
    status: 'Blocked'
  },
  { 
    id: 'THR-003',
    severity: 'critical',
    type: 'Malware Detection',
    sourceIp: '172.16.0.123',
    confidence: 92,
    time: '8 min ago',
    description: 'Trojan detected in uploaded file matching known ransomware signature.',
    targetPort: '80',
    status: 'Quarantined'
  },
  { 
    id: 'THR-004',
    severity: 'medium',
    type: 'Phishing Attempt',
    sourceIp: '10.0.0.56',
    confidence: 88,
    time: '12 min ago',
    description: 'Phishing email detected with malicious links impersonating banking institution.',
    targetPort: '25',
    status: 'Flagged'
  },
  { 
    id: 'THR-005',
    severity: 'high',
    type: 'XSS Attack',
    sourceIp: '198.51.100.42',
    confidence: 96,
    time: '15 min ago',
    description: 'Cross-site scripting attempt detected in search parameter.',
    targetPort: '443',
    status: 'Blocked'
  },
];

export function MobileAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<typeof alerts[0] | null>(null);

  return (
    <>
      <div className="p-4 space-y-4 pb-24 bg-[#0D1117] min-h-screen">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#E6EDF3]"
        >
          Active Alerts
        </motion.h2>
        
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-2xl p-4 border cursor-pointer transition-all hover:scale-[1.02] ${
              alert.severity === 'critical' 
                ? 'bg-[#FF4D4D]/10 border-[#FF4D4D]/30' 
                : alert.severity === 'high'
                ? 'bg-[#FFA657]/10 border-[#FFA657]/30'
                : 'bg-[#58A6FF]/10 border-[#58A6FF]/30'
            }`}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.severity === 'critical' 
                    ? 'bg-[#FF4D4D]/20' 
                    : alert.severity === 'high'
                    ? 'bg-[#FFA657]/20'
                    : 'bg-[#58A6FF]/20'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.severity === 'critical' 
                      ? 'text-[#FF4D4D]' 
                      : alert.severity === 'high'
                      ? 'text-[#FFA657]'
                      : 'text-[#58A6FF]'
                  }`} />
                </div>
                <div>
                  <h3 className="text-[#E6EDF3] mb-1">{alert.type}</h3>
                  <div className="flex items-center gap-2 text-[#7D8590] text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{alert.time}</span>
                  </div>
                </div>
              </div>
              <Badge className={`text-xs px-2 py-1 uppercase ${
                alert.severity === 'critical'
                  ? 'bg-[#FF4D4D] text-white border-0'
                  : alert.severity === 'high'
                  ? 'bg-[#FFA657] text-white border-0'
                  : 'bg-[#58A6FF] text-white border-0'
              }`}>
                {alert.severity}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#7D8590]">Source IP</span>
                <span className="text-[#C9D1D9] font-mono text-xs">{alert.sourceIp}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7D8590]">Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#30363D] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#58A6FF] rounded-full"
                      style={{ width: `${alert.confidence}%` }}
                    />
                  </div>
                  <span className="text-[#C9D1D9] text-xs">{alert.confidence}%</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-[#1F6FEB] hover:bg-[#1F6FEB]/90 text-white" 
              size="sm"
            >
              View Details
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#161B22] rounded-t-3xl md:rounded-2xl border border-[#30363D] w-full md:max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className={`p-6 border-b ${
                selectedAlert.severity === 'critical' 
                  ? 'border-[#FF4D4D]/30 bg-[#FF4D4D]/5' 
                  : selectedAlert.severity === 'high'
                  ? 'border-[#FFA657]/30 bg-[#FFA657]/5'
                  : 'border-[#58A6FF]/30 bg-[#58A6FF]/5'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${
                      selectedAlert.severity === 'critical' 
                        ? 'bg-[#FF4D4D]/20' 
                        : selectedAlert.severity === 'high'
                        ? 'bg-[#FFA657]/20'
                        : 'bg-[#58A6FF]/20'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        selectedAlert.severity === 'critical' 
                          ? 'text-[#FF4D4D]' 
                          : selectedAlert.severity === 'high'
                          ? 'text-[#FFA657]'
                          : 'text-[#58A6FF]'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-[#E6EDF3] mb-1">{selectedAlert.type}</h3>
                      <p className="text-[#7D8590] text-sm font-mono">{selectedAlert.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-[#7D8590] hover:text-[#C9D1D9]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[#E6EDF3] mb-3">Threat Details</h4>
                  <p className="text-[#C9D1D9] text-sm leading-relaxed">{selectedAlert.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-[#30363D]">
                    <span className="text-[#7D8590] text-sm">Source IP</span>
                    <span className="text-[#E6EDF3] font-mono text-sm">{selectedAlert.sourceIp}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#30363D]">
                    <span className="text-[#7D8590] text-sm">Target Port</span>
                    <span className="text-[#E6EDF3] font-mono text-sm">{selectedAlert.targetPort}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#30363D]">
                    <span className="text-[#7D8590] text-sm">Confidence</span>
                    <span className="text-[#E6EDF3] text-sm">{selectedAlert.confidence}%</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#30363D]">
                    <span className="text-[#7D8590] text-sm">Status</span>
                    <Badge variant="outline" className="border-[#3FB950] text-[#3FB950]">
                      {selectedAlert.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[#7D8590] text-sm">Detected</span>
                    <span className="text-[#E6EDF3] text-sm">{selectedAlert.time}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-[#30363D] text-[#E6EDF3]">
                    Download Report
                  </Button>
                  <Button className="flex-1 bg-[#1F6FEB] hover:bg-[#1F6FEB]/90">
                    Take Action
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
