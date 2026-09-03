import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'tasheel.token';
const API_URL_KEY = 'tasheel.apiUrl';
const useWebStorage = Platform.OS === 'web';

export async function saveApiUrl(url: string) {
  await AsyncStorage.setItem(API_URL_KEY, url);
}

export async function readApiUrl() {
  return AsyncStorage.getItem(API_URL_KEY);
}

export async function saveAuthToken(token: string) {
  if (useWebStorage) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function readAuthToken() {
  if (useWebStorage) {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
}

export async function clearAuthToken() {
  if (useWebStorage) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export function apiErrorMessage(err: unknown, fallback: string) {
  const ax = err as {
    response?: { status?: number; data?: { message?: string } | string };
    message?: string;
    code?: string;
  };
  const data = ax.response?.data;
  if (data && typeof data === 'object' && data.message) return data.message;
  if (typeof data === 'string' && data.trim()) return data;
  if (ax.response?.status === 409) return 'Email already registered';
  if (ax.response?.status) return `Request failed (${ax.response.status})`;
  return fallback;
}
