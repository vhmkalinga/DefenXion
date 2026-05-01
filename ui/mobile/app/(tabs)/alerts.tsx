import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../../constants/theme';
import { fetchRecentAlerts, createFirewallRule } from '../../constants/api';

function timeAgo(ts: string) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ThreatsScreen() {
  const [alerts, setAlerts]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [count, setCount]         = useState(0);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async (silent = false) => {
    try {
      const data = await fetchRecentAlerts();
      if (Array.isArray(data)) {
        setAlerts(data);
        setCount(data.length);
      }
    } catch (e: any) {
      if (!e.message?.includes('401')) {
        console.error('Alerts fetch error:', e);
      }
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 5000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleBlock = async (ip: string) => {
    if (blockedIps.has(ip) || ip === 'Unknown') return;
    setBlockingIp(ip);
    try {
      await createFirewallRule({
        name: `Manual Block: ${ip}`,
        priority: 'High',
        action: 'DROP'
      });
      setBlockedIps(prev => new Set(prev).add(ip));
      Alert.alert('Success', `Traffic from ${ip} is now blocked by the firewall.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to block IP');
    } finally {
      setBlockingIp(null);
    }
  };

  const renderAlert = ({ item }: { item: any }) => {
    const isCritical = item.severity === 'Critical';
    const isHigh     = item.severity === 'High';
    const color     = isCritical ? Theme.colors.danger : isHigh ? Theme.colors.warning : Theme.colors.primary;
    const colorDim  = isCritical ? Theme.colors.dangerDim : isHigh ? Theme.colors.warningDim : Theme.colors.primaryDim;
    const iconName  = isCritical ? 'alert-circle' : isHigh ? 'warning' : 'information-circle';
    const ip        = item.sourceIp || item.source_ip || 'Unknown';
    const conf      = item.confidence; // already 0-100 from backend

    return (
      <View style={[styles.card, { borderColor: Theme.colors.border }]}>
        <View style={[styles.cardAccent, { backgroundColor: color }]} />
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[colorDim, 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <Ionicons name={iconName} size={16} color={color} />
            </LinearGradient>
            <Text style={styles.ipText}>{ip}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colorDim, borderColor: color + '40', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color }]}>{item.severity?.toUpperCase() || 'MEDIUM'}</Text>
          </View>
        </View>

        <Text style={styles.actionText}>
          {item.status || item.type || 'Network Intrusion'}
        </Text>

        {conf != null && (
          <View style={styles.confRow}>
            <View style={styles.confBarBg}>
              <LinearGradient
                colors={[`${color}88`, color]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.confBarFill, { width: `${Math.round(conf)}%` as any }]}
              />
            </View>
            <Text style={[styles.confLabel, { color }]}>{Math.round(conf)}% conf</Text>
          </View>
        )}

        <View style={styles.cardBottom}>
          <Text style={styles.cardTime}>{timeAgo(item.timestamp)}</Text>
          <TouchableOpacity onPress={() => handleBlock(ip)} disabled={blockingIp === ip || blockedIps.has(ip) || ip === 'Unknown'}>
            <LinearGradient
              colors={[blockedIps.has(ip) ? Theme.colors.successDim : colorDim, 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.actionBtn, { borderColor: (blockedIps.has(ip) ? Theme.colors.success : color) + '40', borderWidth: 1 }]}
            >
              {blockingIp === ip ? (
                <ActivityIndicator size="small" color={color} />
              ) : (
                <Text style={[styles.actionBtnText, { color: blockedIps.has(ip) ? Theme.colors.success : color }]}>
                  {blockedIps.has(ip) ? 'BLOCKED' : 'BLOCK ORIGIN'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Threat<Text style={{ color: '#58A6FF' }}> Intelligence</Text>
          </Text>
          <Text style={styles.headerSub}>{count} recent events</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>POLLING</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={48} color={Theme.colors.success} />
              <Text style={styles.emptyText}>No threats detected</Text>
              <Text style={styles.emptySubText}>Run the traffic simulator to generate data</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Theme.colors.background },
  header:        { padding: Theme.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:   { color: Theme.colors.text, fontSize: 20, fontWeight: 'bold' },
  headerSub:     { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  liveBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.primaryDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, gap: 5 },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.primary },
  liveText:      { color: Theme.colors.primary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

  listContent:   { paddingHorizontal: Theme.spacing.lg, paddingBottom: 32, gap: Theme.spacing.md },

  card:          { backgroundColor: '#161B22', padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: '#30363D', overflow: 'hidden', position: 'relative' },
  cardAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.8 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox:       { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ipText:        { color: Theme.colors.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:     { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  actionText:    { color: Theme.colors.textMuted, fontSize: 13, fontFamily: 'monospace', marginBottom: Theme.spacing.sm },

  confRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Theme.spacing.sm },
  confBarBg:     { flex: 1, height: 4, backgroundColor: Theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  confBarFill:   { height: 4, borderRadius: 2 },
  confLabel:     { fontSize: 10, fontWeight: 'bold', width: 52, textAlign: 'right' },

  cardBottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Theme.spacing.sm },
  cardTime:      { color: Theme.colors.textMuted, fontSize: 11 },
  actionBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  emptyState:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText:     { color: Theme.colors.textMuted, fontSize: 16, fontWeight: 'bold' },
  emptySubText:  { color: Theme.colors.textMuted, fontSize: 12 },
});
