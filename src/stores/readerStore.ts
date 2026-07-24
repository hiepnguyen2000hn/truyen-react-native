import { create } from "zustand";
import { ReaderSettings, ReaderTheme, FontSize } from "../types/reader";
import { storage } from "../utils/storage";

const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 15,
  medium: 17,
  large: 20,
};

interface ReaderStore {
  settings: ReaderSettings;
  setTheme: (theme: ReaderTheme) => Promise<void>;
  setFontSize: (size: FontSize) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: "medium",
  fontSizePx: 17,
};

export const useReaderStore = create<ReaderStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  setTheme: async (theme) => {
    const settings = { ...get().settings, theme };
    await storage.set("readerSettings", settings);
    set({ settings });
  },

  setFontSize: async (fontSize) => {
    const settings = { ...get().settings, fontSize, fontSizePx: FONT_SIZE_MAP[fontSize] };
    await storage.set("readerSettings", settings);
    set({ settings });
  },

  loadSettings: async () => {
    const saved = await storage.get<ReaderSettings>("readerSettings");
    if (saved) set({ settings: saved });
  },
}));
