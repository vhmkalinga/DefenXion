import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStyles, Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { login, login2FA, BASE_URL } from '../constants/api';
import { saveCredentialsSecurely, getStoredCredentials, promptBiometricAuth } from '../utils/biometrics';

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | 'otp' | null>(null);
  
  // 2FA state
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Focus', 'System requires both credentials to proceed.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      
      if (data.two_factor_required) {
        setTempToken(data.temp_token);
        setStep('2fa');
        setLoading(false);
        return;
      }

      await saveCredentialsSecurely(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed')) {
        Alert.alert('Connection Error', `Could not reach the server. Ensure the backend is running.\n${BASE_URL}`);
      } else {
        Alert.alert('Access Denied', errMsg || 'Could not authenticate.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await login2FA(tempToken, otpCode, email, password);
      await saveCredentialsSecurely(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed')) {
        Alert.alert('Connection Error', `Could not reach the server.`);
      } else {
        Alert.alert('Verification Failed', errMsg || 'Invalid 2FA code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBioLoading(true);
    try {
      const stored = await getStoredCredentials();
      if (!stored || !stored.username || !stored.password) {
        Alert.alert('Setup Required', 'Please log in with your username and password first to enable biometric authentication.');
        return;
      }

      const authResult = await promptBiometricAuth();
      if (!authResult.success) {
        if (authResult.error && !authResult.error.includes('cancel')) {
           Alert.alert('Biometric Error', authResult.error);
        }
        return;
      }

      // Biometric success, now authenticate with API
      await login(stored.username, stored.password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed')) {
        Alert.alert('Connection Error', `Could not reach the server.`);
      } else {
        Alert.alert('Access Denied', errMsg || 'Authentication failed after biometric verification.');
      }
    } finally {
      setBioLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginWrapper}>
        
        {/* Brand — matches web login */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={['#1F6FEB', '#58A6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBox}
          >
            <Ionicons name="shield" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.loginTitle}>
            Defen<Text style={{ color: theme.colors.primary }}>Xion</Text>
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Top accent line */}
          <View style={styles.accentLine} />
          
          <Text style={styles.welcomeText}>
            {step === 'credentials' ? 'Sign in to your security dashboard' : 'Enter the 6-digit code from your authenticator app.'}
          </Text>

          {step === 'credentials' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                  <Ionicons name="person-outline" size={18} color={focusedInput === 'email' ? theme.colors.primary : theme.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter username"
                    placeholderTextColor={theme.colors.border}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={focusedInput === 'password' ? theme.colors.primary : theme.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={theme.colors.border}
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                     <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ marginTop: 8 }}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary, theme.colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerBox}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin} disabled={bioLoading || loading}>
                 {bioLoading ? (
                   <ActivityIndicator color={theme.colors.text} size="small" />
                 ) : (
                   <>
                     <Ionicons name="finger-print" size={20} color={theme.colors.text} />
                     <Text style={styles.biometricText}>Biometric Login</Text>
                   </>
                 )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AUTHENTICATOR CODE</Text>
                <View style={[styles.inputContainer, focusedInput === 'otp' && styles.inputFocused]}>
                  <Ionicons name="keypad-outline" size={18} color={focusedInput === 'otp' ? theme.colors.primary : theme.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { letterSpacing: 8, fontSize: 18 }]}
                    placeholder="000000"
                    placeholderTextColor={theme.colors.border}
                    keyboardType="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocusedInput('otp')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity 
                  onPress={() => { setStep('credentials'); setOtpCode(''); setTempToken(''); }}
                  style={[styles.biometricButton, { flex: 1, height: 50, marginTop: 0 }]}
                >
                  <Text style={styles.biometricText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handle2FASubmit} disabled={loading || otpCode.length !== 6} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primary, theme.colors.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.loginButton, { opacity: (loading || otpCode.length !== 6) ? 0.6 : 1 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.loginButtonText}>Verify</Text>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DefenXion © 2026 — Intelligent Defence</Text>
        </View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loginWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: SharedStyles.spacing.lg },
  
  logoSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SharedStyles.spacing.xxl, gap: 12 },
  iconBox: { 
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: `0 4px 16px ${theme.colors.primaryDim}` } as any,
      default: { elevation: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    }),
  },
  loginTitle: { color: theme.colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  
  formContainer: { 
    width: '100%', backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.xl, borderRadius: 20, 
    borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', position: 'relative' as const,
  },
  accentLine: {
    position: 'absolute' as const, top: 0, left: '10%', right: '10%', height: 1,
    backgroundColor: theme.colors.primaryDim,
  },
  welcomeText: { color: theme.colors.textMuted, fontSize: 13, marginBottom: SharedStyles.spacing.lg },
  
  inputGroup: { marginBottom: SharedStyles.spacing.md },
  inputLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: 'bold' as const, letterSpacing: 1, marginBottom: SharedStyles.spacing.sm },
  
  inputContainer: { 
    flexDirection: 'row' as const, alignItems: 'center' as const, 
    backgroundColor: theme.colors.surfaceHighlight, borderRadius: 10, 
    borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, height: 50,
  },
  inputFocused: { borderColor: theme.colors.primary },
  inputIcon: { marginRight: SharedStyles.spacing.sm },
  input: { flex: 1, color: theme.colors.text, fontSize: 14 },
  
  loginButton: { 
    height: 50, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, 
    ...Platform.select({
      web: { boxShadow: `0 4px 20px ${theme.colors.primaryDim}` } as any,
      default: { elevation: 6, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
    }),
  },
  loginButtonText: { color: '#FFFFFF', fontWeight: 'bold' as const, fontSize: 15 },
  
  dividerBox: { flexDirection: 'row' as const, alignItems: 'center' as const, marginVertical: SharedStyles.spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, marginHorizontal: SharedStyles.spacing.md, fontSize: 11, fontWeight: 'bold' as const },
  
  biometricButton: { 
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, 
    backgroundColor: theme.colors.surfaceHighlight, height: 50, borderRadius: 12, 
    borderWidth: 1, borderColor: theme.colors.border, gap: SharedStyles.spacing.sm,
  },
  biometricText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' as const },
  
  footer: { alignItems: 'center' as const, marginTop: SharedStyles.spacing.xl },
  footerText: { color: theme.colors.textMuted, fontSize: 11 },
});
