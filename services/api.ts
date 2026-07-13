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

  // 1. 비로그인 상태에서의 무의미한 대기 딜레이 원천 격리 (Fast-Fail)
  const isPublicPath = path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/products');
  if (!token && !isPublicPath) {
    if (path.includes('/reports') || path.includes('/gps') || path.includes('/sessions')) {
      return [];
    }
    return {};
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. 타임아웃을 8초에서 2초로 파격 단축하여 사용자의 지연 체감을 0%로 제압 (2000ms)
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 2000)
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

    if (path.includes('/reports') || path.includes('/gps') || path.includes('/sessions')) {
      return [];
    }
    if (path.includes('/products')) {
      throw err;
    }
    return {};
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
