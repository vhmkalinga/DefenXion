import { motion } from 'motion/react';
import { X, Shield, AlertTriangle, CheckCircle, XCircle, Clock, MapPin, Server, Activity, FileText, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

interface ThreatAnalysisModalProps {
  threat: {
    id: string;
    timestamp: string;
    type: string;
    severity: string;
    sourceIp: string;
    targetPort: string;
    confidence: number;
    status: string;
    details: string;
  };
  onClose: () => void;
}

const remediationSteps = [
  {
    step: 1,
    title: 'Immediate Isolation',
    description: 'Isolate affected systems from the network to prevent lateral movement',
    status: 'completed',
    icon: Shield,
  },
  {
    step: 2,
    title: 'Traffic Analysis',
    description: 'Analyze network traffic patterns to identify attack vectors',
    status: 'completed',
    icon: Activity,
  },
  {
    step: 3,
    title: 'Threat Containment',
    description: 'Apply firewall rules to block malicious IP addresses',
    status: 'completed',
    icon: CheckCircle,
  },
  {
    step: 4,
    title: 'System Scan',
    description: 'Run comprehensive malware scan on affected systems',
    status: 'in-progress',
    icon: FileText,
  },
  {
    step: 5,
    title: 'Patch Deployment',
    description: 'Deploy security patches to vulnerable systems',
    status: 'pending',
    icon: Zap,
  },
];

const attackTimeline = [
  { time: '14:30:12', event: 'Initial connection attempt detected', type: 'info' },
  { time: '14:30:45', event: 'Multiple failed authentication attempts', type: 'warning' },
  { time: '14:31:23', event: 'Brute force pattern identified', type: 'warning' },
  { time: '14:31:58', event: 'IP address blocked by firewall', type: 'success' },
  { time: '14:32:15', event: 'Threat neutralized - monitoring continues', type: 'success' },
];

export function ThreatAnalysisModal({ threat, onClose }: ThreatAnalysisModalProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return { bg: 'bg-[#FF4D4D]/10', border: 'border-[#FF4D4D]', text: 'text-[#FF4D4D]' };
      case 'High': return { bg: 'bg-[#FFA657]/10', border: 'border-[#FFA657]', text: 'text-[#FFA657]' };
      case 'Medium': return { bg: 'bg-[#58A6FF]/10', border: 'border-[#58A6FF]', text: 'text-[#58A6FF]' };
      default: return { bg: 'bg-[#7D8590]/10', border: 'border-[#7D8590]', text: 'text-[#7D8590]' };
    }
  };

  const colors = getSeverityColor(threat.severity);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className={`${colors.bg} border-b ${colors.border} p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${colors.bg} rounded-xl border ${colors.border}`}>
                <AlertTriangle className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div>
                <h2 className="text-[#E6EDF3] mb-1">Threat Analysis Report</h2>
                <p className="text-[#7D8590] text-sm font-mono">{threat.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#7D8590] hover:text-[#C9D1D9] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-[#7D8590] text-xs mb-1">Threat Type</div>
              <div className="text-[#E6EDF3]">{threat.type}</div>
            </div>
            <div>
              <div className="text-[#7D8590] text-xs mb-1">Severity</div>
              <Badge variant="outline" className={`${colors.border} ${colors.text}`}>
                {threat.severity}
              </Badge>
            </div>
            <div>
              <div className="text-[#7D8590] text-xs mb-1">Confidence</div>
              <div className="text-[#E6EDF3]">{threat.confidence}%</div>
            </div>
            <div>
              <div className="text-[#7D8590] text-xs mb-1">Status</div>
              <div className="text-[#3FB950]">{threat.status}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-[#0D1117] border border-[#30363D]">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="remediation" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">
                Remediation
              </TabsTrigger>
              <TabsTrigger value="technical" className="data-[state=active]:bg-[#1F6FEB] data-[state=active]:text-white">
                Technical Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="bg-[#0D1117] rounded-xl p-5 border border-[#30363D]">
                <h3 className="text-[#E6EDF3] mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#FFA657]" />
                  Threat Summary
                </h3>
                <p className="text-[#C9D1D9] leading-relaxed mb-4">
                  {threat.details}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-[#161B22] rounded-lg border border-[#30363D]">
                    <MapPin className="w-5 h-5 text-[#58A6FF]" />
                    <div>
                      <div className="text-[#7D8590] text-xs">Source IP</div>
                      <div className="text-[#E6EDF3] font-mono">{threat.sourceIp}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#161B22] rounded-lg border border-[#30363D]">
                    <Server className="w-5 h-5 text-[#58A6FF]" />
                    <div>
                      <div className="text-[#7D8590] text-xs">Target Port</div>
                      <div className="text-[#E6EDF3] font-mono">{threat.targetPort}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0D1117] rounded-xl p-5 border border-[#30363D]">
                <h3 className="text-[#E6EDF3] mb-4">Risk Assessment</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#C9D1D9] text-sm">Threat Level</span>
                      <span className={`text-sm ${colors.text}`}>{threat.confidence}%</span>
                    </div>
                    <Progress value={threat.confidence} className="h-2 bg-[#30363D]" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#C9D1D9] text-sm">Impact Severity</span>
                      <span className="text-[#FFA657] text-sm">High</span>
                    </div>
                    <Progress value={85} className="h-2 bg-[#30363D]" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#C9D1D9] text-sm">Spread Potential</span>
                      <span className="text-[#58A6FF] text-sm">Medium</span>
                    </div>
                    <Progress value={60} className="h-2 bg-[#30363D]" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-3">
              {attackTimeline.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      event.type === 'success' ? 'bg-[#3FB950]' :
                      event.type === 'warning' ? 'bg-[#FFA657]' :
                      'bg-[#58A6FF]'
                    }`} />
                    {index < attackTimeline.length - 1 && (
                      <div className="w-0.5 h-full bg-[#30363D] mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-[#7D8590]" />
                      <span className="text-[#7D8590] text-sm font-mono">{event.time}</span>
                    </div>
                    <p className="text-[#C9D1D9]">{event.event}</p>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="remediation" className="space-y-4">
              <div className="bg-[#0D1117] rounded-xl p-5 border border-[#30363D]">
                <h3 className="text-[#E6EDF3] mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#3FB950]" />
                  Automated Response Actions
                </h3>
                <div className="space-y-3">
                  {remediationSteps.map((step) => (
                    <div key={step.step} className="flex items-start gap-4 p-4 bg-[#161B22] rounded-lg border border-[#30363D]">
                      <div className={`p-2 rounded-lg ${
                        step.status === 'completed' ? 'bg-[#3FB950]/10' :
                        step.status === 'in-progress' ? 'bg-[#58A6FF]/10' :
                        'bg-[#7D8590]/10'
                      }`}>
                        <step.icon className={`w-5 h-5 ${
                          step.status === 'completed' ? 'text-[#3FB950]' :
                          step.status === 'in-progress' ? 'text-[#58A6FF]' :
                          'text-[#7D8590]'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[#E6EDF3]">Step {step.step}: {step.title}</h4>
                          {step.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-[#3FB950]" />
                          )}
                          {step.status === 'in-progress' && (
                            <Activity className="w-5 h-5 text-[#58A6FF] animate-pulse" />
                          )}
                          {step.status === 'pending' && (
                            <Clock className="w-5 h-5 text-[#7D8590]" />
                          )}
                        </div>
                        <p className="text-[#7D8590] text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FFA657]/10 rounded-xl p-4 border border-[#FFA657]/30">
                <h4 className="text-[#E6EDF3] mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#FFA657]" />
                  Recommended Actions
                </h4>
                <ul className="space-y-2 text-[#C9D1D9] text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFA657] mt-1">•</span>
                    Monitor network traffic for 24 hours for similar patterns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFA657] mt-1">•</span>
                    Update firewall rules to prevent future attacks from this vector
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFA657] mt-1">•</span>
                    Review and strengthen authentication mechanisms
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFA657] mt-1">•</span>
                    Conduct security awareness training for team members
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="bg-[#0D1117] rounded-xl p-5 border border-[#30363D]">
                <h3 className="text-[#E6EDF3] mb-4">Network Information</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between py-2 border-b border-[#30363D]">
                    <span className="text-[#7D8590]">Source IP:</span>
                    <span className="text-[#E6EDF3]">{threat.sourceIp}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#30363D]">
                    <span className="text-[#7D8590]">Target Port:</span>
                    <span className="text-[#E6EDF3]">{threat.targetPort}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#30363D]">
                    <span className="text-[#7D8590]">Protocol:</span>
                    <span className="text-[#E6EDF3]">TCP/IP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#30363D]">
                    <span className="text-[#7D8590]">Geo Location:</span>
                    <span className="text-[#E6EDF3]">Unknown</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#7D8590]">Attack Signature:</span>
                    <span className="text-[#E6EDF3]">SHA256:a3f5...</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0D1117] rounded-xl p-5 border border-[#30363D]">
                <h3 className="text-[#E6EDF3] mb-4">Packet Analysis</h3>
                <div className="bg-[#161B22] rounded-lg p-4 border border-[#30363D] overflow-x-auto">
                  <pre className="text-[#C9D1D9] text-xs">
{`GET /api/login HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Content-Type: application/x-www-form-urlencoded

username=admin' OR '1'='1&password=test`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-[#30363D] p-6 flex justify-between items-center bg-[#0D1117]">
          <div className="text-[#7D8590] text-sm">
            Detected at {threat.timestamp}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-[#30363D] text-[#E6EDF3]">
              Download Report
            </Button>
            <Button className="bg-[#1F6FEB] hover:bg-[#1F6FEB]/90">
              Mark as Resolved
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
