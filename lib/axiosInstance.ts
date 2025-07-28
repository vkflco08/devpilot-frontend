'use client';

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

interface BaseResponse<T> {
  resultCode: string;
  message: string;
  data: T | null;
  httpStatus: number;
}

interface TokenInfo {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
}

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const forceLogout = (errorMessage: string = "세션이 만료되었습니다. 다시 로그인해주세요.") => {
  console.error("Authentication Error:", errorMessage);
  localStorage.removeItem('task-pilot-accessToken');
  document.cookie = 'task-pilot-refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const redirectPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirect=${redirectPath}`;
  } else if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
    alert(errorMessage);
  }
};

const refreshAccessToken = async (): Promise<string> => {
  try {
    const response: AxiosResponse<BaseResponse<TokenInfo>> = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`,
      {},
      { 
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    if (response.data?.resultCode === 'SUCCESS' && response.data.data?.accessToken) {
      const newAccessToken = response.data.data.accessToken;
      localStorage.setItem('task-pilot-accessToken', newAccessToken); // 새 Access Token 저장
      return newAccessToken;
    } else {
      const errorCode = response.data?.resultCode || 'UNKNOWN_REFRESH_API_FAILURE';
      const errorMessage = response.data?.message || 'Refresh API가 예상치 못한 응답을 반환했습니다.';
      throw new Error(`Refresh failed: ${errorCode} - ${errorMessage}`);
    }
  } catch (error: any) {
    const backendErrorCode = error.response?.data?.resultCode || 'NETWORK_OR_SERVER_ERROR_DURING_REFRESH';
    const backendErrorMessage = error.response?.data?.message || '토큰 갱신 중 네트워크/서버 오류 발생';
    
    const specificRefreshErrors = [
      'REFRESH_TOKEN_INVALID',
      'REFRESH_TOKEN_MISMATCH',
      'REFRESH_TOKEN_NOT_FOUND_IN_DB',
      'REFRESH_TOKEN_MISSING',
      'USER_ID_MISSING_IN_TOKEN'
    ];

    if (specificRefreshErrors.includes(backendErrorCode)) {
      forceLogout(backendErrorMessage);
    } else {
      forceLogout(`토큰 갱신 중 알 수 없는 오류 발생: ${backendErrorMessage}`);
    }
    
    throw error;
  }
};

// --- Axios 인터셉터 설정 ---

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
      return config;
    }
    
    const token = localStorage.getItem('task-pilot-accessToken');
    if (token && typeof token === 'string' && token !== 'undefined' && token !== 'null') { 
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 Unauthorized 에러 처리 및 토큰 갱신 로직
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean,
      _isRetry?: boolean
    };
    
    // 1. 재시도할 필요가 없는 경우 (아래 조건 중 하나라도 해당하면)
    if (
      originalRequest._retry || originalRequest._isRetry || // 이미 재시도한 요청
      error.response?.status !== 401 || // HTTP Status가 401이 아닌 경우 (예: 400, 403, 404, 500 등)
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) // 로그인 페이지로의 요청
    ) {
      return Promise.reject(error); // 에러를 그대로 반환
    }

    // 2. Refresh Token 갱신 요청 자체가 실패한 경우 (무한 루프 방지)
    //    -> `refreshAccessToken`에서 이미 `forceLogout` 처리
    if (originalRequest.url?.includes('/api/auth/refresh')) {
      // `refreshAccessToken` 내부에서 이미 `forceLogout`을 호출했으므로, 여기서는 단순히 `Promise.reject(error)`만 수행
      return Promise.reject(error); 
    }

    // 3. Access Token 만료 (`401 Unauthorized`) 감지 및 커스텀 에러 코드 확인
    //    -> 백엔드 `BaseResponse`의 `resultCode`가 `'ACCESS_TOKEN_EXPIRED'`인지 정확히 확인
    const backendResponse: BaseResponse<any> | undefined = error.response?.data as BaseResponse<any> | undefined;
    const isAccessTokenExpired = error.response?.status === 401 && backendResponse?.resultCode === 'ACCESS_TOKEN_EXPIRED';

    if (!isAccessTokenExpired) {
      // 401이지만 `ACCESS_TOKEN_EXPIRED`가 아닌 다른 이유 (예: 권한 없음, 잘못된 토큰 형식 등)
      return Promise.reject(error); // 에러를 그대로 반환
    }

    // 4. Access Token 만료가 확인되었고, 토큰 갱신 로직 실행
    if (isRefreshing) {
      // 이미 토큰 갱신이 진행 중이라면, 현재 요청을 대기열에 추가하고 새 토큰 발급 시 재시도
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          originalRequest._isRetry = true; // 재시도 플래그 설정
          resolve(instance(originalRequest)); // 원래 요청을 새 토큰으로 재시도
        });
      });
    }

    // 5. 토큰 갱신 프로세스 시작 (이 블록은 한 번의 만료 이벤트에 대해 한 번만 실행됨)
    isRefreshing = true;
    originalRequest._retry = true; // 이 요청은 재시도될 것임

    try {
      const newToken = await refreshAccessToken();
      onTokenRefreshed(newToken);
      
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return instance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;