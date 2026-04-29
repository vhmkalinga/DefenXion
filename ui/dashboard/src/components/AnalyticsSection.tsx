import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import AttackSourceMap from './AttackSourceMap';
import { useTheme } from '../context/ThemeContext';
import { useAnalytics } from '../context/AnalyticsContext';

export function AnalyticsSection() {
  const { isDark } = useTheme();
  const { trafficHistory, topSources, isLoaded } = useAnalytics();

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
  const subColor = isDark ? '#7D8590' : '#57606A';
  const loadingColor = isDark ? '#7D8590' : '#57606A';

  const tooltipStyle = {
    backgroundColor: isDark ? '#161B22' : '#FFFFFF',
    border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`,
    borderRadius: '8px',
    color: isDark ? '#E6EDF3' : '#1F2328',
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
  };

  const placeholder = (msg: string) => (
    <div className="flex items-center justify-center h-[280px] text-sm animate-pulse" style={{ color: loadingColor }}>
      {msg}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Threat Activity Timeseries */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="font-semibold text-[15px] mb-1" style={{ color: titleColor }}>
            Threat Activity (Last 20 min)
          </h3>
          <p className="text-xs mb-4" style={{ color: subColor }}>
            Real-time rolling window — threats detected &amp; blocked per minute
          </p>
          {!isLoaded
            ? placeholder('Loading data…')
            : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trafficHistory} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="threats-dash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="blocked-dash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3FB950" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="time" stroke={axisColor} fontSize={11}
                    label={{ value: 'Time (HH:MM)', position: 'insideBottom', offset: -10, fill: axisColor, fontSize: 11 }} />
                  <YAxis stroke={axisColor} fontSize={11} allowDecimals={false}
                    label={{ value: 'Events / min', angle: -90, position: 'insideLeft', offset: 15, fill: axisColor, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="threats" name="Threats" stroke="#FF4D4D" fillOpacity={1} fill="url(#threats-dash)" />
                  <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#3FB950" fillOpacity={1} fill="url(#blocked-dash)" />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Top Attacking IPs */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="font-semibold text-[15px] mb-1" style={{ color: titleColor }}>
            Top Attacking IPs
          </h3>
          <p className="text-xs mb-4" style={{ color: subColor }}>
            Source IPs that triggered block/alert actions from ML engine
          </p>
          {!isLoaded
            ? placeholder('Loading data…')
            : topSources.length > 0
              ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topSources} layout="vertical" margin={{ top: 10, right: 30, left: 85, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" stroke={axisColor} fontSize={11} allowDecimals={false}
                      label={{ value: 'Attack Count', position: 'insideBottom', offset: -10, fill: axisColor, fontSize: 11 }} />
                    <YAxis dataKey="ip" type="category" stroke={axisColor} width={80} tick={{ fontSize: 11 }}
                      label={{ value: 'Source IP', angle: -90, position: 'insideLeft', offset: -65, fill: axisColor, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="attacks" name="Attacks" fill="#FF4D4D" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
              : (
                <div className="flex items-center justify-center h-[280px] text-sm" style={{ color: subColor }}>
                  Run the Traffic Simulator (Mode 1) to populate attack data
                </div>
              )
          }
        </div>
      </div>

      <AttackSourceMap />
    </div>
  );
}
