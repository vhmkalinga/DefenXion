import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../constants/theme';

export default function HomeScreen() {
  const [activeDefense, setActiveDefense] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>DefenXion</Text>
            <Text style={styles.subGreeting}>Welcome, Admin</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={Theme.colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Defense Mode Toggle */}
        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
             <Ionicons name="shield-half-outline" size={32} color={activeDefense ? Theme.colors.success : Theme.colors.warning} />
             <View style={styles.modeText}>
               <Text style={styles.modeTitle}>Active Defense Mode</Text>
               <Text style={styles.modeDesc}>{activeDefense ? 'System is autonomously blocking threats.' : 'Manual monitoring required.'}</Text>
             </View>
          </View>
          <Switch
            trackColor={{ false: Theme.colors.border, true: Theme.colors.successDim }}
            thumbColor={activeDefense ? Theme.colors.success : '#f4f3f4'}
            onValueChange={setActiveDefense}
            value={activeDefense}
          />
        </View>

        {/* System Overview Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.grid}>
          
          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <Ionicons name="flash-outline" size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.gridValue}>42,150</Text>
            <Text style={styles.gridLabel}>Total Traffic</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <Ionicons name="warning-outline" size={20} color={Theme.colors.danger} />
            </View>
            <Text style={styles.gridValue}>14</Text>
            <Text style={styles.gridLabel}>Active Threats</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <Ionicons name="close-circle-outline" size={20} color={Theme.colors.warning} />
            </View>
            <Text style={styles.gridValue}>8</Text>
            <Text style={styles.gridLabel}>Blocked IPs</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <Ionicons name="pulse-outline" size={20} color={Theme.colors.success} />
            </View>
            <Text style={styles.gridValue}>99.9%</Text>
            <Text style={styles.gridLabel}>Uptime</Text>
          </View>

        </View>

        {/* Recent Events (Mock list matching UI style) */}
        <Text style={styles.sectionTitle}>Recent Events</Text>
        <View style={styles.eventItem}>
           <View style={[styles.eventIcon, { backgroundColor: Theme.colors.primaryDim }]}>
              <Ionicons name="globe-outline" size={20} color={Theme.colors.primary} />
           </View>
           <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>New Login Location Detected</Text>
              <Text style={styles.eventTime}>2 mins ago</Text>
           </View>
        </View>

        <View style={styles.eventItem}>
           <View style={[styles.eventIcon, { backgroundColor: Theme.colors.dangerDim }]}>
              <Ionicons name="alert-outline" size={20} color={Theme.colors.danger} />
           </View>
           <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>SQL Injection Attempt Failed</Text>
              <Text style={styles.eventTime}>15 mins ago</Text>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.lg },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.xl },
  greeting: { color: Theme.colors.textMuted, fontSize: 13, letterSpacing: 1, fontWeight: 'bold' },
  subGreeting: { color: Theme.colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  
  iconButton: { backgroundColor: Theme.colors.surface, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.danger },
  
  modeCard: { flexDirection: 'row', backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.xl },
  modeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Theme.spacing.md },
  modeText: { flex: 1 },
  modeTitle: { color: Theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  modeDesc: { color: Theme.colors.textMuted, fontSize: 11, paddingRight: 10 },
  
  sectionTitle: { color: Theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: Theme.spacing.md },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Theme.spacing.xl },
  gridCard: { backgroundColor: Theme.colors.surface, width: '48%', padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border },
  gridHeader: { marginBottom: Theme.spacing.sm },
  gridValue: { color: Theme.colors.text, fontSize: 28, fontWeight: '300', marginBottom: 4 },
  gridLabel: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  
  eventItem: { flexDirection: 'row', backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', marginBottom: Theme.spacing.sm, gap: Theme.spacing.md },
  eventIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventDetails: { flex: 1 },
  eventTitle: { color: Theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  eventTime: { color: Theme.colors.textMuted, fontSize: 11 }
});
