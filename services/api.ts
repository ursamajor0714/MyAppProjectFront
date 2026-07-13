import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/Api';

const TOKEN_KEY = 'auth_token';

async function request(path: string, options: RequestInit = {}) {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.warn('SecureStore token read error:', e);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 15초 타임아웃 경쟁 프로미스 생성
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 15000)
  );

  try {
    const response = await Promise.race([
      fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      }),
      timeoutPromise
    ]) as Response;

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }

    return resData;
  } catch (err: any) {
    console.warn(`⚠️ API 호출 예외 감지 [Path: ${path}]:`, err.message || err);
    throw err;
  }
}

export const api = {
  get: (path: string, options?: RequestInit) =>
    request(path, { ...options, method: 'GET' }),
    
  post: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: (path: string, options?: RequestInit) =>
    request(path, { ...options, method: 'DELETE' }),
};
