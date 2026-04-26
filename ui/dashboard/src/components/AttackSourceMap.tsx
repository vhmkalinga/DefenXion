import { useState, useEffect, memo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup,
} from 'react-simple-maps';

// TopoJSON world map (light, no API key needed)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Attack source locations with coordinates and threat data
const ATTACK_SOURCES = [
    { id: 1, name: 'United States', coords: [-95.7, 37.1] as [number, number], attacks: 2341, severity: 'high', country: 'US' },
    { id: 2, name: 'China', coords: [104.2, 35.9] as [number, number], attacks: 1856, severity: 'critical', country: 'CN' },
    { id: 3, name: 'Russia', coords: [105.3, 61.5] as [number, number], attacks: 1543, severity: 'critical', country: 'RU' },
    { id: 4, name: 'Brazil', coords: [-51.9, -14.2] as [number, number], attacks: 987, severity: 'medium', country: 'BR' },
    { id: 5, name: 'India', coords: [78.9, 20.6] as [number, number], attacks: 876, severity: 'medium', country: 'IN' },
    { id: 6, name: 'Germany', coords: [10.5, 51.2] as [number, number], attacks: 654, severity: 'medium', country: 'DE' },
    { id: 7, name: 'Iran', coords: [53.7, 32.4] as [number, number], attacks: 543, severity: 'high', country: 'IR' },
    { id: 8, name: 'North Korea', coords: [127.5, 40.3] as [number, number], attacks: 432, severity: 'critical', country: 'KP' },
    { id: 9, name: 'Nigeria', coords: [8.7, 9.1] as [number, number], attacks: 321, severity: 'low', country: 'NG' },
    { id: 10, name: 'Ukraine', coords: [31.2, 48.4] as [number, number], attacks: 298, severity: 'medium', country: 'UA' },
    { id: 11, name: 'United Kingdom', coords: [-1.2, 52.4] as [number, number], attacks: 267, severity: 'low', country: 'GB' },
    { id: 12, name: 'South Korea', coords: [127.8, 35.9] as [number, number], attacks: 245, severity: 'low', country: 'KR' },
    { id: 13, name: 'Netherlands', coords: [5.3, 52.1] as [number, number], attacks: 198, severity: 'low', country: 'NL' },
    { id: 14, name: 'Indonesia', coords: [113.9, -0.8] as [number, number], attacks: 176, severity: 'low', country: 'ID' },
    { id: 15, name: 'Vietnam', coords: [108.3, 14.1] as [number, number], attacks: 165, severity: 'low', country: 'VN' },
];

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#FF4D4D',
    high: '#FFA657',
    medium: '#D29922',
    low: '#3FB950',
};

function AttackSourceMap() {
    const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
    const [pulsePhase, setPulsePhase] = useState(0);

    // Animate pulse rings
    useEffect(() => {
        const interval = setInterval(() => {
            setPulsePhase(p => (p + 1) % 60);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const totalAttacks = ATTACK_SOURCES.reduce((sum, s) => sum + s.attacks, 0);

    return (
        <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#E6EDF3]">Global Attack Source Map</h3>
                <div className="flex items-center gap-4 text-xs">
                    {Object.entries(SEVERITY_COLORS).map(([label, color]) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[#7D8590] capitalize">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative bg-[#0D1117] rounded-xl overflow-hidden border border-[#30363D]" style={{ height: 420 }}>
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 130,
                        center: [20, 20],
                    }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <ZoomableGroup zoom={1} minZoom={1} maxZoom={5}>
                        <Geographies geography={GEO_URL}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#1A2332"
                                        stroke="#2A3545"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: 'none' },
                                            hover: { fill: '#243447', outline: 'none' },
                                            pressed: { outline: 'none' },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {/* Attack Source Markers */}
                        {ATTACK_SOURCES.map((source) => {
                            const color = SEVERITY_COLORS[source.severity];
                            const baseRadius = Math.max(4, Math.sqrt(source.attacks / 30));
                            const isHovered = hoveredMarker === source.id;
                            const pulseRadius = baseRadius + 6 + Math.sin(pulsePhase * 0.15 + source.id) * 3;

                            return (
                                <Marker
                                    key={source.id}
                                    coordinates={source.coords}
                                    onMouseEnter={() => setHoveredMarker(source.id)}
                                    onMouseLeave={() => setHoveredMarker(null)}
                                >
                                    {/* Outer pulse ring */}
                                    <circle
                                        r={pulseRadius}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={1}
                                        opacity={0.3}
                                    />

                                    {/* Middle glow */}
                                    <circle
                                        r={baseRadius + 3}
                                        fill={color}
                                        opacity={0.15}
                                    />

                                    {/* Core dot */}
                                    <circle
                                        r={isHovered ? baseRadius + 2 : baseRadius}
                                        fill={color}
                                        opacity={0.85}
                                        style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                                    />

                                    {/* Center bright dot */}
                                    <circle
                                        r={2}
                                        fill="#fff"
                                        opacity={0.9}
                                    />
                                </Marker>
                            );
                        })}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Hover Tooltip */}
                {hoveredMarker && (() => {
                    const source = ATTACK_SOURCES.find(s => s.id === hoveredMarker);
                    if (!source) return null;
                    const color = SEVERITY_COLORS[source.severity];
                    return (
                        <div
                            className="absolute top-4 right-4 bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-2xl min-w-[200px] z-10"
                            style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                        >
                            <div className="text-[#E6EDF3] font-semibold mb-1">{source.name}</div>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-[#7D8590]">Attacks</span>
                                    <span className="text-[#E6EDF3] font-mono">{source.attacks.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#7D8590]">Severity</span>
                                    <span className="capitalize font-semibold" style={{ color }}>{source.severity}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#7D8590]">Share</span>
                                    <span className="text-[#E6EDF3] font-mono">{((source.attacks / totalAttacks) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Total Counter */}
                <div className="absolute bottom-4 left-4 bg-[#161B22]/90 backdrop-blur-sm border border-[#30363D] rounded-lg px-4 py-2">
                    <div className="text-[#7D8590] text-xs">Total Attack Sources</div>
                    <div className="text-[#E6EDF3] text-lg font-bold font-mono">{totalAttacks.toLocaleString()}</div>
                </div>
            </div>

            {/* Top 5 Attack Sources Table */}
            <div className="mt-4 grid grid-cols-5 gap-3">
                {ATTACK_SOURCES.slice(0, 5).map((source) => {
                    const color = SEVERITY_COLORS[source.severity];
                    const pct = ((source.attacks / totalAttacks) * 100).toFixed(1);
                    return (
                        <div key={source.id} className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-[#E6EDF3] text-sm font-medium truncate">{source.name}</span>
                            </div>
                            <div className="text-[#E6EDF3] text-lg font-bold font-mono">{source.attacks.toLocaleString()}</div>
                            <div className="text-[#7D8590] text-xs">{pct}% of total</div>
                            <div className="mt-2 h-1.5 bg-[#30363D] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(AttackSourceMap);
