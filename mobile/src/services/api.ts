import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use((config) => {
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _ts: Date.now() };
  }
  return config;
});
