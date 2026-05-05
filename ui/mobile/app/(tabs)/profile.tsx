import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../../constants/theme';
import { getAppSettings, updateAppSettings, getSystemLogs, logout, setup2FA, verifySetup2FA, disable2FA } from '../../constants/api';
import { Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';

export default function ProfileScreen() {
  const router = useRouter();

  // Real settings state
  const [twoFactor, setTwoFactor] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (key === 'pushNotifs') await updateAppSettings({ notifications: { critical_alerts: val } });
      if (key === 'darkTheme') await updateAppSettings({ dark_mode: val });
    } catch (e) {
      setter(!val); // revert
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
      Alert.alert('Verification Failed', 'Invalid 2FA code.');
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
      Alert.alert('Disable Failed', 'Incorrect password or server error.');
    } finally {
      setIs2FASaving(false);
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

      {/* 2FA SETUP MODAL */}
      <Modal visible={show2FAModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enable 2FA</Text>
              <TouchableOpacity onPress={() => { setShow2FAModal(false); setOtpCode(''); }}>
                <Ionicons name="close" size={24} color={Theme.colors.textMuted} />
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
                <Ionicons name="copy-outline" size={16} color={Theme.colors.primary} />
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
              placeholderTextColor={Theme.colors.textMuted}
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
                <Ionicons name="close" size={24} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Are you sure you want to disable two-factor authentication? Please enter your account password to confirm.
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Account Password"
              placeholderTextColor={Theme.colors.textMuted}
              secureTextEntry
              value={disablePassword}
              onChangeText={setDisablePassword}
            />

            <TouchableOpacity 
              onPress={handleDisable2FA} 
              disabled={!disablePassword || is2FASaving}
              style={[styles.modalVerifyBtn, { backgroundColor: Theme.colors.danger }, (!disablePassword || is2FASaving) && styles.modalVerifyBtnDisabled]}
            >
              {is2FASaving ? <ActivityIndicator color="white" /> : <Text style={styles.modalVerifyText}>Disable 2FA</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  logoutText: { color: Theme.colors.danger, fontSize: 15, fontWeight: 'bold', letterSpacing: 1, marginLeft: 8 },

  // Modals
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { width: '85%', backgroundColor: '#161B22', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#30363D' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: Theme.colors.text, fontSize: 18, fontWeight: '700' },
  modalDescription: { color: Theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  qrContainer: { alignSelf: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, marginBottom: 16 },
  secretContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0D1117', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#30363D', marginBottom: 16 },
  secretText: { color: Theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, letterSpacing: 1, flex: 1 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: `${Theme.colors.primary}20` },
  copyButtonText: { color: Theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
  openAppButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Theme.colors.primary, paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  openAppText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  otpInput: { backgroundColor: '#0D1117', borderWidth: 1, borderColor: '#30363D', color: Theme.colors.text, fontSize: 24, letterSpacing: 8, textAlign: 'center', paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  passwordInput: { backgroundColor: '#0D1117', borderWidth: 1, borderColor: '#30363D', color: Theme.colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, marginBottom: 16 },
  modalVerifyBtn: { backgroundColor: Theme.colors.success, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalVerifyBtnDisabled: { opacity: 0.5 },
  modalVerifyText: { color: 'white', fontSize: 15, fontWeight: 'bold' }
});
