import { create } from "zustand";
import { Appearance } from "react-native";
import { storage } from "../utils/storage";

interface ThemeStore {
  isDark: boolean;
  init: () => Promise<void>;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: false,

  init: async () => {
    const saved = await storage.get<boolean>("theme_dark");
    const isDark = saved ?? false;
    Appearance.setColorScheme(isDark ? "dark" : "light");
    set({ isDark });
  },

  toggle: () => {
    const isDark = !get().isDark;
    Appearance.setColorScheme(isDark ? "dark" : "light");
    storage.set("theme_dark", isDark);
    set({ isDark });
  },
}));
