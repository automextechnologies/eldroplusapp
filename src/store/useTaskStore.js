import { create } from 'zustand';

export const useTaskStore = create((set) => ({
  syncing: false,
  setSyncing: (v) => set({ syncing: v }),

  activeBottomSheet: null,
  activeDayNumber: null,
  setActiveBottomSheet: (taskId, dayNumber) =>
    set({ activeBottomSheet: taskId, activeDayNumber: dayNumber }),
  closeBottomSheet: () =>
    set({ activeBottomSheet: null, activeDayNumber: null }),
}));
