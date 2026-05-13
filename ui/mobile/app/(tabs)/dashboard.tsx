import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStyles, darkTheme, Theme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { fetchDashboardStats, fetchRecentAlerts } from '../../constants/api';

// Backend /dashboard/recent-alerts returns: { sourceIp, severity, confidence(0-100), status, timestamp, type }
const getSeverityCfg = (theme: Theme): Record<string, { icon: any; color: string; dim: string }> => ({
  Critical: { icon: 'alert-circle',       color: theme.colors.danger,  dim: theme.colors.dangerDim  },
  High:     { icon: 'warning',            color: theme.colors.warning, dim: theme.colors.warningDim },
  Medium:   { icon: 'shield-outline',     color: theme.colors.primary, dim: theme.colors.primaryDim },
  Low:      { icon: 'information-circle', color: theme.colors.primary, dim: theme.colors.primaryDim },
  default:  { icon: 'information-circle', color: theme.colors.primary, dim: theme.colors.primaryDim },
});

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
  const ctx = useTheme();
  const theme = ctx?.theme ?? darkTheme;  // Guaranteed non-null
  const styles = getStyles(theme);
  const SEVERITY_CFG = getSeverityCfg(theme);

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
      if (!msg.includes('401')) {
        console.error('Home fetch error:', msg);
        if (!silent) setError(msg);
      }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>
              DEFEN<Text style={{ color: theme.colors.primary }}>XION</Text>
            </Text>
            <Text style={styles.subTitle}>Dashboard Overview</Text>
          </View>
          <View style={[styles.chip, error ? styles.chipError : styles.chipLive]}>
            <View style={[styles.dot, { backgroundColor: error ? theme.colors.danger : theme.colors.success }]} />
            <Text style={[styles.chipText, { color: error ? theme.colors.danger : theme.colors.success }]}>
              {error ? 'ERROR' : 'LIVE'}
            </Text>
          </View>
        </View>

        {/* ── Error Banner ── */}
        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={() => fetchAll()}>
            <Ionicons name="warning-outline" size={16} color={theme.colors.danger} />
            <Text style={styles.errorText} numberOfLines={2}>
              Backend unreachable — tap to retry{'\n'}
              <Text style={{ fontSize: 10 }}>{error}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Defense Status ── */}
        <LinearGradient
          colors={['rgba(63,185,80,0.15)', 'rgba(63,185,80,0.02)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.statusCard, { borderColor: 'rgba(63,185,80,0.4)' }]}
        >
          <View style={[styles.statusIcon, { backgroundColor: 'rgba(63,185,80,0.2)' }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Active Defense Mode</Text>
            <Text style={styles.statusSub}>System is autonomously blocking threats</Text>
          </View>
          <View style={[styles.dot, { backgroundColor: theme.colors.success, width: 8, height: 8, ...(Platform.OS === 'web' ? { boxShadow: `0 0 10px ${theme.colors.success}` } : { elevation: 4, shadowColor: theme.colors.success, shadowOpacity: 0.8, shadowRadius: 10 }) }]} />
        </LinearGradient>

        {/* ── Stat Grid ── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {loading && !stats ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Connecting to backend…</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            <StatCard theme={theme} styles={styles} icon="flash-outline"        color={theme.colors.primary} value={total.toLocaleString()}   label="Total Attacks" />
            <StatCard theme={theme} styles={styles} icon="warning-outline"      color={theme.colors.danger}  value={threats.toLocaleString()} label="High Severity" />
            <StatCard theme={theme} styles={styles} icon="ban-outline"          color={theme.colors.warning} value={blocked.toLocaleString()} label="Auto Blocked"  />
            <StatCard theme={theme} styles={styles} icon="timer-outline"        color={theme.colors.success} value={avgTime}                  label="Avg Detection" />
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
            <Ionicons name="checkmark-circle-outline" size={36} color={theme.colors.success} />
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
                <LinearGradient
                  colors={[cfg.dim, 'rgba(0,0,0,0)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.eventIcon}
                >
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {alert.status || alert.type || 'EVENT'} <Text style={{ color: theme.colors.textMuted }}>· {ip}</Text>
                  </Text>
                  <Text style={styles.eventSub}>
                    {alert.type ? `${alert.type}  ` : ''}{timeAgo(alert.timestamp)}
                  </Text>
                </View>
                {conf != null && (
                  <View style={[styles.confBadge, { backgroundColor: cfg.dim, borderColor: cfg.color + '40', borderWidth: 1 }]}>
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

function StatCard({ theme, styles, icon, color, value, label }: { theme: Theme; styles: any; icon: any; color: string; value: string; label: string }) {
  return (
    <View style={styles.gridCard}>
      {/* Top accent line */}
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      
      <LinearGradient
        colors={[`${color}25`, `${color}05`]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.gridIconBox}
      >
        <Ionicons name={icon} size={20} color={color} />
      </LinearGradient>
      <Text style={styles.gridValue}>{value}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.colors.background },
  scrollContent:{ padding: SharedStyles.spacing.lg, paddingBottom: 32 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SharedStyles.spacing.xl },
  appName:      { color: theme.colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: 'bold' },
  subTitle:     { color: theme.colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 2 },

  chip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, gap: 5 },
  chipLive:     { backgroundColor: theme.colors.successDim },
  chipError:    { backgroundColor: theme.colors.dangerDim },
  chipText:     { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  dot:          { width: 6, height: 6, borderRadius: 3 },

  errorBanner:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.dangerDim, borderRadius: 10, padding: 12, gap: 8, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.danger + '40' },
  errorText:    { color: theme.colors.danger, fontSize: 12, flex: 1, lineHeight: 18 },

  statusCard:   { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.md, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', gap: SharedStyles.spacing.md, marginBottom: SharedStyles.spacing.xl },
  statusIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusTitle:  { color: theme.colors.text, fontSize: 15, fontWeight: 'bold' },
  statusSub:    { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },

  loadingBox:   { alignItems: 'center', paddingVertical: 30, gap: 10 },
  loadingText:  { color: theme.colors.textMuted, fontSize: 13 },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SharedStyles.spacing.md },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: 'bold' },
  updatedText:  { color: theme.colors.textMuted, fontSize: 10 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SharedStyles.spacing.xl },
  gridCard:     { backgroundColor: theme.colors.surfaceHighlight, width: '47%', padding: SharedStyles.spacing.md, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', position: 'relative' },
  cardAccent:   { position: 'absolute', top: 0, left: '15%', right: '15%', height: 2, opacity: 0.8 },
  gridIconBox:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: SharedStyles.spacing.sm },
  gridValue:    { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 2 },
  gridLabel:    { color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' },

  eventItem:    { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.md, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 3, alignItems: 'center', marginBottom: SharedStyles.spacing.sm, gap: SharedStyles.spacing.sm },
  eventIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eventTitle:   { color: theme.colors.text, fontSize: 13, fontWeight: 'bold' },
  eventSub:     { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  confBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  confText:     { fontSize: 10, fontWeight: 'bold' },

  emptyState:   { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle:   { color: theme.colors.textMuted, fontSize: 15, fontWeight: 'bold' },
  emptySubText: { color: theme.colors.textMuted, fontSize: 12 },
});
