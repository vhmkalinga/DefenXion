import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../constants/theme';
import { fetchDashboardStats, fetchRecentAlerts } from '../../constants/api';

// Backend /dashboard/recent-alerts returns: { sourceIp, severity, confidence(0-100), status, timestamp, type }
const SEVERITY_CFG: Record<string, { icon: any; color: string; dim: string }> = {
  Critical: { icon: 'alert-circle',       color: Theme.colors.danger,  dim: Theme.colors.dangerDim  },
  High:     { icon: 'warning',            color: Theme.colors.warning, dim: Theme.colors.warningDim },
  Medium:   { icon: 'shield-outline',     color: Theme.colors.primary, dim: Theme.colors.primaryDim },
  Low:      { icon: 'information-circle', color: Theme.colors.primary, dim: Theme.colors.primaryDim },
  default:  { icon: 'information-circle', color: Theme.colors.primary, dim: Theme.colors.primaryDim },
};

function timeAgo(ts: string) {
  if (!ts) return '';
  try {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  } catch { return ts; }
}

export default function HomeScreen() {
  const [stats, setStats]           = useState<any>(null);
  const [alerts, setAlerts]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [pollCount, setPollCount]   = useState(0);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setError(null);
    try {
      const [s, a] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentAlerts(),
      ]);
      setStats(s);
      setAlerts(Array.isArray(a) ? a.slice(0, 8) : []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setPollCount(n => n + 1);
      setError(null);
    } catch (e: any) {
      const msg = e?.message || 'Unknown error';
      console.error('Home fetch error:', msg);
      if (!silent) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time this tab comes into focus (catches post-login first load)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
      const id = setInterval(() => fetchAll(true), 5000);
      return () => clearInterval(id);
    }, [fetchAll])
  );

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const total   = stats?.total_attacks   ?? 0;
  const threats = stats?.high_severity   ?? 0;
  const blocked = stats?.auto_responses  ?? 0;
  const avgTime = stats?.avg_detection_time ?? '—';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>DEFENXION</Text>
            <Text style={styles.subTitle}>Dashboard Overview</Text>
          </View>
          <View style={[styles.chip, error ? styles.chipError : styles.chipLive]}>
            <View style={[styles.dot, { backgroundColor: error ? Theme.colors.danger : Theme.colors.success }]} />
            <Text style={[styles.chipText, { color: error ? Theme.colors.danger : Theme.colors.success }]}>
              {error ? 'ERROR' : 'LIVE'}
            </Text>
          </View>
        </View>

        {/* ── Error Banner ── */}
        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={() => fetchAll()}>
            <Ionicons name="warning-outline" size={16} color={Theme.colors.danger} />
            <Text style={styles.errorText} numberOfLines={2}>
              Backend unreachable — tap to retry{'\n'}
              <Text style={{ fontSize: 10 }}>{error}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Defense Status ── */}
        <View style={[styles.statusCard, { borderColor: Theme.colors.success + '50' }]}>
          <View style={[styles.statusIcon, { backgroundColor: Theme.colors.successDim }]}>
            <Ionicons name="shield-checkmark" size={26} color={Theme.colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Active Defense Mode</Text>
            <Text style={styles.statusSub}>System is autonomously blocking threats</Text>
          </View>
          <View style={[styles.dot, { backgroundColor: Theme.colors.success, width: 10, height: 10 }]} />
        </View>

        {/* ── Stat Grid ── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {loading && !stats ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Connecting to backend…</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            <StatCard icon="flash-outline"        color={Theme.colors.primary} value={total.toLocaleString()}   label="Total Attacks" />
            <StatCard icon="warning-outline"      color={Theme.colors.danger}  value={threats.toLocaleString()} label="High Severity" />
            <StatCard icon="ban-outline"          color={Theme.colors.warning} value={blocked.toLocaleString()} label="Auto Blocked"  />
            <StatCard icon="timer-outline"        color={Theme.colors.success} value={avgTime}                  label="Avg Detection" />
          </View>
        )}

        {/* ── Recent Events ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {lastUpdated ? (
            <Text style={styles.updatedText}>↻ {lastUpdated}</Text>
          ) : null}
        </View>

        {alerts.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={36} color={Theme.colors.success} />
            <Text style={styles.emptyTitle}>No threats detected</Text>
            <Text style={styles.emptySubText}>Run the traffic simulator to generate data</Text>
          </View>
        ) : (
          alerts.map((alert: any, i: number) => {
            const cfg = SEVERITY_CFG[alert.severity] ?? SEVERITY_CFG.default;
            const ip  = alert.sourceIp || alert.source_ip || 'Unknown IP';
            const conf = alert.confidence; // already 0-100 from backend
            return (
              <View key={i} style={[styles.eventItem, { borderLeftColor: cfg.color }]}>
                <View style={[styles.eventIcon, { backgroundColor: cfg.dim }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {alert.status || alert.type || 'EVENT'} · {ip}
                  </Text>
                  <Text style={styles.eventSub}>
                    {alert.type ? `${alert.type}  ` : ''}{timeAgo(alert.timestamp)}
                  </Text>
                </View>
                {conf != null && (
                  <View style={[styles.confBadge, { backgroundColor: cfg.dim }]}>
                    <Text style={[styles.confText, { color: cfg.color }]}>
                      {Math.round(conf)}%
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, color, value, label }: { icon: any; color: string; value: string; label: string }) {
  return (
    <View style={styles.gridCard}>
      <View style={[styles.gridIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.gridValue}>{value}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create;
const styles = s({
  container:    { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent:{ padding: Theme.spacing.lg, paddingBottom: 32 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.xl },
  appName:      { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: 'bold' },
  subTitle:     { color: Theme.colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 2 },

  chip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, gap: 5 },
  chipLive:     { backgroundColor: Theme.colors.successDim },
  chipError:    { backgroundColor: Theme.colors.dangerDim },
  chipText:     { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  dot:          { width: 6, height: 6, borderRadius: 3 },

  errorBanner:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.colors.dangerDim, borderRadius: 10, padding: 12, gap: 8, marginBottom: 16, borderWidth: 1, borderColor: Theme.colors.danger + '40' },
  errorText:    { color: Theme.colors.danger, fontSize: 12, flex: 1, lineHeight: 18 },

  statusCard:   { flexDirection: 'row', backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, alignItems: 'center', gap: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  statusIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusTitle:  { color: Theme.colors.text, fontSize: 15, fontWeight: 'bold' },
  statusSub:    { color: Theme.colors.textMuted, fontSize: 11, marginTop: 2 },

  loadingBox:   { alignItems: 'center', paddingVertical: 30, gap: 10 },
  loadingText:  { color: Theme.colors.textMuted, fontSize: 13 },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  sectionTitle: { color: Theme.colors.text, fontSize: 17, fontWeight: 'bold' },
  updatedText:  { color: Theme.colors.textMuted, fontSize: 10 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Theme.spacing.xl },
  gridCard:     { backgroundColor: Theme.colors.surface, width: '47%', padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border },
  gridIconBox:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.sm },
  gridValue:    { color: Theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 2 },
  gridLabel:    { color: Theme.colors.textMuted, fontSize: 11, fontWeight: '600' },

  eventItem:    { flexDirection: 'row', backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border, borderLeftWidth: 3, alignItems: 'center', marginBottom: Theme.spacing.sm, gap: Theme.spacing.sm },
  eventIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eventTitle:   { color: Theme.colors.text, fontSize: 13, fontWeight: 'bold' },
  eventSub:     { color: Theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  confBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  confText:     { fontSize: 10, fontWeight: 'bold' },

  emptyState:   { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle:   { color: Theme.colors.textMuted, fontSize: 15, fontWeight: 'bold' },
  emptySubText: { color: Theme.colors.textMuted, fontSize: 12 },
});
