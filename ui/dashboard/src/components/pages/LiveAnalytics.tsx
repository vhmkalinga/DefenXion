import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar, Cell,
} from 'recharts';
import {
  Activity, AlertTriangle, Shield, TrendingUp, RefreshCw,
  Wifi, Cpu, Globe, Server, ChevronRight,
} from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

const TOOLTIP = {
  backgroundColor: '#0D1117',
  border: '1px solid #30363D',
  borderRadius: 10,
  color: '#E6EDF3',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  fontSize: 12,
};

const CARD = {
  background: 'linear-gradient(135deg,#161B22,#1a1f28)',
  border: '1px solid #21262D',
  borderRadius: 16,
  padding: '20px 24px',
};

/* ── mini sparkline card ── */
function MiniStatCard({
  label, value, sub, color, icon, data,
}: {
  label: string; value: string; sub: string;
  color: string; icon: React.ReactNode; data: number[];
}) {
  const [hovered, setHovered] = useState(false);
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...CARD,
        border: `1px solid ${hovered ? color + '44' : '#21262D'}`,
        boxShadow: hovered ? `0 8px 32px ${color}18` : '0 1px 4px rgba(0,0,0,0.3)',
        transition: 'all 0.25s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* glow */}
      <div style={{ position:'absolute',top:-20,right:-20,width:70,height:70,borderRadius:'50%',
        background:`radial-gradient(circle,${color}30 0%,transparent 70%)`,opacity:hovered?1:0.4,
        transition:'opacity 0.3s',pointerEvents:'none' }} />

      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
        <div style={{ width:38,height:38,borderRadius:10,background:`${color}18`,border:`1px solid ${color}33`,
          display:'flex',alignItems:'center',justifyContent:'center',color }}>
          {icon}
        </div>
        <span style={{ fontSize:11,color:'#7D8590' }}>{sub}</span>
      </div>

      <div style={{ color:'#7D8590',fontSize:11,marginBottom:4 }}>{label}</div>
      <div style={{ color:'#E6EDF3',fontSize:26,fontWeight:700,letterSpacing:'-0.03em',marginBottom:12 }}>{value}</div>

      {/* sparkline */}
      <ResponsiveContainer width="100%" height={44}>
        <AreaChart data={chartData} margin={{ top:0,right:0,left:0,bottom:0 }}>
          <defs>
            <linearGradient id={`spark-${label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#spark-${label.replace(/\s/g,'')})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      {/* bottom accent */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${color}88,transparent)`,
        opacity:hovered?1:0,transition:'opacity 0.3s' }} />
    </div>
  );
}

/* ── chart wrapper card ── */
function ChartCard({ title, sub, children }: { title:string; sub:string; children:React.ReactNode }) {
  return (
    <div style={CARD}>
      <div style={{ marginBottom:16 }}>
        <div style={{ color:'#E6EDF3',fontSize:14,fontWeight:600 }}>{title}</div>
        <div style={{ color:'#7D8590',fontSize:12,marginTop:3 }}>{sub}</div>
      </div>
      {children}
    </div>
  );
}

/* ── empty placeholder ── */
function Empty({ msg }: { msg:string }) {
  return (
    <div style={{ height:260,display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',color:'#7D8590',fontSize:13,gap:10 }}>
      <Server size={32} color="#21262D" />
      {msg}
    </div>
  );
}

/* ── loading placeholder ── */
function Loading() {
  return (
    <div style={{ height:260,display:'flex',alignItems:'center',justifyContent:'center',
      color:'#7D8590',fontSize:13,gap:8 }}>
      <RefreshCw size={14} style={{ animation:'la-spin 1s linear infinite' }} />
      Fetching live data…
    </div>
  );
}

/* ── radial threat-mix chart ── */
function ThreatMixGauge({ threats, blocked, traffic }: { threats:number; blocked:number; traffic:number }) {
  const total = threats + blocked + traffic || 1;
  const data = [
    { name:'Threats', value: Math.round((threats/total)*100), fill:'#FF4D4D' },
    { name:'Blocked', value: Math.round((blocked/total)*100), fill:'#3FB950' },
    { name:'Benign',  value: Math.round(((traffic-threats-blocked)/total)*100), fill:'#1F6FEB' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display:'flex',alignItems:'center',gap:24 }}>
      <div style={{ flex:'0 0 auto' }}>
        <ResponsiveContainer width={150} height={150}>
          <RadialBarChart innerRadius={36} outerRadius={66} data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill:'#21262D' }}>
              {data.map((d,i) => <Cell key={i} fill={d.fill} />)}
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {data.map(d => (
          <div key={d.name} style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:10,height:10,borderRadius:2,background:d.fill,flexShrink:0 }} />
            <span style={{ color:'#C9D1D9',fontSize:13 }}>{d.name}</span>
            <span style={{ color:d.fill,fontSize:13,fontWeight:700,marginLeft:'auto' }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export function LiveAnalytics() {
  const { trafficHistory, portBreakdown, topSources, stats, isLoaded, refresh } = useAnalytics();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  // derive sparkline arrays from trafficHistory
  const threatSpark = trafficHistory.map((d:any) => d.threats || 0);
  const blockedSpark = trafficHistory.map((d:any) => d.blocked || 0);
  const trafficSpark = trafficHistory.map((d:any) => d.traffic || 0);
  const uptimeSpark  = Array.from({ length: 20 }, () => 99.8 + Math.random() * 0.18);

  const STAT_CARDS = [
    { label:'Threats Detected', value: stats.activeThreats.toString(), sub:'Last 20 min',
      color:'#FF4D4D', icon:<AlertTriangle size={17}/>, data: threatSpark },
    { label:'Attacks Blocked',  value: stats.blockedToday.toString(),  sub:'Last 20 min',
      color:'#3FB950', icon:<Shield size={17}/>,        data: blockedSpark },
    { label:'Total Events',     value: stats.totalConnections.toString(), sub:'Last 20 min',
      color:'#1F6FEB', icon:<Activity size={17}/>,       data: trafficSpark },
    { label:'System Uptime',    value: stats.uptime,                   sub:'7-day avg',
      color:'#58A6FF', icon:<TrendingUp size={17}/>,     data: uptimeSpark },
  ];

  return (
    <>
      <style>{`
        @keyframes la-spin { to { transform:rotate(360deg); } }
        @keyframes la-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes la-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .la-row { animation: la-fadeup 0.35s ease both; }
        .la-row:nth-child(2){animation-delay:.06s}
        .la-row:nth-child(3){animation-delay:.12s}
        .la-row:nth-child(4){animation-delay:.18s}
      `}</style>

      <div style={{ padding:'28px 32px', maxWidth:1440, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div className="la-row" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
          <div>
            <h1 style={{ color:'#E6EDF3',fontSize:22,fontWeight:700,letterSpacing:'-0.02em',margin:0 }}>
              Live Analytics
            </h1>
            <p style={{ color:'#7D8590',fontSize:13,marginTop:4 }}>
              Real-time ML-powered network intrusion monitoring · 10s auto-refresh
            </p>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button
              onClick={handleRefresh}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,
                background:'rgba(31,111,235,0.1)',border:'1px solid rgba(31,111,235,0.25)',
                color:'#58A6FF',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer',
                transition:'all 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(31,111,235,0.2)')}
              onMouseLeave={e=>(e.currentTarget.style.background='rgba(31,111,235,0.1)')}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'la-spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
            <div style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:20,
              background:'rgba(63,185,80,0.08)',border:'1px solid rgba(63,185,80,0.2)',
              color:'#3FB950',fontSize:12,fontWeight:600 }}>
              <span style={{ width:7,height:7,borderRadius:'50%',background:'#3FB950',
                boxShadow:'0 0 8px rgba(63,185,80,0.6)',animation:'la-blink 2s ease-in-out infinite' }} />
              Live Monitoring
            </div>
          </div>
        </div>

        {/* ── Stat cards with sparklines ── */}
        <div className="la-row" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:16,marginBottom:24 }}>
          {STAT_CARDS.map(c => <MiniStatCard key={c.label} {...c} />)}
        </div>

        {/* ── Row 1: Threat detection area + network events line ── */}
        <div className="la-row" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
          <ChartCard title="Real-Time Threat Detection" sub="20-min rolling window — threats vs blocked per minute">
            {!isLoaded ? <Loading /> : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trafficHistory} margin={{ top:8,right:16,left:0,bottom:16 }}>
                  <defs>
                    <linearGradient id="la-threats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="la-blocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3FB950" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#3FB950" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
                  <XAxis dataKey="time" stroke="#484F58" fontSize={10}
                    label={{ value:'Time (HH:MM)',position:'insideBottom',offset:-10,fill:'#484F58',fontSize:10 }}/>
                  <YAxis stroke="#484F58" fontSize={10} allowDecimals={false}/>
                  <Tooltip contentStyle={TOOLTIP}/>
                  <Legend wrapperStyle={{ paddingTop:8,fontSize:12 }}/>
                  <Area type="monotone" dataKey="threats" name="Threats" stroke="#FF4D4D" strokeWidth={2}
                    fillOpacity={1} fill="url(#la-threats)"/>
                  <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#3FB950" strokeWidth={2}
                    fillOpacity={1} fill="url(#la-blocked)"/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Network Events Timeline" sub="Total detections per minute (attacks + benign traffic)">
            {!isLoaded ? <Loading /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trafficHistory} margin={{ top:8,right:16,left:0,bottom:16 }}>
                  <defs>
                    <linearGradient id="la-traffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F6FEB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1F6FEB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
                  <XAxis dataKey="time" stroke="#484F58" fontSize={10}
                    label={{ value:'Time (HH:MM)',position:'insideBottom',offset:-10,fill:'#484F58',fontSize:10 }}/>
                  <YAxis stroke="#484F58" fontSize={10} allowDecimals={false}/>
                  <Tooltip contentStyle={TOOLTIP}/>
                  <Line type="monotone" dataKey="traffic" name="Total Events" stroke="#1F6FEB"
                    strokeWidth={2.5} dot={false} activeDot={{ r:5,fill:'#1F6FEB' }}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 2: Protocol dist + Top IPs + Threat mix ── */}
        <div className="la-row" style={{ display:'grid',gridTemplateColumns:'1fr 1fr 360px',gap:16,marginBottom:16 }}>

          <ChartCard title="Protocol Distribution" sub="Port breakdown from captured device traffic (Mode 2)">
            {!isLoaded ? <Loading /> : portBreakdown.length === 0
              ? <Empty msg="Run Mode 2 (Live Capture) to populate this chart" />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={portBreakdown} margin={{ top:8,right:16,left:0,bottom:24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
                    <XAxis dataKey="protocol" stroke="#484F58" fontSize={11}
                      label={{ value:'Protocol',position:'insideBottom',offset:-12,fill:'#484F58',fontSize:11 }}/>
                    <YAxis stroke="#484F58" fontSize={10} allowDecimals={false}/>
                    <Tooltip contentStyle={TOOLTIP}/>
                    <Bar dataKey="connections" name="Connections" radius={[8,8,0,0]}
                      background={{ fill:'rgba(31,111,235,0.04)',radius:[8,8,0,0] } as any}>
                      {portBreakdown.map((_:any, i:number) => (
                        <Cell key={i} fill={['#1F6FEB','#58A6FF','#3FB950','#FFA657','#BC8CFF','#FF4D4D'][i % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>

          <ChartCard title="Top Attacking IPs" sub="Source IPs that triggered block / alert actions">
            {!isLoaded ? <Loading /> : topSources.length === 0
              ? <Empty msg="Run Mode 1 (Simulator) to populate attack data" />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topSources} layout="vertical" margin={{ top:8,right:16,left:80,bottom:16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D"/>
                    <XAxis type="number" stroke="#484F58" fontSize={10} allowDecimals={false}/>
                    <YAxis dataKey="ip" type="category" stroke="#484F58" width={76}
                      tick={{ fontSize:10,fontFamily:'monospace' }}/>
                    <Tooltip contentStyle={TOOLTIP}/>
                    <Bar dataKey="attacks" name="Attacks" fill="#FF4D4D" radius={[0,6,6,0]}
                      background={{ fill:'rgba(255,77,77,0.05)',radius:[0,6,6,0] } as any}/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>

          {/* Threat mix radial */}
          <div style={CARD}>
            <div style={{ marginBottom:20 }}>
              <div style={{ color:'#E6EDF3',fontSize:14,fontWeight:600 }}>Threat Mix</div>
              <div style={{ color:'#7D8590',fontSize:12,marginTop:3 }}>Traffic composition breakdown</div>
            </div>
            {!isLoaded ? <Loading /> : (
              <ThreatMixGauge
                threats={stats.activeThreats}
                blocked={stats.blockedToday}
                traffic={stats.totalConnections}
              />
            )}

            {/* mini metrics */}
            <div style={{ marginTop:24,display:'flex',flexDirection:'column',gap:10 }}>
              {[
                { label:'Threat Rate', value: stats.totalConnections > 0
                    ? `${((stats.activeThreats/stats.totalConnections)*100).toFixed(1)}%`
                    : '0%', color:'#FF4D4D' },
                { label:'Block Rate', value: stats.activeThreats > 0
                    ? `${((stats.blockedToday/stats.activeThreats)*100).toFixed(1)}%`
                    : '0%', color:'#3FB950' },
                { label:'Detection Uptime', value: stats.uptime, color:'#58A6FF' },
              ].map(m => (
                <div key={m.label} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'8px 12px',borderRadius:8,background:'rgba(13,17,23,0.5)',
                  border:'1px solid rgba(48,54,61,0.4)' }}>
                  <span style={{ color:'#7D8590',fontSize:12 }}>{m.label}</span>
                  <span style={{ color:m.color,fontSize:13,fontWeight:700 }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Data source status pills ── */}
        <div className="la-row" style={{ ...CARD, display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
          <span style={{ color:'#7D8590',fontSize:11,fontWeight:600,letterSpacing:'0.08em',marginRight:4 }}>
            DATA SOURCES
          </span>
          {[
            { label:'Traffic Stream', icon:<Wifi size={12}/>, ok: isLoaded },
            { label:'Top Sources',    icon:<Globe size={12}/>, ok: topSources.length > 0 },
            { label:'Port Breakdown', icon:<Cpu size={12}/>,  ok: portBreakdown.length > 0 },
            { label:'ML Engine',      icon:<Server size={12}/>,ok: true },
          ].map(s => (
            <div key={s.label} style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',
              borderRadius:20,background: s.ok ? 'rgba(63,185,80,0.07)' : 'rgba(255,166,87,0.07)',
              border:`1px solid ${s.ok ? 'rgba(63,185,80,0.18)' : 'rgba(255,166,87,0.18)'}` }}>
              <span style={{ color: s.ok ? '#3FB950' : '#FFA657' }}>{s.icon}</span>
              <span style={{ color:'#C9D1D9',fontSize:11 }}>{s.label}</span>
              <span style={{ width:5,height:5,borderRadius:'50%',
                background: s.ok ? '#3FB950' : '#FFA657',
                boxShadow:`0 0 6px ${s.ok ? '#3FB950' : '#FFA657'}`,
                animation:'la-blink 2s ease-in-out infinite' }} />
            </div>
          ))}
          <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5,
            fontSize:11,color:'#484F58' }}>
            <ChevronRight size={12}/> Auto-refreshes every 10s
          </div>
        </div>

      </div>
    </>
  );
}
