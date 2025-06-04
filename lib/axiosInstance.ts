import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 쿠키 관련 유틸리티 함수
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

class RetryQueue {
  private queue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    config: any;
  }> = [];

  private isRefreshing = false;

  async refreshToken() {
    const refreshToken = getCookie('task-manager-refreshToken');
    if (!refreshToken) {
      this.rejectAll(new Error('Refresh token not found'));
      return;
    }

    try {
      this.isRefreshing = true;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`, { refreshToken });
      const newAccessToken = response.data.data.accessToken;
      localStorage.setItem('task-manager-accessToken', newAccessToken);

      // 모든 대기 중인 요청에 대해 새로운 토큰을 설정하고 재시도
      this.queue.forEach(({ resolve, config }) => {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        resolve(instance(config));
      });
      this.queue = [];
    } catch (error) {
      this.rejectAll(error);
      localStorage.removeItem('task-manager-accessToken');
      document.cookie = 'task-manager-refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    } finally {
      this.isRefreshing = false;
    }
  }

  private rejectAll(error: any) {
    this.queue.forEach(({ reject }) => reject(error));
    this.queue = [];
  }

  async enqueue(config: any) {
    return new Promise(async (resolve, reject) => {
      // 토큰 만료를 미리 체크
      if (await checkTokenExpiration()) {
        this.queue.push({ resolve, reject, config });
        if (!this.isRefreshing) {
          this.refreshToken();
        }
      } else {
        // 토큰이 아직 유효한 경우 바로 실행
        resolve(instance(config));
      }
    });
  }
}

const retryQueue = new RetryQueue();

// 토큰 유효성 검증 함수
const validateToken = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('task-manager-accessToken')}`
      }
    });
    return response.data.data;
  } catch (error) {
    return null;
  }
};

// 토큰 만료를 체크하는 함수
const checkTokenExpiration = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/validate`);
    return response.data.data.expired;
  } catch (error) {
    return true;
  }
};

instance.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('task-manager-accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getCookie('task-manager-refreshToken');
        if (!refreshToken) {
          throw new Error('Refresh token not found');
        }

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const newAccessToken = response.data.data.accessToken;
        
        localStorage.setItem('task-manager-accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        return instance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('task-manager-accessToken');
        document.cookie = 'task-manager-refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        throw refreshError;
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;