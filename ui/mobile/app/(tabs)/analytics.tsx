import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStyles, darkTheme, Theme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { fetchTrafficHistory, fetchTopSources } from '../../constants/api';

const { width } = Dimensions.get('window');
const CHART_W = width - SharedStyles.spacing.lg * 2 - 32;

const getChartConfig = (theme: Theme) => ({
  backgroundGradientFrom: theme.colors.surface,
  backgroundGradientTo:   theme.colors.surface,
  color: (opacity = 1) => `rgba(31, 111, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(${theme.isDark ? '125, 133, 144' : '101, 109, 118'}, ${opacity})`,
  strokeWidth: 3,
  propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.surface },
  decimalPlaces: 0,
});

export default function AnalyticsScreen() {
  const ctx = useTheme();
  const theme = ctx?.theme ?? darkTheme;
  const styles = getStyles(theme);
  const chartConfig = getChartConfig(theme);

  const [traffic, setTraffic]   = useState<any[]>([]);
  const [sources, setSources]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals]     = useState({ threats: 0, blocked: 0, events: 0 });

  const fetchAll = useCallback(async (silent = false) => {
    try {
      const [t, s] = await Promise.all([fetchTrafficHistory(), fetchTopSources()]);
      if (Array.isArray(t) && t.length > 0) {
        setTraffic(t);
        setTotals({
          threats: t.reduce((a: number, b: any) => a + (b.threats || 0), 0),
          blocked: t.reduce((a: number, b: any) => a + (b.blocked || 0), 0),
          events:  t.reduce((a: number, b: any) => a + (b.traffic || 0), 0),
        });
      }
      if (Array.isArray(s)) setSources(s.slice(0, 5));
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 10000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // Build chart data from traffic history — only show every 4th label to avoid clutter
  const lineLabels = traffic.map((b, i) => i % 4 === 0 ? b.time : '');
  const threatData = traffic.map(b => b.threats || 0);
  const blockData  = traffic.map(b => b.blocked || 0);
  const eventData  = traffic.map(b => b.traffic || 0);

  const barLabels = sources.map(s => s.ip?.split('.').slice(-1)[0] ?? '?');
  const barData   = sources.map(s => s.attacks || 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Live<Text style={{ color: theme.colors.primary }}> Analytics</Text>
          </Text>
          <Text style={styles.headerSub}>Rolling 20-min window · refreshes every 10s</Text>
        </View>

        {/* Summary chips */}
        <View style={styles.chips}>
          <Chip icon="warning" color={theme.colors.danger} label="Threats" value={totals.threats} />
          <Chip icon="ban"     color={theme.colors.warning} label="Blocked" value={totals.blocked} />
          <Chip icon="flash"   color={theme.colors.primary} label="Events"  value={totals.events} />
        </View>

        {/* Threat timeline */}
        {traffic.length > 0 ? (
          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.chartTitle}>Threats & Blocked / min</Text>
            <LineChart
              data={{
                labels: lineLabels,
                datasets: [
                  { data: threatData.length ? threatData : [0], color: () => theme.colors.danger,  strokeWidth: 2 },
                  { data: blockData.length  ? blockData  : [0], color: () => theme.colors.success, strokeWidth: 2 },
                ],
                legend: ['Threats', 'Blocked'],
              }}
              width={CHART_W}
              height={200}
              chartConfig={chartConfig}
              bezier
              withDots={false}
              style={styles.chart}
            />
          </View>
        ) : (
          <EmptyChart label="No traffic data yet — run the simulator" />
        )}

        {/* Total events timeline */}
        {traffic.length > 0 && (
          <View style={[styles.card, { marginTop: SharedStyles.spacing.lg }]}>
            <View style={[styles.cardAccent, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.chartTitle}>Total Events / min</Text>
            <LineChart
              data={{ labels: lineLabels, datasets: [{ data: eventData.length ? eventData : [0] }] }}
              width={CHART_W}
              height={180}
              chartConfig={{ ...chartConfig, color: (o = 1) => `rgba(63, 185, 80, ${o})` }}
              bezier
              withDots={false}
              style={styles.chart}
            />
          </View>
        )}

        {/* Top attacking IPs */}
        {sources.length > 0 ? (
          <View style={[styles.card, { marginTop: SharedStyles.spacing.lg }]}>
            <View style={[styles.cardAccent, { backgroundColor: theme.colors.danger }]} />
            <Text style={styles.chartTitle}>Top Attacking IPs</Text>
            <BarChart
              data={{ labels: barLabels, datasets: [{ data: barData.length ? barData : [0] }] }}
              width={CHART_W}
              height={200}
              chartConfig={{ ...chartConfig, color: (o = 1) => `rgba(255, 77, 77, ${o})` }}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
            {sources.map((s, i) => (
              <View key={i} style={styles.ipRow}>
                <Text style={styles.ipAddr}>{s.ip}</Text>
                <Text style={styles.ipCount}>{s.attacks} attacks</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, { marginTop: SharedStyles.spacing.lg }]}>
            <EmptyChart label="No attacking IPs yet" />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  const ctx = useTheme();
  const theme = ctx?.theme ?? darkTheme;
  const styles = getStyles(theme);
  return (
    <LinearGradient
      colors={[`${color}25`, `${color}05`]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.chip, { borderColor: color + '40' }]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </LinearGradient>
  );
}

function EmptyChart({ label }: { label: string }) {
  const ctx = useTheme();
  const theme = ctx?.theme ?? darkTheme;
  const styles = getStyles(theme);
  return (
    <View style={styles.emptyChart}>
      <Ionicons name="bar-chart-outline" size={32} color={theme.colors.border} />
      <Text style={styles.emptyChartText}>{label}</Text>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.colors.background },
  scrollContent:  { padding: SharedStyles.spacing.lg, paddingBottom: 40 },

  header:         { marginBottom: SharedStyles.spacing.lg },
  headerTitle:    { color: theme.colors.text, fontSize: 22, fontWeight: 'bold' },
  headerSub:      { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },

  chips:          { flexDirection: 'row', gap: 10, marginBottom: SharedStyles.spacing.lg },
  chip:           { flex: 1, alignItems: 'center', padding: SharedStyles.spacing.sm, borderRadius: SharedStyles.radii.md, borderWidth: 1, gap: 3 },
  chipValue:      { fontSize: 18, fontWeight: 'bold' },
  chipLabel:      { color: theme.colors.textMuted, fontSize: 10, fontWeight: '600' },

  card:           { backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.md, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', position: 'relative' },
  cardAccent:     { position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.8 },
  chartTitle:     { color: theme.colors.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SharedStyles.spacing.sm },
  chart:          { borderRadius: 12, marginTop: 4 },

  ipRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: theme.colors.border },
  ipAddr:         { color: theme.colors.text, fontSize: 12, fontFamily: 'monospace' },
  ipCount:        { color: theme.colors.danger, fontSize: 12, fontWeight: 'bold' },

  emptyChart:     { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyChartText: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' },
});
