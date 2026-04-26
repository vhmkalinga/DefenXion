import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();

  // Mock settings state
  const [twoFactor, setTwoFactor] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);

  const handleLogout = () => {
    Alert.alert('Secure Logout', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: () => router.replace('/') 
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
             <Ionicons name="person" size={40} color={Theme.colors.primary} />
          </View>
          <View style={styles.profileText}>
             <Text style={styles.userName}>System Administrator</Text>
             <Text style={styles.userRole}>Security Operations Center (SOC)</Text>
          </View>
        </View>

        {/* Security Setttings */}
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
               <Ionicons name="shield-checkmark" size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Two-Factor Auth</Text>
            <Switch
              trackColor={{ false: Theme.colors.border, true: Theme.colors.successDim }}
              thumbColor={twoFactor ? Theme.colors.success : '#f4f3f4'}
              onValueChange={setTwoFactor}
              value={twoFactor}
            />
          </View>

          <View style={styles.lineDivider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
               <Ionicons name="hardware-chip" size={20} color={Theme.colors.textMuted} />
            </View>
            <Text style={styles.menuLabel}>Active Devices</Text>
            <Text style={styles.menuRightText}>3 Connected</Text>
            <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
               <Ionicons name="notifications" size={20} color={Theme.colors.warning} />
            </View>
            <Text style={styles.menuLabel}>Push Alerts (Critical only)</Text>
            <Switch
              trackColor={{ false: Theme.colors.border, true: Theme.colors.warningDim }}
              thumbColor={pushNotifs ? Theme.colors.warning : '#f4f3f4'}
              onValueChange={setPushNotifs}
              value={pushNotifs}
            />
          </View>

          <View style={styles.lineDivider} />

          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
               <Ionicons name="color-palette" size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Dark Terminal Theme</Text>
            <Switch
              trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryDim }}
              thumbColor={darkTheme ? Theme.colors.primary : '#f4f3f4'}
              onValueChange={setDarkTheme}
              value={darkTheme}
            />
          </View>
        </View>

        {/* Recent Activity List */}
        <Text style={styles.sectionTitle}>Recent Activity Log</Text>
        <View style={styles.menuGroupList}>
           <View style={styles.activityItem}>
              <Text style={styles.activityText}>Authenticated via iOS Device (192.168.1.55)</Text>
              <Text style={styles.activityTime}>Today, 10:14 AM</Text>
           </View>
           <View style={styles.lineDivider} />
           <View style={styles.activityItem}>
              <Text style={styles.activityText}>Updated Global Firewall Route #411</Text>
              <Text style={styles.activityTime}>Yesterday, 14:31 PM</Text>
           </View>
           <View style={styles.lineDivider} />
           <View style={styles.activityItem}>
              <Text style={styles.activityText}>Password rotation completed</Text>
              <Text style={styles.activityTime}>Apr 12, 09:00 AM</Text>
           </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
           <Ionicons name="log-out-outline" size={20} color={Theme.colors.danger} />
           <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.lg },

  profileHeader: { backgroundColor: Theme.colors.surface, padding: Theme.spacing.lg, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1 },
  userName: { color: Theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  userRole: { color: Theme.colors.textMuted, fontSize: 13, marginTop: 4 },

  sectionTitle: { color: Theme.colors.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Theme.spacing.md },
  
  menuGroup: { backgroundColor: Theme.colors.surface, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: Theme.spacing.xl },
  menuGroupList: { backgroundColor: Theme.colors.surface, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: Theme.spacing.xxl },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Theme.spacing.md, gap: Theme.spacing.md },
  menuIconContainer: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E242C' },
  menuLabel: { flex: 1, color: Theme.colors.text, fontSize: 15, fontWeight: '500' },
  menuRightText: { color: Theme.colors.textMuted, fontSize: 13, marginRight: 8 },
  
  lineDivider: { height: 1, backgroundColor: Theme.colors.border },

  activityItem: { padding: Theme.spacing.md },
  activityText: { color: Theme.colors.text, fontSize: 13, marginBottom: 4 },
  activityTime: { color: Theme.colors.textMuted, fontSize: 11 },

  logoutButton: { backgroundColor: Theme.colors.dangerDim, borderRadius: Theme.radii.lg, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.danger, marginBottom: 50 },
  logoutText: { color: Theme.colors.danger, fontSize: 15, fontWeight: 'bold', letterSpacing: 1, marginLeft: 8 }
});
