import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../../constants/theme';
import { getAppSettings, updateAppSettings, getSystemLogs, logout } from '../../constants/api';

export default function ProfileScreen() {
  const router = useRouter();

  // Real settings state
  const [twoFactor, setTwoFactor] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [settings, logsData] = await Promise.all([
          getAppSettings(),
          getSystemLogs(1, 3)
        ]);
        if (settings) {
          setTwoFactor(settings.security?.two_factor_enabled ?? false);
          setPushNotifs(settings.notifications?.critical_alerts ?? true);
          setDarkTheme(settings.dark_mode ?? true);
        }
        if (logsData && logsData.logs) {
          setLogs(logsData.logs);
        }
      } catch (e: any) {
        if (!e.message?.includes('401')) {
          console.error('Failed to load profile data', e);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = async (key: string, val: boolean, setter: any) => {
    setter(val);
    try {
      if (key === 'twoFactor') await updateAppSettings({ security: { two_factor_enabled: val } });
      if (key === 'pushNotifs') await updateAppSettings({ notifications: { critical_alerts: val } });
      if (key === 'darkTheme') await updateAppSettings({ dark_mode: val });
    } catch (e) {
      setter(!val); // revert
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleLogout = () => {
    Alert.alert('Secure Logout', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: () => {
          logout();
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#1F6FEB', '#58A6FF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
             <Ionicons name="person" size={28} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.profileText}>
             <Text style={styles.userName}>System Administrator</Text>
             <Text style={styles.userRole}>Security Operations Center (SOC)</Text>
          </View>
        </View>

        {/* Security Setttings */}
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <LinearGradient
              colors={[`${Theme.colors.success}25`, `${Theme.colors.success}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="shield-checkmark" size={18} color={Theme.colors.success} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Two-Factor Auth</Text>
            <Switch
              trackColor={{ false: Theme.colors.border, true: Theme.colors.successDim }}
              thumbColor={twoFactor ? Theme.colors.success : '#f4f3f4'}
              onValueChange={(v) => handleToggle('twoFactor', v, setTwoFactor)}
              value={twoFactor}
            />
          </View>

          <View style={styles.lineDivider} />

          <TouchableOpacity style={styles.menuItem}>
            <LinearGradient
              colors={[`${Theme.colors.textMuted}25`, `${Theme.colors.textMuted}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="hardware-chip" size={18} color={Theme.colors.textMuted} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Active Devices</Text>
            <Text style={styles.menuRightText}>3 Connected</Text>
            <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <LinearGradient
              colors={[`${Theme.colors.warning}25`, `${Theme.colors.warning}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="notifications" size={18} color={Theme.colors.warning} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Push Alerts (Critical only)</Text>
            <Switch
              trackColor={{ false: Theme.colors.border, true: Theme.colors.warningDim }}
              thumbColor={pushNotifs ? Theme.colors.warning : '#f4f3f4'}
              onValueChange={(v) => handleToggle('pushNotifs', v, setPushNotifs)}
              value={pushNotifs}
            />
          </View>

          <View style={styles.lineDivider} />

          <View style={styles.menuItem}>
            <LinearGradient
              colors={[`${Theme.colors.primary}25`, `${Theme.colors.primary}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="color-palette" size={18} color={Theme.colors.primary} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Dark Terminal Theme</Text>
            <Switch
              trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryDim }}
              thumbColor={darkTheme ? Theme.colors.primary : '#f4f3f4'}
              onValueChange={(v) => handleToggle('darkTheme', v, setDarkTheme)}
              value={darkTheme}
            />
          </View>
        </View>

        {/* Recent Activity List */}
        <Text style={styles.sectionTitle}>Recent Activity Log</Text>
        <View style={styles.menuGroupList}>
          {loading ? (
             <ActivityIndicator style={{ padding: 20 }} color={Theme.colors.primary} />
          ) : logs.length > 0 ? logs.map((log, i) => (
            <React.Fragment key={i}>
              <View style={styles.activityItem}>
                <Text style={styles.activityText}>{log.message}</Text>
                <Text style={styles.activityTime}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</Text>
              </View>
              {i < logs.length - 1 && <View style={styles.lineDivider} />}
            </React.Fragment>
          )) : (
            <View style={styles.activityItem}>
               <Text style={styles.activityText}>No recent activity found.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleLogout}>
           <LinearGradient
             colors={[Theme.colors.dangerDim, 'rgba(0,0,0,0)']}
             start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
             style={styles.logoutButton}
           >
              <Ionicons name="log-out-outline" size={20} color={Theme.colors.danger} />
              <Text style={styles.logoutText}>TERMINATE SESSION</Text>
           </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.lg },

  profileHeader: { backgroundColor: '#161B22', padding: Theme.spacing.lg, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: '#30363D', flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1 },
  userName: { color: Theme.colors.text, fontSize: 18, fontWeight: '700' },
  userRole: { color: Theme.colors.textMuted, fontSize: 13, marginTop: 4 },

  sectionTitle: { color: Theme.colors.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Theme.spacing.md },
  
  menuGroup: { backgroundColor: '#161B22', borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: '#30363D', marginBottom: Theme.spacing.xl, overflow: 'hidden' },
  menuGroupList: { backgroundColor: '#161B22', borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: '#30363D', marginBottom: Theme.spacing.xxl, overflow: 'hidden' },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Theme.spacing.md, gap: Theme.spacing.md },
  menuIconContainer: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, color: Theme.colors.text, fontSize: 15, fontWeight: '500' },
  menuRightText: { color: Theme.colors.textMuted, fontSize: 13, marginRight: 8 },
  
  lineDivider: { height: 1, backgroundColor: Theme.colors.border },

  activityItem: { padding: Theme.spacing.md },
  activityText: { color: Theme.colors.text, fontSize: 13, marginBottom: 4 },
  activityTime: { color: Theme.colors.textMuted, fontSize: 11 },

  logoutButton: { borderRadius: Theme.radii.lg, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.danger + '80', marginBottom: 50 },
  logoutText: { color: Theme.colors.danger, fontSize: 15, fontWeight: 'bold', letterSpacing: 1, marginLeft: 8 }
});
