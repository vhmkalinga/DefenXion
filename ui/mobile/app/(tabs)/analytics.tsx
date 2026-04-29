import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../constants/theme';
import { fetchTrafficHistory, fetchTopSources } from '../../constants/api';

const { width } = Dimensions.get('window');
const CHART_W = width - Theme.spacing.lg * 2 - 32;

const chartConfig = {
  backgroundGradientFrom: Theme.colors.surface,
  backgroundGradientTo:   Theme.colors.surface,
  color: (opacity = 1) => `rgba(31, 111, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(125, 133, 144, ${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: '3', strokeWidth: '1', stroke: Theme.colors.primary },
  decimalPlaces: 0,
};

export default function AnalyticsScreen() {
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
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Analytics</Text>
          <Text style={styles.headerSub}>Rolling 20-min window · refreshes every 10s</Text>
        </View>

        {/* Summary chips */}
        <View style={styles.chips}>
          <Chip icon="warning" color={Theme.colors.danger} label="Threats" value={totals.threats} />
          <Chip icon="ban"     color={Theme.colors.warning} label="Blocked" value={totals.blocked} />
          <Chip icon="flash"   color={Theme.colors.primary} label="Events"  value={totals.events} />
        </View>

        {/* Threat timeline */}
        {traffic.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.chartTitle}>Threats & Blocked / min</Text>
            <LineChart
              data={{
                labels: lineLabels,
                datasets: [
                  { data: threatData.length ? threatData : [0], color: () => Theme.colors.danger,  strokeWidth: 2 },
                  { data: blockData.length  ? blockData  : [0], color: () => Theme.colors.success, strokeWidth: 2 },
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
          <View style={[styles.card, { marginTop: Theme.spacing.lg }]}>
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
          <View style={[styles.card, { marginTop: Theme.spacing.lg }]}>
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
          <View style={[styles.card, { marginTop: Theme.spacing.lg }]}>
            <EmptyChart label="No attacking IPs yet" />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ icon, color, label, value }: { icon: any; color: string; label: string; value: number }) {
  return (
    <View style={[styles.chip, { borderColor: color + '40', backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <View style={styles.emptyChart}>
      <Ionicons name="bar-chart-outline" size={32} color={Theme.colors.border} />
      <Text style={styles.emptyChartText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent:  { padding: Theme.spacing.lg, paddingBottom: 40 },

  header:         { marginBottom: Theme.spacing.lg },
  headerTitle:    { color: Theme.colors.text, fontSize: 22, fontWeight: 'bold' },
  headerSub:      { color: Theme.colors.textMuted, fontSize: 12, marginTop: 3 },

  chips:          { flexDirection: 'row', gap: 10, marginBottom: Theme.spacing.lg },
  chip:           { flex: 1, alignItems: 'center', padding: Theme.spacing.sm, borderRadius: Theme.radii.md, borderWidth: 1, gap: 3 },
  chipValue:      { fontSize: 18, fontWeight: 'bold' },
  chipLabel:      { color: Theme.colors.textMuted, fontSize: 10, fontWeight: '600' },

  card:           { backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border },
  chartTitle:     { color: Theme.colors.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Theme.spacing.sm },
  chart:          { borderRadius: 12, marginTop: 4 },

  ipRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  ipAddr:         { color: Theme.colors.text, fontSize: 12, fontFamily: 'monospace' },
  ipCount:        { color: Theme.colors.danger, fontSize: 12, fontWeight: 'bold' },

  emptyChart:     { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyChartText: { color: Theme.colors.textMuted, fontSize: 12, textAlign: 'center' },
});
