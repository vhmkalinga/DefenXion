import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SharedStyles, Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Constants from 'expo-constants';

const getHostUrl = () => {
  let host = 'localhost';
  if (Constants.expoConfig?.hostUri) {
    host = Constants.expoConfig.hostUri.split(':')[0];
  }
  return host;
};

const hostIp = getHostUrl();
const API_BASE_URL = `http://${hostIp}:8000`;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'name' | 'email' | 'password' | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Incomplete Form', 'Please provide necessary clearance details.');
      return;
    }

    setLoading(true);
    // Simulate Registration request holding to prototype scope
    setTimeout(() => {
        setLoading(false);
        Alert.alert('Request Sent', 'Your clearance request is awaiting Administrator evaluation.', [
            { text: 'Acknowledge', onPress: () => router.push('/') }
        ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginWrapper}>
        <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}} showsVerticalScrollIndicator={false}>

          <View style={styles.logoSection}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.loginTitle}>DefenXion</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Apply for Access Clearance.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={[styles.inputContainer, focusedInput === 'name' && styles.inputFocused]}>
                <Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? theme.colors.primary : theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.border}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? theme.colors.primary : theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@defenxion.local"
                  placeholderTextColor={theme.colors.border}
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
              <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
              <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? theme.colors.primary : theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.border}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity>
                   <Ionicons name="eye-off-outline" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={styles.loginButton} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>SUBMIT REQUEST</Text>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Existing Operator? </Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.footerLink}>Secure Login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loginWrapper: { flex: 1, paddingHorizontal: SharedStyles.spacing.lg },
  
  logoSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SharedStyles.spacing.xxl, gap: SharedStyles.spacing.sm },
  iconBox: { backgroundColor: theme.colors.primaryDim, width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loginTitle: { color: theme.colors.text, fontSize: 28, fontWeight: 'bold', letterSpacing: 0.5 },
  
  formContainer: { width: '100%', backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.xl, borderRadius: SharedStyles.radii.xl, borderWidth: 1, borderColor: theme.colors.border },
  welcomeText: { color: theme.colors.textMuted, fontSize: 14, marginBottom: SharedStyles.spacing.lg },
  
  inputGroup: { marginBottom: SharedStyles.spacing.md },
  inputLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: SharedStyles.spacing.sm },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceHighlight, borderRadius: SharedStyles.radii.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: SharedStyles.spacing.md, height: 54 },
  inputFocused: { borderColor: theme.colors.primary },
  inputIcon: { marginRight: SharedStyles.spacing.sm },
  input: { flex: 1, color: theme.colors.text, fontSize: 16 },
  
  loginButton: { 
    backgroundColor: theme.colors.primary, height: 54, borderRadius: SharedStyles.radii.md, 
    alignItems: 'center', justifyContent: 'center', marginTop: SharedStyles.spacing.lg, 
    ...Platform.select({
      web: { boxShadow: `0 4px 10px ${theme.colors.primaryDim}` } as any,
      default: { shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }
    })
  },
  loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SharedStyles.spacing.xl },
  footerText: { color: theme.colors.textMuted, fontSize: 14 },
  footerLink: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' }
});
