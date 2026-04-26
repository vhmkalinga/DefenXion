import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import AttackSourceMap from './AttackSourceMap';
import { useTheme } from '../context/ThemeContext';

const threatData = [
  { time: '00:00', critical: 12, high: 25, medium: 45 },
  { time: '04:00', critical: 8, high: 18, medium: 32 },
  { time: '08:00', critical: 15, high: 35, medium: 58 },
  { time: '12:00', critical: 22, high: 42, medium: 67 },
  { time: '16:00', critical: 18, high: 38, medium: 52 },
  { time: '20:00', critical: 10, high: 28, medium: 41 },
];

const attackTypeData = [
  { type: 'DDoS', count: 156 },
  { type: 'Malware', count: 89 },
  { type: 'Phishing', count: 234 },
  { type: 'SQL Injection', count: 67 },
  { type: 'XSS', count: 123 },
];

export function AnalyticsSection() {
  const { isDark } = useTheme();

  const cardStyle = {
    backgroundColor: isDark ? '#161B22' : '#FFFFFF',
    border: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
    boxShadow: isDark
      ? '0 1px 3px rgba(0,0,0,0.3)'
      : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  };

  const axisColor = isDark ? '#484F58' : '#8C959F';
  const gridColor = isDark ? '#21262D' : '#E1E4E8';
  const titleColor = isDark ? '#E6EDF3' : '#1F2328';

  const tooltipStyle = {
    backgroundColor: isDark ? '#161B22' : '#FFFFFF',
    border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`,
    borderRadius: '8px',
    color: isDark ? '#E6EDF3' : '#1F2328',
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="font-semibold text-[15px] mb-5" style={{ color: titleColor }}>Threat Severity Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={threatData}>
              <defs>
                <linearGradient id="critical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="high" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFA657" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFA657" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" stroke={axisColor} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="critical" stroke="#FF4D4D" fillOpacity={1} fill="url(#critical)" />
              <Area type="monotone" dataKey="high" stroke="#FFA657" fillOpacity={1} fill="url(#high)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="font-semibold text-[15px] mb-5" style={{ color: titleColor }}>Attack Types Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attackTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="type" stroke={axisColor} angle={-15} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={isDark ? '#1F6FEB' : '#0969DA'} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AttackSourceMap />
    </div>
  );
}
