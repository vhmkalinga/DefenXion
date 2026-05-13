import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStyles, Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { getMe, updateMe } from '../constants/api';

export default function AccountScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getMe();
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || ''
        });
      } catch (e: any) {
        Alert.alert('Error', 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMe(form);
      setProfile((p: any) => ({ ...p, ...form }));
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save profile updates.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Details</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
          ) : (
            <>
              {/* Profile Card Header */}
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, { overflow: 'hidden', backgroundColor: theme.colors.background, borderWidth: 2, borderColor: theme.colors.border }]}>
                  <Image 
                    source={{ uri: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.username || 'admin')}` }} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit="cover"
                  />
                </View>
                <View style={styles.profileText}>
                  <Text style={styles.userName}>{profile?.full_name || profile?.username || 'User'}</Text>
                  <Text style={styles.userRole}>{profile?.role === 'admin' ? 'Administrator' : 'Standard User'}</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { marginTop: 0 }]}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.full_name}
                  onChangeText={(val) => setForm({ ...form, full_name: val })}
                  placeholder="Enter full name"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(val) => setForm({ ...form, email: val })}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={(val) => setForm({ ...form, phone: val })}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={form.location}
                  onChangeText={(val) => setForm({ ...form, location: val })}
                  placeholder="Enter your location"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.label}>Member Since</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profile?.member_since || ''}
                  editable={false}
                />
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SharedStyles.spacing.lg, paddingVertical: SharedStyles.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backButton: { padding: 4 },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  saveButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: theme.colors.primaryDim },
  saveText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
  scrollContent: { padding: SharedStyles.spacing.lg, paddingBottom: 40 },
  
  profileHeader: { backgroundColor: theme.colors.surface, padding: 24, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: SharedStyles.spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.border },
  profileText: { flex: 1, justifyContent: 'center' },
  userName: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
  userRole: { color: theme.colors.textMuted, fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
  badge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: theme.colors.successDim, borderWidth: 1, borderColor: theme.colors.success },
  badgeText: { color: theme.colors.success, fontSize: 10, fontWeight: 'bold' },

  sectionTitle: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SharedStyles.spacing.md },
  
  formGroup: { backgroundColor: theme.colors.surface, padding: SharedStyles.spacing.lg, borderRadius: SharedStyles.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  label: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputDisabled: { opacity: 0.5 },
});
