/**
 * Push notification utility — Expo Go safe.
 *
 * expo-notifications runs auto-registration side-effects at import time
 * (DevicePushTokenAutoRegistration.fx.js), which crashes in Expo Go SDK 53+.
 *
 * This file uses a NO-OP stub pattern: all functions return null/void
 * when IS_EXPO_GO is true, and the expo-notifications import is kept
 * in a try-catch so any load-time errors are caught.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Attempt to load expo-notifications; silently fail in Expo Go.
let _Notifications: typeof import('expo-notifications') | null = null;
let _Device: typeof import('expo-device') | null = null;

if (!IS_EXPO_GO) {
  try {
    // These are safe to require in dev/prod builds.
    _Notifications = require('expo-notifications');
    _Device = require('expo-device');

    _Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('[notifications] Could not load expo-notifications:', e);
  }
}

export async function setupNotificationHandler(): Promise<void> {
  // Handler is set up synchronously above; this export exists for
  // backwards-compatibility with profile.tsx call sites.
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (IS_EXPO_GO || !_Notifications || !_Device) return null;

  try {
    if (Platform.OS === 'android') {
      await _Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: _Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (!_Device.isDevice) {
      console.warn('Push Notifications require a physical device.');
      return 'ExponentPushToken[dummy-token-for-simulator]';
    }

    const { status: existingStatus } = await _Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await _Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      throw new Error('Push notification permission was denied.');
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    return (await _Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e: any) {
    console.error('[notifications] Token registration failed:', e.message);
    return null;
  }
}
