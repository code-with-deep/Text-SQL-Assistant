import { create } from 'zustand';
import { decodeJwt } from 'jose';
import { User } from '../lib/types';
import { apiService, setGlobalAccessToken } from '../lib/api';
import { useConversationStore } from './conversationStore';
import { useQueryStore } from './queryStore';
import { toast } from 'sonner';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

let refreshTimeoutId: NodeJS.Timeout | null = null;

// Helper to schedule token refresh 60 seconds before expiry
const scheduleSilentRefresh = (token: string, refreshFn: () => Promise<void>) => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }

  try {
    const decoded = decodeJwt(token);
    if (decoded && decoded.exp) {
      const expiryMs = decoded.exp * 1000;
      const curMs = Date.now();
      
      // Calculate refresh point: 60 seconds before expiry
      const delay = expiryMs - curMs - 60000;
      
      if (delay > 0) {
        refreshTimeoutId = setTimeout(async () => {
          try {
            await refreshFn();
          } catch (err) {
            console.error('Failed to run scheduled token refresh', err);
          }
        }, delay);
      } else {
        // If already near or past refresh threshold, refresh immediately
        refreshFn().catch(console.error);
      }
    }
  } catch (error) {
    console.error('Failed to parse JWT for scheduling refresh', error);
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await apiService.login(email, password);
      set({ 
        user: data.user, 
        accessToken: data.access_token, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Set global token for Axios and schedule refresh
      setGlobalAccessToken(data.access_token);
      scheduleSilentRefresh(data.access_token, get().refreshToken);
      toast.success('Welcome back!');
    } catch (error: any) {
      set({ isLoading: false });
      const errMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(errMessage);
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiService.register({ name, email, password });
      set({ 
        user: data.user, 
        accessToken: data.access_token, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Set global token for Axios and schedule refresh
      setGlobalAccessToken(data.access_token);
      scheduleSilentRefresh(data.access_token, get().refreshToken);
      toast.success('Account created successfully! Welcome to QueryAI.');
    } catch (error: any) {
      set({ isLoading: false });
      const errMessage = error.response?.data?.email?.[0] || error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errMessage);
      throw error;
    }
  },

  logout: async () => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }
    
    try {
      await apiService.logout();
      toast.info('You have been logged out.');
    } catch (error) {
      console.warn('Backend logout failed or was already logged out:', error);
    } finally {
      set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      setGlobalAccessToken(null);
      
      // Prevent data leaking between user sessions in this SPA
      useConversationStore.getState().resetSession();
      useQueryStore.getState().resetQueryState();
    }
  },

  refreshToken: async () => {
    try {
      const newAccessToken = await apiService.refreshToken();
      
      // Get current user profile if we don't have it yet
      let currentUser = get().user;
      if (!currentUser) {
        currentUser = await apiService.getMe();
      }

      set({ 
        accessToken: newAccessToken,
        user: currentUser,
        isAuthenticated: true,
        isLoading: false
      });
      
      setGlobalAccessToken(newAccessToken);
      scheduleSilentRefresh(newAccessToken, get().refreshToken);
    } catch (error) {
      // If token refresh fails, force clean logout
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      setGlobalAccessToken(null);
      
      // Clean up other stores if refresh fails (forced logout)
      useConversationStore.getState().resetSession();
      useQueryStore.getState().resetQueryState();
      
      toast.error('Session expired. Please log in again.');
      throw error;
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // Try to silent-refresh to get active access token from httpOnly refresh cookie
      await get().refreshToken();
    } catch (error) {
      // Clean up initial load state if not authenticated
      set({ isLoading: false });
    }
  }
}));
