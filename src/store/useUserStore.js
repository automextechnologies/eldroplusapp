import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setUser: (user, token) => set({ user, token }),

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      logout: () => {
        set({ user: null, token: null });
        document.cookie = 'token=; Max-Age=0; Path=/';
      },

      isAuthenticated: () => !!get().token,

      currentDayNumber: () => {
        const { user } = get();
        if (!user?.startDate) return 1;
        const start = new Date(user.startDate);
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(diff + 1, 1), 30);
      },
    }),
    {
      name: 'health-challenge-user',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
