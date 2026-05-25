import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { 
  User, 
  QueryResult, 
  SchemaTable, 
  SchemaData, 
  QueryHistory, 
  HealthStatus 
} from './types';

// Global state or local memory placeholder for the access token.
// The Zustand store will sync with this.
let globalAccessToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;

export const setGlobalAccessToken = (token: string | null) => {
  globalAccessToken = token;
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api', // Relative path will use Next.js rewrites/proxies
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for httpOnly refresh cookies
});

// Request Interceptor: Attach bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (globalAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${globalAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't refresh if the failed request itself was the refresh or login endpoint
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until token is refreshed
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh via backend/next.js cookie auth endpoint
        const response = await axios.post<{ access_token: string }>('/api/auth/refresh', {}, { withCredentials: true });
        const newAccessToken = response.data.access_token;
        
        setGlobalAccessToken(newAccessToken);
        
        // Notify all subscribers
        refreshSubscribers.forEach((callback) => callback(newAccessToken));
        refreshSubscribers = [];
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and bubble up error (the store will handle logout)
        setGlobalAccessToken(null);
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Authentication
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/login', { email, password });
    setGlobalAccessToken(res.data.access_token);
    return res.data;
  },
  register: async (userData: Omit<User, 'id'> & { password?: string }) => {
    return await api.post('/auth/register', userData);
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn("Logout failed on server, clearing client-side session anyway.", error);
    } finally {
      setGlobalAccessToken(null);
    }
  },
  refreshToken: async () => {
    const res = await api.post<{ access_token: string }>('/auth/refresh');
    setGlobalAccessToken(res.data.access_token);
    return res.data.access_token;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  // Schema
  getSchema: async (): Promise<SchemaData> => {
    const res = await api.get<SchemaData>('/schema');
    return res.data;
  },
  getTableDetail: async (tableName: string) => {
    const res = await api.get<SchemaTable>(`/schema/tables/${tableName}`);
    return res.data;
  },
  getSuggestions: async () => {
    const res = await api.get<{ suggestions: string[] }>('/schema/suggestions');
    return res.data.suggestions;
  },
  
  // Query
  queryNL: async (question: string, conversationId?: string | null) => {
    const res = await api.post<QueryResult>('/query', { question, conversation_id: conversationId });
    return res.data;
  },
  executeSql: async (sql: string, conversationId?: string | null) => {
    const res = await api.post<QueryResult>('/query/execute-sql', { sql, conversation_id: conversationId });
    return res.data;
  },
  getHistory: async (params?: any) => {
    const res = await api.get<QueryHistory[]>('/history', { params });
    return res.data;
  },
  getQueryHistory: async (params?: any) => {
    const res = await api.get<QueryHistory[]>('/history', { params });
    return res.data;
  },
  getFavoriteQueries: async () => {
    const res = await api.get<QueryHistory[]>('/history?is_favorite=true');
    return res.data;
  },
  toggleFavorite: async (queryId: number) => {
    const res = await api.post<{ id: number; is_favorite: boolean; detail: string }>(`/history/${queryId}/favorite`);
    return res.data;
  },

  // Export
  exportResults: async (sql: string, format: 'csv' | 'excel') => {
    const res = await api.post<any>(`/export`, { sql, format }, { responseType: 'blob' });
    return res.data;
  },

  // Health Check
  getHealth: async () => {
    const res = await api.get<HealthStatus>('/health');
    return res.data;
  },
};
