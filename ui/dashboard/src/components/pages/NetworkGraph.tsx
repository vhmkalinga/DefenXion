import { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Activity, RefreshCw, ShieldAlert, ShieldCheck, Globe, Server, Info } from 'lucide-react';
import { getNetworkGraph } from '../../services/api';

interface GNode {
  id: string; label: string; type: string; severity: string;
  color: string; attacks: number; attack_types: string[]; size: number;
  x?: number; y?: number; fx?: number; fy?: number;
}
interface GLink {
  source: string | GNode; target: string | GNode;
  severity: string; color: string; attack_type: string;
  confidence: number; is_attack: boolean;
}
interface GraphData { nodes: GNode[]; links: GLink[]; stats: any }

const SEV_COLOR: Record<string, string> = {
  Critical:'#FF4D4D', High:'#FFA657', Medium:'#E3B341',
  Low:'#58A6FF', Benign:'#3FB950', Target:'#1F6FEB',
};

function StatBadge({ icon, label, value, color }: any) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 20px',
      borderRadius:14, background:'linear-gradient(135deg,#161B22,#1a1f28)',
      border:`1px solid ${color}30`, flex:1, minWidth:130,
      boxShadow:`0 4px 20px ${color}10`, position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-10, right:-10, width:50, height:50, borderRadius:'50%', background:`radial-gradient(circle,${color}20,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ width:36, height:36, borderRadius:10, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ color:'#7D8590', fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</div>
        <div style={{ color, fontSize:24, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.1 }}>{value}</div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}55,transparent)` }}/>
    </div>
  );
}

export function NetworkGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]   = useState<GNode | null>(null);
  const [filter, setFilter]       = useState<'all'|'attacks'|'benign'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef     = useRef<any>(null);
  const [dims, setDims] = useState({ w: 860, h: 520 });

  /* ── Responsive canvas width via ResizeObserver ── */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setDims({ w: Math.max(e.contentRect.width, 300), h: 520 });
      }
    });
    ro.observe(containerRef.current);
    // initial measure after a paint tick
    setTimeout(() => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setDims({ w: Math.max(r.width, 300), h: 520 });
      }
    }, 50);
    return () => ro.disconnect();
  }, []);

  const fetchGraph = useCallback(async (silent = false, attempt = 0) => {
    // Wait for auth token to be available (race condition guard)
    const token = localStorage.getItem('access_token');
    if (!token) {
      if (attempt < 5) {
        setTimeout(() => fetchGraph(silent, attempt + 1), 500);
      }
      return;
    }
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const d = await getNetworkGraph();
      // Merge: preserve existing node positions & pins so layout isn't reset on refresh
      setGraphData(prev => {
        if (!prev) return d;
        const posMap = new Map(prev.nodes.map((n: any) => [n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy }]));
        const mergedNodes = d.nodes.map((n: any) => {
          const pos = posMap.get(n.id);
          return pos ? { ...n, ...pos } : n;
        });
        return { ...d, nodes: mergedNodes };
      });
    } catch (e: any) {
      // 401 → token may have just been set, retry once
      if (e?.response?.status === 401 && attempt < 3) {
        setTimeout(() => fetchGraph(silent, attempt + 1), 800);
        return;
      }
      console.error('NetworkGraph fetch error:', e?.response?.status);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
    const id = setInterval(() => fetchGraph(true), 15000);
    return () => clearInterval(id);
  }, [fetchGraph]);

  useEffect(() => {
    if (graphData && graphRef.current) {
      // tune physics for proper spread
      const fg = graphRef.current;
      fg.d3Force('charge').strength(-300);
      fg.d3Force('link').distance(80).strength(0.3);
      setTimeout(() => fg.zoomToFit(500, 60), 600);
    }
  }, [graphData]);

  const filteredData = graphData ? {
    nodes: graphData.nodes.filter(n =>
      filter === 'all' ? true :
      filter === 'attacks' ? n.type === 'attacker' || n.type === 'target' :
      n.type === 'benign'),
    links: graphData.links.filter(l =>
      filter === 'all' ? true :
      filter === 'attacks' ? l.is_attack : !l.is_attack),
  } : { nodes: [], links: [] };

  /* ── Node painter — no emoji, pure canvas shapes ── */
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, gs: number) => {
    const x = node.x ?? 0, y = node.y ?? 0;
    // clamp size: 4–12 px
    const r = Math.min(Math.max(node.size ?? 6, 4), 12);
    const col = node.color || '#58A6FF';
    const isSel = selected?.id === node.id;
    const isPinned = node.fx !== undefined;

    // subtle glow (small radius)
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    glow.addColorStop(0, col + '55');
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = glow;
    ctx.fill();

    // selection ring
    if (isSel || isPinned) {
      ctx.beginPath();
      ctx.arc(x, y, r + 2.5, 0, 2 * Math.PI);
      ctx.strokeStyle = isSel ? '#FFFFFF' : col;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // fill circle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = col;
    ctx.fill();

    // inner icon shape (no emoji)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    if (node.type === 'target') {
      // small shield rect
      const sw = r * 0.55, sh = r * 0.7;
      ctx.fillRect(x - sw / 2, y - sh / 2, sw, sh);
    } else if (node.type === 'attacker') {
      // small triangle warning
      const ts = r * 0.55;
      ctx.beginPath();
      ctx.moveTo(x, y - ts);
      ctx.lineTo(x + ts, y + ts * 0.7);
      ctx.lineTo(x - ts, y + ts * 0.7);
      ctx.closePath();
      ctx.fill();
    } else {
      // dot for benign
      ctx.beginPath();
      ctx.arc(x, y, r * 0.35, 0, 2 * Math.PI);
      ctx.fill();
    }

    // label — only at higher zoom or when selected
    if (gs > 1.2 || isSel) {
      const fs = Math.min(10, 8 / gs);
      ctx.font = `${fs}px monospace`;
      ctx.fillStyle = isSel ? '#E6EDF3' : '#7D8590';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, x, y + r + 2);
    }
  }, [selected]);

  /* ── Link painter ── */
  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const s = link.source, t = link.target;
    if (!s || !t || s.x == null || t.x == null) return;
    const dx = t.x - s.x, dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = link.color + (link.is_attack ? 'bb' : '33');
    ctx.lineWidth = link.is_attack ? 1.2 : 0.6;
    ctx.setLineDash(link.is_attack ? [5, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead
    if (link.is_attack && dist > 30) {
      const ang = Math.atan2(dy, dx);
      const ar = 5;
      const ax = t.x - (dx / dist) * (Math.min(Math.max(t.size ?? 6, 4), 12));
      const ay = t.y - (dy / dist) * (Math.min(Math.max(t.size ?? 6, 4), 12));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - ar * Math.cos(ang - 0.45), ay - ar * Math.sin(ang - 0.45));
      ctx.lineTo(ax - ar * Math.cos(ang + 0.45), ay - ar * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fillStyle = link.color + 'bb';
      ctx.fill();
    }
  }, []);

  /* ── Hit-area painter — makes every node reliably clickable ── */
  const paintPointerArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const x = node.x ?? 0, y = node.y ?? 0;
    const r = Math.min(Math.max(node.size ?? 6, 4), 12) + 6; // 6px extra hit buffer
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const pinAll = useCallback(() => {
    if (!graphData) return;
    graphData.nodes.forEach((n: any) => { n.fx = n.x; n.fy = n.y; });
    setGraphData({ ...graphData }); // trigger re-render
  }, [graphData]);

  const unpinAll = useCallback(() => {
    if (!graphData) return;
    graphData.nodes.forEach((n: any) => { n.fx = undefined; n.fy = undefined; });
    setGraphData({ ...graphData });
  }, [graphData]);

  const CARD: React.CSSProperties = {
    background:'linear-gradient(135deg,#161B22,#1a1f28)',
    border:'1px solid #21262D', borderRadius:16,
  };

  return (
    <>
      <style>{`
        @keyframes ng-spin  { to{transform:rotate(360deg)} }
        @keyframes ng-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ng-up    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ng-glow  { 0%,100%{box-shadow:0 0 8px #FF4D4D55} 50%{box-shadow:0 0 18px #FF4D4D99} }
        .ng-r  { animation:ng-up 0.4s ease both }
        .ng-r:nth-child(2){animation-delay:.07s}
        .ng-r:nth-child(3){animation-delay:.14s}
        .ng-card { background:linear-gradient(135deg,#161B22,#1a1f28); border:1px solid #21262D; border-radius:16px }
        .ng-sbtn { padding:4px 10px; border-radius:7px; font-size:10px; font-family:inherit; cursor:pointer; transition:all 0.15s }
        .ng-sbtn:hover { opacity:0.8 }
      `}</style>

      <div style={{ padding:'28px 32px', maxWidth:1440, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div className="ng-r" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#1F6FEB,#0f4fb5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(31,111,235,0.35)' }}>
              <Activity size={22} color="white" />
            </div>
            <div>
              <h1 style={{ color:'#E6EDF3', fontSize:22, fontWeight:800, margin:0, letterSpacing:'-0.02em' }}>Network Graph</h1>
              <p style={{ color:'#7D8590', fontSize:12, marginTop:3 }}>Live attack topology · real MongoDB detections · 15s auto-refresh</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {(['all','attacks','benign'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'6px 16px', borderRadius:20, fontSize:11, fontWeight:700,
                fontFamily:'inherit', cursor:'pointer', transition:'all 0.2s',
                background: filter===f ? (f==='attacks'?'rgba(255,77,77,0.18)':f==='benign'?'rgba(63,185,80,0.18)':'rgba(31,111,235,0.18)') : 'rgba(255,255,255,0.04)',
                color: filter===f ? (f==='attacks'?'#FF4D4D':f==='benign'?'#3FB950':'#58A6FF') : '#484F58',
                border:`1px solid ${filter===f?(f==='attacks'?'rgba(255,77,77,0.45)':f==='benign'?'rgba(63,185,80,0.45)':'rgba(31,111,235,0.45)'):'#21262D'}`,
                boxShadow: filter===f ? `0 4px 14px ${f==='attacks'?'rgba(255,77,77,0.15)':f==='benign'?'rgba(63,185,80,0.15)':'rgba(31,111,235,0.15)'}` : 'none',
              }}>{f==='all'?'All Traffic':f==='attacks'?'⚠ Attacks':'✓ Benign'}</button>
            ))}
            <button onClick={() => fetchGraph(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid #30363D', color:'#C9D1D9', fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s' }}>
              <RefreshCw size={13} style={{ animation:refreshing?'ng-spin 0.8s linear infinite':'none' }} /> Refresh
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:20, background:'rgba(63,185,80,0.08)', border:'1px solid rgba(63,185,80,0.25)', color:'#3FB950', fontSize:12, fontWeight:700 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#3FB950', display:'inline-block', animation:'ng-pulse 2s ease-in-out infinite', boxShadow:'0 0 8px rgba(63,185,80,0.6)' }} />
              Live
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        {graphData && (
          <div className="ng-r" style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            <StatBadge icon={<Globe size={16}/>}      label="Total Nodes"    value={graphData.stats.total_nodes}  color="#58A6FF"/>
            <StatBadge icon={<Activity size={16}/>}   label="Connections"    value={graphData.stats.total_links}  color="#BC8CFF"/>
            <StatBadge icon={<ShieldAlert size={16}/>} label="Attack Sources" value={graphData.stats.attack_nodes} color="#FF4D4D"/>
            <StatBadge icon={<Server size={16}/>}     label="Target Servers" value={graphData.stats.target_nodes} color="#1F6FEB"/>
            <StatBadge icon={<ShieldCheck size={16}/>} label="Benign Hosts"  value={Math.max(0, graphData.stats.total_nodes-graphData.stats.attack_nodes-graphData.stats.target_nodes)} color="#3FB950"/>
          </div>
        )}

        {/* ── Main layout ── */}
        <div className="ng-r" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, alignItems:'start' }}>

          {/* Canvas */}
          <div ref={containerRef} className="ng-card" style={{ overflow:'hidden' }}>

            {/* Toolbar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:'1px solid #21262D', background:'rgba(13,17,23,0.6)', backdropFilter:'blur(8px)', flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(31,111,235,0.1)', border:'1px solid rgba(31,111,235,0.25)', color:'#58A6FF', fontSize:10, fontWeight:700 }}>
                  {filteredData.nodes.length} nodes · {filteredData.links.length} edges
                </span>
                <span style={{ color:'#484F58', fontSize:10 }}>drag to pin · click pinned to unpin</span>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                <button onClick={pinAll}   className="ng-sbtn" style={{ background:'rgba(31,111,235,0.1)',  border:'1px solid rgba(31,111,235,0.3)',  color:'#58A6FF' }}>📌 Pin All</button>
                <button onClick={unpinAll} className="ng-sbtn" style={{ background:'rgba(255,166,87,0.08)', border:'1px solid rgba(255,166,87,0.25)', color:'#FFA657' }}>🔓 Free All</button>
                <button onClick={() => graphRef.current?.zoomToFit(300,60)} className="ng-sbtn" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid #30363D', color:'#7D8590' }}>⊡ Fit</button>
                <button onClick={() => { const z=graphRef.current; z?.zoom(z.zoom()*1.35); }} className="ng-sbtn" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid #30363D', color:'#7D8590', padding:'4px 9px', fontSize:13 }}>+</button>
                <button onClick={() => { const z=graphRef.current; z?.zoom(z.zoom()*0.75); }} className="ng-sbtn" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid #30363D', color:'#7D8590', padding:'4px 9px', fontSize:13 }}>−</button>
              </div>
            </div>

            {loading ? (
              <div style={{ height:540, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#0D1117' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:'rgba(31,111,235,0.1)', border:'1px solid rgba(31,111,235,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <RefreshCw size={26} color="#1F6FEB" style={{ animation:'ng-spin 1s linear infinite' }}/>
                </div>
                <div style={{ color:'#7D8590', fontSize:13 }}>Building network topology…</div>
                <div style={{ color:'#484F58', fontSize:11 }}>Fetching last 500 detections from MongoDB</div>
              </div>
            ) : filteredData.nodes.length === 0 ? (
              <div style={{ height:540, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, background:'#0D1117' }}>
                <Globe size={52} color="#21262D"/>
                <div style={{ color:'#7D8590', fontSize:14, fontWeight:600 }}>No traffic data</div>
                <div style={{ color:'#484F58', fontSize:12 }}>Run the traffic simulator to populate the graph</div>
              </div>
            ) : (
              <ForceGraph2D
                ref={graphRef}
                graphData={filteredData}
                width={dims.w}
                height={540}
                backgroundColor="#0D1117"
                nodeCanvasObject={paintNode}
                nodeCanvasObjectMode={() => 'replace'}
                nodePointerAreaPaint={paintPointerArea}
                linkCanvasObject={paintLink}
                linkCanvasObjectMode={() => 'replace'}
                onNodeDragEnd={(node: any) => {
                  node.fx = node.x; node.fy = node.y;
                  setGraphData(d => d ? { ...d } : d);
                }}
                onNodeClick={(node: any) => {
                  if (selected?.id === node.id) {
                    node.fx = undefined; node.fy = undefined;
                    setSelected(null);
                    setGraphData(d => d ? { ...d } : d);
                  } else { setSelected(node as GNode); }
                }}
                onBackgroundClick={() => setSelected(null)}
                cooldownTicks={120}
                d3AlphaDecay={0.025}
                d3VelocityDecay={0.4}
                enableZoomInteraction
                enablePanInteraction
                nodeRelSize={1}
              />
            )}
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Node detail */}
            <div className="ng-card" style={{ padding:'18px', overflow:'hidden', position:'relative' }}>
              {selected && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${selected.color},transparent)` }}/>}
              <div style={{ color:'#484F58', fontSize:9, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Node Inspector</div>
              {selected ? (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, background:'rgba(13,17,23,0.7)', border:`1px solid ${selected.color}33`, marginBottom:14 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:`${selected.color}18`, border:`2px solid ${selected.color}55`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ width:14, height:14, borderRadius:'50%', background:selected.color, boxShadow:`0 0 8px ${selected.color}` }}/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ color:'#E6EDF3', fontSize:12, fontWeight:700, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected.id}</div>
                      <span style={{ padding:'1px 7px', borderRadius:10, fontSize:9, fontWeight:800, color:selected.color, background:`${selected.color}15`, border:`1px solid ${selected.color}33` }}>{selected.severity.toUpperCase()}</span>
                    </div>
                  </div>
                  {[
                    { label:'Role',         value: selected.type.charAt(0).toUpperCase()+selected.type.slice(1) },
                    { label:'Attack Count', value: String(selected.attacks||0) },
                    { label:'Attack Types', value: selected.attack_types?.slice(0,2).join(', ')||'—' },
                  ].map(row => (
                    <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #1a1f28' }}>
                      <span style={{ color:'#484F58', fontSize:10, fontWeight:600 }}>{row.label}</span>
                      <span style={{ color:'#C9D1D9', fontSize:11, fontWeight:700, fontFamily:'monospace', maxWidth:150, textAlign:'right', wordBreak:'break-all' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:12, padding:'8px 12px', borderRadius:10, background:'rgba(31,111,235,0.06)', border:'1px solid rgba(31,111,235,0.15)', color:'#58A6FF', fontSize:10, textAlign:'center' }}>
                    Click again to unpin &amp; release
                  </div>
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:140, gap:10 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid #21262D', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Info size={22} color="#30363D"/>
                  </div>
                  <span style={{ color:'#484F58', fontSize:11, textAlign:'center', lineHeight:1.5 }}>Click any node on the<br/>graph to inspect it</span>
                </div>
              )}
            </div>

            {/* Top attackers */}
            <div className="ng-card" style={{ padding:'16px 18px' }}>
              <div style={{ color:'#484F58', fontSize:9, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Top Attackers</div>
              {(graphData?.nodes??[]).filter(n=>n.type==='attacker').sort((a,b)=>b.attacks-a.attacks).slice(0,6).map((n,i) => (
                <div key={n.id} onClick={() => setSelected(s=>s?.id===n.id?null:n)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 9px', borderRadius:9, marginBottom:4, cursor:'pointer', background:selected?.id===n.id?`${n.color}12`:'transparent', border:`1px solid ${selected?.id===n.id?n.color+'30':'transparent'}`, transition:'all 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ color:'#30363D', fontSize:10, fontWeight:700, minWidth:14 }}>{i+1}</span>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:n.color, boxShadow:`0 0 6px ${n.color}` }}/>
                    <span style={{ color:'#C9D1D9', fontSize:11, fontFamily:'monospace' }}>{n.id}</span>
                  </div>
                  <span style={{ padding:'2px 8px', borderRadius:10, background:`${n.color}15`, color:n.color, fontSize:11, fontWeight:800, border:`1px solid ${n.color}30` }}>{n.attacks}</span>
                </div>
              ))}
              {(graphData?.nodes.filter(n=>n.type==='attacker').length??0)===0&&(
                <div style={{ color:'#484F58', fontSize:12, textAlign:'center', padding:'20px 0' }}>No attackers detected</div>
              )}
            </div>

            {/* Severity */}
            <div className="ng-card" style={{ padding:'16px 18px' }}>
              <div style={{ color:'#484F58', fontSize:9, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Severity Breakdown</div>
              {Object.entries(SEV_COLOR).filter(([s])=>s!=='Target').map(([sev,color])=>{
                const count = graphData?.nodes.filter(n=>n.severity===sev).length??0;
                const total = Math.max(graphData?.nodes.length??1,1);
                const pct = Math.round((count/total)*100);
                return (
                  <div key={sev} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:color, boxShadow:`0 0 4px ${color}88` }}/>
                        <span style={{ color:'#C9D1D9', fontSize:11 }}>{sev}</span>
                      </div>
                      <span style={{ color, fontSize:11, fontWeight:800 }}>{count}</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:'#21262D', overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg,${color}88,${color})`, transition:'width 0.6s ease', boxShadow:`0 0 6px ${color}66` }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="ng-card" style={{ padding:'14px 18px' }}>
              <div style={{ color:'#484F58', fontSize:9, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Legend</div>
              {[
                { color:'#FF4D4D', label:'Critical attacker',  shape:'▲' },
                { color:'#FFA657', label:'High severity',       shape:'▲' },
                { color:'#E3B341', label:'Medium severity',     shape:'▲' },
                { color:'#58A6FF', label:'Low severity',        shape:'▲' },
                { color:'#3FB950', label:'Benign host',         shape:'●' },
                { color:'#1F6FEB', label:'Target server',       shape:'▪' },
              ].map(({ color, label, shape }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <div style={{ width:22, height:22, borderRadius:7, background:`${color}15`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ color, fontSize:10 }}>{shape}</span>
                  </div>
                  <span style={{ color:'#C9D1D9', fontSize:11 }}>{label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

