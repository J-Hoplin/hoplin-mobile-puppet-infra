import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  serverUrl: string;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User) => void;
  setServerUrl: (url: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      serverUrl: 'http://localhost:3000',
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      setServerUrl: (url) => set({ serverUrl: url }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'remote-puppet-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        serverUrl: state.serverUrl,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
