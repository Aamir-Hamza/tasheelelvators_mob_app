import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export type DevicePushToken = {
  token: string;
  type: 'expo' | 'fcm' | 'apns' | 'unknown';
  platform: 'ios' | 'android' | 'web';
};

try {
  if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  // Web / unsupported runtimes do not implement the native handler.
}

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

export async function registerForPushNotificationsAsync(): Promise<DevicePushToken | null> {
  try {
    if (Platform.OS === 'web') return null;
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f97316',
        sound: 'default',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const easId = projectId();
    if (easId) {
      const expoToken = await Notifications.getExpoPushTokenAsync({ projectId: easId });
      if (expoToken?.data) {
        return { token: expoToken.data, type: 'expo', platform: Platform.OS };
      }
    }

    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const nativeType = deviceToken.type === 'fcm' || deviceToken.type === 'apns' ? deviceToken.type : 'unknown';
    const value = typeof deviceToken.data === 'string' ? deviceToken.data : JSON.stringify(deviceToken.data);
    if (!value) return null;
    return { token: value, type: nativeType, platform: Platform.OS };
  } catch {
    return null;
  }
}
