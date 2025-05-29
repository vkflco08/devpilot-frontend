import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('task-manager-accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('task-manager-refreshToken');
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`, { refreshToken });
          const newAccessToken = response.data.data.accessToken;
          localStorage.setItem('task-manager-accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          isRefreshing = false;
          return instance(originalRequest);
        } catch (e) {
          isRefreshing = false;
          localStorage.removeItem('task-manager-accessToken');
          localStorage.removeItem('task-manager-refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;