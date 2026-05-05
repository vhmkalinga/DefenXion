import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CREDENTIALS_KEY = 'defenxion_user_credentials';

export async function saveCredentialsSecurely(username: string, password: string) {
  try {
    const creds = JSON.stringify({ username, password });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CREDENTIALS_KEY, creds);
      }
    } else {
      await SecureStore.setItemAsync(CREDENTIALS_KEY, creds);
    }
    return true;
  } catch (error) {
    console.error('Failed to save credentials securely:', error);
    return false;
  }
}

export async function getStoredCredentials() {
  try {
    let credsStr = null;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        credsStr = window.localStorage.getItem(CREDENTIALS_KEY);
      }
    } else {
      credsStr = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    }
    
    if (credsStr) {
      return JSON.parse(credsStr);
    }
    return null;
  } catch (error) {
    console.error('Failed to get stored credentials:', error);
    return null;
  }
}

export async function clearStoredCredentials() {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(CREDENTIALS_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    }
  } catch (error) {
    console.error('Failed to clear stored credentials:', error);
  }
}

export async function promptBiometricAuth(promptMessage: string = 'Log in to DefenXion') {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { success: false, error: 'Biometric hardware not available on this device.' };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { success: false, error: 'No biometrics are enrolled on this device. Please set up Face ID or Touch ID in your device settings.' };
    }

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });

    if (authResult.success) {
      return { success: true };
    } else {
      return { success: false, error: authResult.error || 'Authentication failed or was canceled.' };
    }
  } catch (error: any) {
    console.error('Biometric auth error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred during biometric authentication.' };
  }
}
