import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTotalDays, parseLocalDate } from '../utils/dateUtils';

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

      getTotalDays: () => {
        const { user } = get();
        if (!user) return 30;
        return (
          user.totalDays ||
          user.batch?.totalDays ||
          (user.startDate && user.endDate ? calculateTotalDays(user.startDate, user.endDate) : 30)
        );
      },

      currentDayNumber: () => {
        const { user, getTotalDays } = get();
        if (!user?.startDate) return 1;
        const start = parseLocalDate(user.startDate);
        if (isNaN(start.getTime())) return 1;
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        const totalDays = getTotalDays();
        if (diff < 0) return 1;
        return Math.min(diff + 1, totalDays);
      },
    }),
    {
      name: 'health-challenge-user',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
