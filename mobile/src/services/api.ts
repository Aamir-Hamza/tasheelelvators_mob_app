import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { readApiUrl, saveApiUrl } from './session';

function normalizeBase(url: string) {
  return url.replace(/\/$/, '');
}

function resolveApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return normalizeBase(fromEnv);

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export let API_BASE = resolveApiBase();

export function applyApiBase(url: string) {
  API_BASE = normalizeBase(url);
  api.defaults.baseURL = `${API_BASE}/api`;
}

export async function hydrateApiBase() {
  const stored = await readApiUrl();
  if (stored) applyApiBase(stored);
}

export async function persistApiBase(url: string) {
  applyApiBase(url);
  await saveApiUrl(API_BASE);
}

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  maxBodyLength: 20 * 1024 * 1024,
  maxContentLength: 20 * 1024 * 1024,
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
