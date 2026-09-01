import { create } from 'zustand';
import { authApi } from '../api/auth';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('sehat_token', data.access_token);
    set({ token: data.access_token, user: data.user, isAuthenticated: true });
  },
  
  register: async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('sehat_token', res.access_token);
    set({ token: res.access_token, user: res.user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('sehat_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  loadFromStorage: async () => {
    const token = localStorage.getItem('sehat_token');
    if (token) {
      try {
        const user = await authApi.getMe();
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('sehat_token');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  }
}));
