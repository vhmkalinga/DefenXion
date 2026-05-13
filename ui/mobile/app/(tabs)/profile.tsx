import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStyles, darkTheme, Theme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { getAppSettings, updateAppSettings, getSystemLogs, logout, setup2FA, verifySetup2FA, disable2FA, fetchActiveSessions, revokeSession, getMe, updatePushToken } from '../../constants/api';
import { Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { IS_EXPO_GO, registerForPushNotificationsAsync, setupNotificationHandler } from '../../utils/notifications';

// Initialize notification handler asynchronously — safe in Expo Go (no-ops).
setupNotificationHandler();


export default function ProfileScreen() {
  const ctx = useTheme();
  const theme = ctx?.theme ?? darkTheme;
  const isDark = ctx?.isDark ?? true;
  const setDark = ctx?.setDark ?? (() => {});
  const styles = getStyles(theme);
  const router = useRouter();

  // Real settings state
  const [twoFactor, setTwoFactor] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [isRevokingId, setIsRevokingId] = useState<string | null>(null);

  // 2FA Modals
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorUri, setTwoFactorUri] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [is2FASaving, setIs2FASaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [settings, logsData, sessionsData, profileData] = await Promise.all([
          getAppSettings(),
          getSystemLogs(1, 3),
          fetchActiveSessions().catch(() => ({ sessions: [] })),
          getMe().catch(() => null)
        ]);
        if (settings) {
          setPushNotifs(settings.notifications?.critical_alerts ?? true);
          // Sync ThemeContext with backend preference
          if (settings.dark_mode !== undefined) {
            setDark(settings.dark_mode);
          }
        }
        if (logsData && logsData.logs) {
          setLogs(logsData.logs);
        }
        if (sessionsData && sessionsData.sessions) {
          setActiveSessions(sessionsData.sessions);
        }
        if (profileData) {
          setProfile(profileData);
          if (profileData.two_factor_enabled !== undefined) {
            setTwoFactor(profileData.two_factor_enabled);
          }
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
    if (key === 'twoFactor') {
      if (val) {
        // Init Setup
        try {
          const data = await setup2FA();
          setTwoFactorSecret(data.secret);
          setTwoFactorUri(data.uri);
          setShow2FAModal(true);
        } catch (e: any) {
          Alert.alert('Setup Failed', 'Could not initialize 2FA setup.');
        }
      } else {
        setShowDisableModal(true);
      }
      return;
    }

    setter(val);
    try {
      if (key === 'pushNotifs') {
        if (IS_EXPO_GO) {
          Alert.alert(
            'Development Build Required',
            'Push notifications are not available in Expo Go since SDK 53. Use a development build to test this feature.'
          );
          setter(!val); // revert toggle
          return;
        }
        await updateAppSettings({ notifications: { critical_alerts: val } });
        if (val) {
          try {
            const token = await registerForPushNotificationsAsync();
            if (token) await updatePushToken(token);
          } catch (tokenErr: any) {
            console.error('Push registration error:', tokenErr);
            Alert.alert('Notification Setup', 'Could not register for push notifications. Make sure you granted permissions.');
          }
        } else {
          await updatePushToken(null);
        }
      }
      if (key === 'isDark') {
        setDark(val); // Instantly re-renders entire app via ThemeContext
        await updateAppSettings({ dark_mode: val });
      }
    } catch (e) {
      setter(!val); // revert
      if (key === 'isDark') setDark(!val);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleVerify2FA = async () => {
    if (otpCode.length !== 6) return;
    setIs2FASaving(true);
    try {
      await verifySetup2FA(otpCode);
      setTwoFactor(true);
      setShow2FAModal(false);
      setOtpCode('');
      Alert.alert('Success', 'Two-Factor Authentication is now enabled.');
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'Invalid 2FA code.');
    } finally {
      setIs2FASaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) return;
    setIs2FASaving(true);
    try {
      await disable2FA(disablePassword);
      setTwoFactor(false);
      setShowDisableModal(false);
      setDisablePassword('');
      Alert.alert('Success', 'Two-Factor Authentication disabled.');
    } catch (e: any) {
      Alert.alert('Disable Failed', e.message || 'Incorrect password or server error.');
    } finally {
      setIs2FASaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      Alert.alert('Success', 'Session revoked successfully.');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to revoke session.');
    } finally {
      setIsRevokingId(null);
    }
  };

  const handleCopySecret = async () => {
    await Clipboard.setStringAsync(twoFactorSecret);
    Alert.alert('Copied', 'Secret key copied to clipboard.');
  };

  const handleOpenAuthApp = () => {
    Linking.openURL(twoFactorUri).catch(() => {
      Alert.alert('Error', 'No authenticator app found. Please copy the secret key instead.');
    });
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to end this session?')) {
        logout();
        router.replace('/');
      }
    } else {
      Alert.alert('Secure Logout', 'Are you sure you want to end this session?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => {
            logout();
            // Timeout ensures modal dismiss animation doesn't swallow the navigation event
            setTimeout(() => {
              router.replace('/');
            }, 150);
          }
        }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <TouchableOpacity style={styles.profileHeader} onPress={() => router.push('/account')}>
          <View style={[styles.avatar, { overflow: 'hidden', backgroundColor: theme.colors.background, borderWidth: 2, borderColor: theme.colors.border }]}>
            <Image 
              source={{ uri: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.username || 'admin')}` }} 
              style={{ width: '100%', height: '100%' }} 
              contentFit="cover"
            />
          </View>
          <View style={styles.profileText}>
             <Text style={styles.userName}>{profile?.full_name || profile?.username || 'Loading...'}</Text>
             <Text style={styles.userRole}>{profile?.role === 'admin' ? 'Administrator' : 'Standard User'}{profile?.email ? ` • ${profile.email}` : ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Security Setttings */}
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <LinearGradient
              colors={[`${theme.colors.success}25`, `${theme.colors.success}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="shield-checkmark" size={18} color={theme.colors.success} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Two-Factor Auth</Text>
            <Switch
              trackColor={{ false: theme.colors.border, true: theme.colors.successDim }}
              thumbColor={twoFactor ? theme.colors.success : '#f4f3f4'}
              onValueChange={(v) => handleToggle('twoFactor', v, setTwoFactor)}
              value={twoFactor}
            />
          </View>

          <View style={styles.lineDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowSessionsModal(true)}>
            <LinearGradient
              colors={[`${theme.colors.textMuted}25`, `${theme.colors.textMuted}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="hardware-chip" size={18} color={theme.colors.textMuted} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Active Devices</Text>
            <Text style={styles.menuRightText}>{activeSessions.length} Connected</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <LinearGradient
              colors={[`${theme.colors.warning}25`, `${theme.colors.warning}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="notifications" size={18} color={theme.colors.warning} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Push Alerts (Critical only)</Text>
            <Switch
              trackColor={{ false: theme.colors.border, true: theme.colors.warningDim }}
              thumbColor={pushNotifs ? theme.colors.warning : '#f4f3f4'}
              onValueChange={(v) => handleToggle('pushNotifs', v, setPushNotifs)}
              value={pushNotifs}
            />
          </View>

          <View style={styles.lineDivider} />

          <View style={styles.menuItem}>
            <LinearGradient
              colors={[`${theme.colors.primary}25`, `${theme.colors.primary}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.menuIconContainer}
            >
               <Ionicons name="color-palette" size={18} color={theme.colors.primary} />
            </LinearGradient>
            <Text style={styles.menuLabel}>Dark Terminal Theme</Text>
            <Switch
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryDim }}
              thumbColor={isDark ? theme.colors.primary : '#f4f3f4'}
              onValueChange={(v) => handleToggle('isDark', v, setDark)}
              value={isDark}
            />
          </View>
        </View>

        {/* Recent Activity List */}
        <Text style={styles.sectionTitle}>Recent Activity Log</Text>
        <View style={styles.menuGroupList}>
          {loading ? (
             <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} />
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
             colors={[theme.colors.dangerDim, 'rgba(0,0,0,0)']}
             start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
             style={styles.logoutButton}
           >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
              <Text style={styles.logoutText}>TERMINATE SESSION</Text>
           </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* 2FA SETUP MODAL */}
      <Modal visible={show2FAModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enable 2FA</Text>
              <TouchableOpacity onPress={() => { setShow2FAModal(false); setOtpCode(''); }}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              1. Scan this QR code or copy the secret key into your authenticator app.
            </Text>

            <View style={styles.qrContainer}>
              {twoFactorUri ? <QRCode value={twoFactorUri} size={160} backgroundColor="white" /> : null}
            </View>

            <View style={styles.secretContainer}>
              <Text style={styles.secretText}>{twoFactorSecret}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopySecret}>
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.openAppButton} onPress={handleOpenAuthApp}>
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.openAppText}>Open Authenticator App</Text>
            </TouchableOpacity>

            <Text style={[styles.modalDescription, { marginTop: 16 }]}>
              2. Enter the 6-digit code generated by the app.
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
              value={otpCode}
              onChangeText={t => setOtpCode(t.replace(/[^0-9]/g, ''))}
            />

            <TouchableOpacity 
              onPress={handleVerify2FA} 
              disabled={otpCode.length !== 6 || is2FASaving}
              style={[styles.modalVerifyBtn, (otpCode.length !== 6 || is2FASaving) && styles.modalVerifyBtnDisabled]}
            >
              {is2FASaving ? <ActivityIndicator color="white" /> : <Text style={styles.modalVerifyText}>Verify & Enable</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2FA DISABLE MODAL */}
      <Modal visible={showDisableModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disable 2FA</Text>
              <TouchableOpacity onPress={() => { setShowDisableModal(false); setDisablePassword(''); }}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Are you sure you want to disable two-factor authentication? Please enter your account password to confirm.
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Account Password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={disablePassword}
              onChangeText={setDisablePassword}
            />

            <TouchableOpacity 
              onPress={handleDisable2FA} 
              disabled={!disablePassword || is2FASaving}
              style={[styles.modalVerifyBtn, { backgroundColor: theme.colors.danger }, (!disablePassword || is2FASaving) && styles.modalVerifyBtnDisabled]}
            >
              {is2FASaving ? <ActivityIndicator color="white" /> : <Text style={styles.modalVerifyText}>Disable 2FA</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ACTIVE SESSIONS MODAL */}
      <Modal visible={showSessionsModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Devices</Text>
              <TouchableOpacity onPress={() => setShowSessionsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              {activeSessions.length === 0 ? (
                <Text style={styles.modalDescription}>No active sessions found.</Text>
              ) : (
                activeSessions.map((session: any) => (
                  <View key={session.id} style={{ backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                      {session.device_info || 'Unknown Device'}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 2 }}>
                      IP: {session.ip}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 10 }}>
                      {new Date(session.created_at).toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      disabled={isRevokingId === session.id}
                      onPress={() => handleRevokeSession(session.id)}
                      style={[styles.modalVerifyBtn, { backgroundColor: theme.colors.dangerDim, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.danger + '50' }, (isRevokingId === session.id) && styles.modalVerifyBtnDisabled]}
                    >
                      {isRevokingId === session.id ? <ActivityIndicator color={theme.colors.danger} /> : <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: 'bold' }}>Revoke Session</Text>}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: SharedStyles.spacing.lg },

  profileHeader: { backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.lg, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: SharedStyles.spacing.md, marginBottom: SharedStyles.spacing.xl },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1 },
  userName: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  userRole: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },

  sectionTitle: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SharedStyles.spacing.md },
  
  menuGroup: { backgroundColor: theme.colors.surface, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: SharedStyles.spacing.xl, overflow: 'hidden' },
  menuGroupList: { backgroundColor: theme.colors.surface, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: SharedStyles.spacing.xxl, overflow: 'hidden' },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SharedStyles.spacing.md, gap: SharedStyles.spacing.md },
  menuIconContainer: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '500' },
  menuRightText: { color: theme.colors.textMuted, fontSize: 13, marginRight: 8 },
  
  lineDivider: { height: 1, backgroundColor: theme.colors.border },

  activityItem: { padding: SharedStyles.spacing.md },
  activityText: { color: theme.colors.text, fontSize: 13, marginBottom: 4 },
  activityTime: { color: theme.colors.textMuted, fontSize: 11 },

  logoutButton: { borderRadius: SharedStyles.radii.lg, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.danger + '80', marginBottom: 50 },
  logoutText: { color: theme.colors.danger, fontSize: 15, fontWeight: 'bold', letterSpacing: 1, marginLeft: 8 },

  // Modals
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { width: '85%', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  modalDescription: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  qrContainer: { alignSelf: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, marginBottom: 16 },
  secretContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 },
  secretText: { color: theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, letterSpacing: 1, flex: 1 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: theme.colors.primaryDim },
  copyButtonText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
  openAppButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  openAppText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  otpInput: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, fontSize: 24, letterSpacing: 8, textAlign: 'center', paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  passwordInput: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  modalVerifyBtn: { backgroundColor: theme.colors.success, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalVerifyBtnDisabled: { opacity: 0.5 },
  modalVerifyText: { color: 'white', fontSize: 15, fontWeight: 'bold' }
});
