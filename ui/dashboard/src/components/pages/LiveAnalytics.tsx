import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { StatCard } from '../StatCard';

const generateLiveData = () => ({
  time: new Date().toLocaleTimeString(),
  threats: Math.floor(Math.random() * 50) + 10,
  blocked: Math.floor(Math.random() * 40) + 5,
  traffic: Math.floor(Math.random() * 1000) + 500,
});

const threatsByRegion = [
  { region: 'North America', threats: 245 },
  { region: 'Europe', threats: 189 },
  { region: 'Asia', threats: 312 },
  { region: 'South America', threats: 87 },
  { region: 'Africa', threats: 56 },
  { region: 'Oceania', threats: 43 },
];

const protocolData = [
  { protocol: 'HTTP', threats: 120, blocked: 115 },
  { protocol: 'HTTPS', threats: 80, blocked: 78 },
  { protocol: 'FTP', threats: 45, blocked: 45 },
  { protocol: 'SSH', threats: 67, blocked: 65 },
  { protocol: 'DNS', threats: 34, blocked: 32 },
];

const attackVectorData = [
  { vector: 'Network', value: 85 },
  { vector: 'Application', value: 92 },
  { vector: 'Social Eng.', value: 65 },
  { vector: 'Physical', value: 30 },
  { vector: 'Cloud', value: 78 },
];

import { getDashboardTraffic } from '../../services/api';

export function LiveAnalytics() {
  const [liveData, setLiveData] = useState([generateLiveData()]);
  const [currentStats, setCurrentStats] = useState({
    activeThreats: 47,
    blockedToday: 1834,
    bandwidth: '2.4 GB/s',
    uptime: '99.98%',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trafficData = await getDashboardTraffic();
        if (trafficData && trafficData.length > 0) {
          setLiveData(trafficData);

          // Use the latest data point for current stats
          const latest = trafficData[trafficData.length - 1];
          setCurrentStats({
            activeThreats: latest.threats,
            blockedToday: latest.blocked * 12, // Scale up for daily view mock
            bandwidth: `${(latest.traffic / 100).toFixed(1)} GB/s`,
            uptime: '99.98%',
          });
        }
      } catch (err) {
        console.error("Failed to fetch traffic stats", err);
      }
    };

    fetchData(); // fetch on mount
    const interval = setInterval(fetchData, 4000); // poll every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#E6EDF3]">Live Analytics</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3FB950]/10 rounded-full">
          <div className="w-2 h-2 bg-[#3FB950] rounded-full animate-pulse"></div>
          <span className="text-[#3FB950] text-sm">Live Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Threats"
          value={currentStats.activeThreats.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="Blocked Today"
          value={currentStats.blockedToday.toString()}
          icon={<Shield className="w-5 h-5" />}
        />
        <StatCard
          title="Network Bandwidth"
          value={currentStats.bandwidth}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          title="System Uptime"
          value={currentStats.uptime}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-6">Real-Time Threat Detection</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={liveData}>
              <defs>
                <linearGradient id="threats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3FB950" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="time" stroke="#7D8590" />
              <YAxis stroke="#7D8590" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                  color: '#E6EDF3'
                }}
              />
              <Area type="monotone" dataKey="threats" stroke="#FF4D4D" fillOpacity={1} fill="url(#threats)" />
              <Area type="monotone" dataKey="blocked" stroke="#3FB950" fillOpacity={1} fill="url(#blocked)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-6">Network Traffic</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="time" stroke="#7D8590" />
              <YAxis stroke="#7D8590" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                  color: '#E6EDF3'
                }}
              />
              <Line type="monotone" dataKey="traffic" stroke="#1F6FEB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-6">Threats by Region</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={threatsByRegion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis type="number" stroke="#7D8590" />
              <YAxis dataKey="region" type="category" stroke="#7D8590" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: '8px',
                  color: '#E6EDF3'
                }}
              />
              <Bar dataKey="threats" fill="#1F6FEB" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
          <h3 className="text-[#E6EDF3] mb-6">Attack Vectors</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={attackVectorData}>
              <PolarGrid stroke="#30363D" />
              <PolarAngleAxis dataKey="vector" stroke="#7D8590" />
              <PolarRadiusAxis stroke="#7D8590" />
              <Radar name="Risk Level" dataKey="value" stroke="#FF4D4D" fill="#FF4D4D" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
        <h3 className="text-[#E6EDF3] mb-6">Protocol Analysis</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={protocolData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis dataKey="protocol" stroke="#7D8590" />
            <YAxis stroke="#7D8590" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '8px',
                color: '#E6EDF3'
              }}
            />
            <Bar dataKey="threats" fill="#FFA657" radius={[8, 8, 0, 0]} />
            <Bar dataKey="blocked" fill="#3FB950" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
