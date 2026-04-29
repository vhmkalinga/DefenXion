import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../constants/theme';
import { login, BASE_URL } from '../constants/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Focus', 'System requires both credentials to proceed.');
      return;
    }

    setLoading(true);
    try {
      // Uses api.ts login() which stores token + credentials for silent refresh
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Access Denied', `Could not authenticate. Ensure the server is running.\n${BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginWrapper}>
        
        <View style={styles.logoSection}>
          <View style={styles.iconBox}>
            <Ionicons name="shield-checkmark" size={32} color={Theme.colors.primary} />
          </View>
          <Text style={styles.loginTitle}>DefenXion</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome back, secure access.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? Theme.colors.primary : Theme.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="admin@defenxion.local"
                placeholderTextColor={Theme.colors.border}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD KEY</Text>
            <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? Theme.colors.primary : Theme.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Theme.colors.border}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity>
                 <Ionicons name="eye-off-outline" size={20} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.forgotBox}>
            <Text style={styles.forgotText}>Lost configuration key?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerBox}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.biometricButton}>
             <Ionicons name="finger-print" size={22} color={Theme.colors.text} />
             <Text style={styles.biometricText}>Use Biometric Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New operator? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Request Access</Text>
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loginWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: Theme.spacing.lg },
  
  logoSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.xxl, gap: Theme.spacing.sm },
  iconBox: { backgroundColor: Theme.colors.primaryDim, width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loginTitle: { color: Theme.colors.text, fontSize: 28, fontWeight: 'bold', letterSpacing: 0.5 },
  
  formContainer: { width: '100%', backgroundColor: Theme.colors.surface, padding: Theme.spacing.xl, borderRadius: Theme.radii.xl, borderWidth: 1, borderColor: Theme.colors.border },
  welcomeText: { color: Theme.colors.textMuted, fontSize: 14, marginBottom: Theme.spacing.lg },
  
  inputGroup: { marginBottom: Theme.spacing.md },
  inputLabel: { color: Theme.colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: Theme.spacing.sm },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0D14', borderRadius: Theme.radii.md, borderWidth: 1, borderColor: '#1E242C', paddingHorizontal: Theme.spacing.md, height: 54 },
  inputFocused: { borderColor: Theme.colors.primary },
  inputIcon: { marginRight: Theme.spacing.sm },
  input: { flex: 1, color: Theme.colors.text, fontSize: 16 },
  
  forgotBox: { alignItems: 'flex-end', marginBottom: Theme.spacing.lg },
  forgotText: { color: Theme.colors.primary, fontSize: 13, fontWeight: '600' },
  
  loginButton: { backgroundColor: Theme.colors.primary, height: 54, borderRadius: Theme.radii.md, alignItems: 'center', justifyContent: 'center', shadowColor: Theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  
  dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: Theme.spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Theme.colors.border },
  dividerText: { color: Theme.colors.textMuted, marginHorizontal: Theme.spacing.md, fontSize: 12, fontWeight: 'bold' },
  
  biometricButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.surfaceHighlight, height: 54, borderRadius: Theme.radii.md, borderWidth: 1, borderColor: Theme.colors.border, gap: Theme.spacing.sm },
  biometricText: { color: Theme.colors.text, fontSize: 15, fontWeight: '600' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Theme.spacing.xl },
  footerText: { color: Theme.colors.textMuted, fontSize: 14 },
  footerLink: { color: Theme.colors.primary, fontSize: 14, fontWeight: 'bold' }
});
