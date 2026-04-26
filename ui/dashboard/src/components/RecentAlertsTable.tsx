import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';
import { ThreatAnalysisModal } from './ThreatAnalysisModal';
import { AnimatePresence } from 'motion/react';
import { getRecentAlerts } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const fallbackAlerts = [
  {
    id: 'THR-2025-001',
    time: '14:32:15',
    timestamp: '2025-10-21 14:32:15',
    type: 'DDoS Attack',
    severity: 'Critical',
    sourceIp: '192.168.1.45',
    targetPort: '443',
    confidence: 98,
    status: 'Blocked',
    details: 'Large-scale distributed denial of service attack detected from multiple sources. Attack vector: SYN flood.',
  }
];

export function RecentAlertsTable() {
  const [alerts, setAlerts] = useState<any[]>(fallbackAlerts);
  const [selectedThreat, setSelectedThreat] = useState<any | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      getRecentAlerts()
        .then(data => {
          if (data && data.length > 0) {
            setAlerts(data);
          }
        })
        .catch(err => console.error("Failed to fetch recent alerts", err));
    }
  }, []);

  const headColor = isDark ? '#8B949E' : '#57606A';
  const cellColor = isDark ? '#C9D1D9' : '#424A53';
  const cellPrimary = isDark ? '#E6EDF3' : '#1F2328';
  const borderColor = isDark ? '#21262D' : '#D8DEE4';
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const trackBg = isDark ? '#21262D' : '#E1E4E8';
  const barBg = isDark ? '#58A6FF' : '#0969DA';

  return (
    <>
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: isDark ? '#161B22' : '#FFFFFF',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <h3
          className="font-semibold text-[15px] mb-5"
          style={{ color: cellPrimary }}
        >
          Recent Alerts
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor }} className="hover:bg-transparent">
                <TableHead style={{ color: headColor }}>Time</TableHead>
                <TableHead style={{ color: headColor }}>Threat Type</TableHead>
                <TableHead style={{ color: headColor }}>Source IP</TableHead>
                <TableHead style={{ color: headColor }}>Confidence</TableHead>
                <TableHead style={{ color: headColor }}>Action</TableHead>
                <TableHead style={{ color: headColor }}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert, index) => (
                <TableRow
                  key={index}
                  style={{ borderColor }}
                  className="transition-colors"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <TableCell style={{ color: cellColor }}>{alert.time}</TableCell>
                  <TableCell className="font-medium" style={{ color: cellPrimary }}>{alert.type}</TableCell>
                  <TableCell className="font-mono text-sm" style={{ color: cellColor }}>{alert.sourceIp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full h-1.5 max-w-[60px]" style={{ backgroundColor: trackBg }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${alert.confidence}%`, backgroundColor: barBg }}
                        />
                      </div>
                      <span className="text-sm" style={{ color: cellColor }}>{alert.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${alert.status === 'Blocked'
                        ? 'border-[#FF4D4D] text-[#FF4D4D]'
                        : alert.status === 'Quarantined'
                          ? 'border-[#FFA657] text-[#FFA657]'
                          : 'border-[#58A6FF] text-[#58A6FF]'
                        }`}
                    >
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: isDark ? '#58A6FF' : '#0969DA' }}
                      onClick={() => setSelectedThreat(alert)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AnimatePresence>
        {selectedThreat && (
          <ThreatAnalysisModal
            threat={selectedThreat}
            onClose={() => setSelectedThreat(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
