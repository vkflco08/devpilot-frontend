import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 쿠키에서 값 가져오기
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// 토큰 갱신 중인지 여부
let isRefreshing = false;
// 갱신 대기 중인 요청들
let refreshSubscribers: ((token: string) => void)[] = [];

// 대기 중인 요청들에 새 토큰 발급
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// 토큰 갱신
const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`,
      {},
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data?.resultCode === 'SUCCESS' && response.data.data?.accessToken) {
      const newAccessToken = response.data.data.accessToken;
      localStorage.setItem('task-pilot-accessToken', newAccessToken);
      return newAccessToken;
    }
    
    throw new Error('Failed to refresh token');
  } catch (error) {
    // 토큰 갱신 실패 시 로그아웃 처리
    localStorage.removeItem('task-pilot-accessToken');
    document.cookie = 'task-pilot-refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      const redirectPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirectPath}`;
    }
    
    throw error;
  }
};

// 요청 인터셉터
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 로그인 페이지로의 요청은 토큰을 붙이지 않음
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
      return config;
    }
    
    const token = localStorage.getItem('task-pilot-accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean,
      _isRetry?: boolean
    };
    
    // 이미 재시도한 요청이거나, 401/403이 아니거나, 로그인 페이지 요청인 경우
    if (
      originalRequest._retry || 
      originalRequest._isRetry ||
      ![401, 403].includes(error.response?.status as number) ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/login'))
    ) {
      return Promise.reject(error);
    }

    // 무한 루프 방지
    if (originalRequest.url?.includes('/auth/refresh')) {
      // 리프레시 토큰 요청 자체가 실패한 경우
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('task-pilot-accessToken');
        document.cookie = 'task-pilot-refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      return Promise.reject(error);
    }

    // 이미 토큰 갱신 중인 경우
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          originalRequest._isRetry = true;
          resolve(instance(originalRequest));
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      onTokenRefreshed(newToken);
      
      // 원래 요청 재시도
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      originalRequest._isRetry = true;
      
      return instance(originalRequest);
    } catch (refreshError) {
      // 에러는 이미 refreshAccessToken에서 처리됨
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;