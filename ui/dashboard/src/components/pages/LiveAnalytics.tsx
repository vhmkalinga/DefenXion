import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { StatCard } from '../StatCard';
import { useAnalytics } from '../../context/AnalyticsContext';

export function LiveAnalytics() {
  const { trafficHistory, portBreakdown, topSources, stats, isLoaded } = useAnalytics();

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#E6EDF3]">Live Analytics</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3FB950]/10 rounded-full">
          <div className="w-2 h-2 bg-[#3FB950] rounded-full animate-pulse"></div>
          <span className="text-[#3FB950] text-sm">Live Monitoring</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Threats (Last 20 min)" value={stats.activeThreats.toString()} icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard title="Blocked (Last 20 min)" value={stats.blockedToday.toString()} icon={<Shield className="w-5 h-5" />} />
        <StatCard title="Total Events (Last 20 min)" value={stats.totalConnections.toString()} icon={<Activity className="w-5 h-5" />} />
        <StatCard title="System Uptime" value={stats.uptime} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-1">Real-Time Threat Detection</h3>
          <p className="text-[#7D8590] text-xs mb-4">Live 20-minute rolling window from database</p>
          {!isLoaded ? (
            <div className="flex items-center justify-center h-[280px] text-[#7D8590] text-sm animate-pulse">Loading data…</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trafficHistory} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="threats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3FB950" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="time" stroke="#7D8590" tick={{ fontSize: 11 }}
                  label={{ value: 'Time (HH:MM)', position: 'insideBottom', offset: -10, fill: '#7D8590', fontSize: 11 }} />
                <YAxis stroke="#7D8590" allowDecimals={false}
                  label={{ value: 'Events / min', angle: -90, position: 'insideLeft', offset: 15, fill: '#7D8590', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px', color: '#E6EDF3' }} />
                <Area type="monotone" dataKey="threats" name="Threats" stroke="#FF4D4D" fillOpacity={1} fill="url(#threats)" />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#3FB950" fillOpacity={1} fill="url(#blocked)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-1">Network Events Timeline</h3>
          <p className="text-[#7D8590] text-xs mb-4">Total detections per minute (attacks + benign)</p>
          {!isLoaded ? (
            <div className="flex items-center justify-center h-[280px] text-[#7D8590] text-sm animate-pulse">Loading data…</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trafficHistory} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="time" stroke="#7D8590" tick={{ fontSize: 11 }}
                  label={{ value: 'Time (HH:MM)', position: 'insideBottom', offset: -10, fill: '#7D8590', fontSize: 11 }} />
                <YAxis stroke="#7D8590" allowDecimals={false}
                  label={{ value: 'Total Events / min', angle: -90, position: 'insideLeft', offset: 20, fill: '#7D8590', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px', color: '#E6EDF3' }} />
                <Line type="monotone" dataKey="traffic" name="Total Events" stroke="#1F6FEB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-1">Protocol Distribution</h3>
          <p className="text-[#7D8590] text-xs mb-4">From live captured device traffic</p>
          {!isLoaded ? (
            <div className="flex items-center justify-center h-[280px] text-[#7D8590] text-sm animate-pulse">Loading data…</div>
          ) : portBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={portBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="protocol" stroke="#7D8590"
                  label={{ value: 'Protocol', position: 'insideBottom', offset: -10, fill: '#7D8590', fontSize: 11 }} />
                <YAxis stroke="#7D8590" allowDecimals={false}
                  label={{ value: 'Connections', angle: -90, position: 'insideLeft', offset: 15, fill: '#7D8590', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px', color: '#E6EDF3' }} />
                <Bar dataKey="connections" name="Connections" fill="#1F6FEB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-[#7D8590] text-sm">
              Run Mode 2 (Live Device Capture) to populate this chart
            </div>
          )}
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-1">Top Attacking IPs</h3>
          <p className="text-[#7D8590] text-xs mb-4">From the ML detection database</p>
          {!isLoaded ? (
            <div className="flex items-center justify-center h-[280px] text-[#7D8590] text-sm animate-pulse">Loading data…</div>
          ) : topSources.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSources} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis type="number" stroke="#7D8590" allowDecimals={false}
                  label={{ value: 'Attack Count', position: 'insideBottom', offset: -10, fill: '#7D8590', fontSize: 11 }} />
                <YAxis dataKey="ip" type="category" stroke="#7D8590" width={75} tick={{ fontSize: 11 }}
                  label={{ value: 'Source IP', angle: -90, position: 'insideLeft', offset: -65, fill: '#7D8590', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px', color: '#E6EDF3' }} />
                <Bar dataKey="attacks" name="Attacks" fill="#FF4D4D" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-[#7D8590] text-sm">
              Run Mode 1 (Simulator) to populate attack data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
