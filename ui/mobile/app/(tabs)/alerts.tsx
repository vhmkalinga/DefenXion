import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../constants/theme';
import Constants from 'expo-constants';

type ThreatAlert = {
  id: string;
  type: string;
  source_ip: string;
  message: string;
  timestamp: string;
  severity: string;
};

// WebSocket Configuration
const getHostUrl = () => {
  let host = 'localhost';
  if (Constants.expoConfig?.hostUri) {
    host = Constants.expoConfig.hostUri.split(':')[0];
  }
  return host;
};

const hostIp = getHostUrl();
const WS_BASE_URL = `ws://${hostIp}:8000/ws/threats`;

export default function ThreatsScreen() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket(WS_BASE_URL);

      ws.current.onopen = () => setIsConnected(true);

      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const newAlert: ThreatAlert = {
            id: Math.random().toString(36).substring(7),
            type: data.type || 'info', 
            source_ip: data.source_ip || '192.168.1.104',
            message: data.message || 'Suspicious packet payload detected.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            severity: data.type === 'critical' ? 'CRITICAL' : data.type === 'high' ? 'HIGH' : 'MEDIUM'
          };
          setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
        } catch (err) {
          console.error(err);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();
    return () => { if (ws.current) ws.current.close(); };
  }, []);

  const renderAlert = ({ item }: { item: ThreatAlert }) => {
    const isCritical = item.severity === 'CRITICAL';
    const isHigh = item.severity === 'HIGH';

    const cardThemeColor = isCritical ? Theme.colors.danger : isHigh ? Theme.colors.warning : Theme.colors.primary;
    const cardThemeColorDim = isCritical ? Theme.colors.dangerDim : isHigh ? Theme.colors.warningDim : Theme.colors.primaryDim;

    return (
      <View style={[styles.card, { borderColor: cardThemeColorDim }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleBox}>
             <Ionicons name="warning" size={16} color={cardThemeColor} />
             <Text style={styles.ipText}>{item.source_ip}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cardThemeColorDim }]}>
             <Text style={[styles.badgeText, { color: cardThemeColor }]}>{item.severity}</Text>
          </View>
        </View>

        <Text style={styles.cardMessage}>{item.message}</Text>
        
        <View style={styles.cardBottom}>
           <Text style={styles.cardTime}>{item.timestamp}</Text>
           <TouchableOpacity style={[styles.actionBtn, { backgroundColor: cardThemeColorDim }]}>
              <Text style={[styles.actionBtnText, { color: cardThemeColor }]}>BLOCK ORIGIN</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Threat Intelligence Feed</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? Theme.colors.success : Theme.colors.danger }]} />
          <Text style={styles.statusText}>{isConnected ? 'LIVE' : 'RECONNECTING...'}</Text>
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          {isConnected ? (
             <Text style={styles.emptyStateText}>Network is quiet. No active threats.</Text>
          ) : (
             <ActivityIndicator size="large" color={Theme.colors.primary} />
          )}
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { padding: Theme.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: Theme.colors.text, fontSize: 20, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surfaceHighlight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radii.full, borderWidth: 1, borderColor: '#21262D' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: Theme.colors.text, fontSize: 10, fontWeight: 'bold' },
  
  listContent: { paddingHorizontal: Theme.spacing.lg, paddingBottom: Theme.spacing.xl, gap: Theme.spacing.md },
  
  card: { backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderTopWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  ipText: { color: Theme.colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  
  cardMessage: { color: Theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginVertical: Theme.spacing.sm },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Theme.spacing.sm },
  cardTime: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { color: Theme.colors.textMuted, fontSize: 14, fontStyle: 'italic' }
});
