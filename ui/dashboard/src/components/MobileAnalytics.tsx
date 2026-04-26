import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const threatDistribution = [
  { name: 'DDoS', value: 156, color: '#FF4D4D' },
  { name: 'Malware', value: 89, color: '#FFA657' },
  { name: 'Phishing', value: 234, color: '#58A6FF' },
  { name: 'SQL Injection', value: 67, color: '#1F6FEB' },
  { name: 'XSS', value: 123, color: '#3FB950' },
];

const attackFrequency = [
  { hour: '00h', attacks: 12 },
  { hour: '04h', attacks: 8 },
  { hour: '08h', attacks: 25 },
  { hour: '12h', attacks: 42 },
  { hour: '16h', attacks: 38 },
  { hour: '20h', attacks: 18 },
];

export function MobileAnalytics() {
  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-[#E6EDF3]">Analytics</h2>

      <div className="bg-[#1E232B] rounded-2xl p-4 border border-[#30363D]">
        <h3 className="text-[#E6EDF3] mb-4 text-sm">Threat Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={threatDistribution}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {threatDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#161B22', 
                border: '1px solid #30363D',
                borderRadius: '8px',
                color: '#E6EDF3'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {threatDistribution.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-[#C9D1D9] text-xs">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1E232B] rounded-2xl p-4 border border-[#30363D]">
        <h3 className="text-[#E6EDF3] mb-4 text-sm">Attack Frequency (24h)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={attackFrequency}>
            <XAxis dataKey="hour" stroke="#7D8590" />
            <YAxis stroke="#7D8590" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#161B22', 
                border: '1px solid #30363D',
                borderRadius: '8px',
                color: '#E6EDF3'
              }}
            />
            <Line type="monotone" dataKey="attacks" stroke="#1F6FEB" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1E232B] rounded-2xl p-4 border border-[#30363D]">
        <h3 className="text-[#E6EDF3] mb-4 text-sm">Avg Response Time</h3>
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <svg className="w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#30363D"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#3FB950"
                strokeWidth="8"
                strokeDasharray="351.86"
                strokeDashoffset="88"
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[#E6EDF3]">0.23s</span>
              <span className="text-[#7D8590] text-xs">Excellent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
