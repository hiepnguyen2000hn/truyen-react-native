import { create } from "zustand";
import { storage } from "../utils/storage";

interface HistoryItem {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  readAt: string;
}

interface BookshelfStore {
  bookmarks: string[];
  history: HistoryItem[];
  addBookmark: (storyId: string) => Promise<void>;
  removeBookmark: (storyId: string) => Promise<void>;
  addToHistory: (storyId: string, chapterId: string, chapterNumber: number) => Promise<void>;
  loadData: () => Promise<void>;
}

export const useBookshelfStore = create<BookshelfStore>((set, get) => ({
  bookmarks: [],
  history: [],

  addBookmark: async (storyId) => {
    if (get().bookmarks.includes(storyId)) return;
    const bookmarks = [...get().bookmarks, storyId];
    await storage.set("bookmarks", bookmarks);
    set({ bookmarks });
  },

  removeBookmark: async (storyId) => {
    const bookmarks = get().bookmarks.filter((id) => id !== storyId);
    await storage.set("bookmarks", bookmarks);
    set({ bookmarks });
  },

  addToHistory: async (storyId, chapterId, chapterNumber) => {
    const existing = get().history.filter((h) => h.storyId !== storyId);
    const history = [{ storyId, chapterId, chapterNumber, readAt: new Date().toISOString() }, ...existing].slice(0, 50);
    await storage.set("readHistory", history);
    set({ history });
  },

  loadData: async () => {
    const bookmarks = await storage.get<string[]>("bookmarks") ?? [];
    const history = await storage.get<HistoryItem[]>("readHistory") ?? [];
    set({ bookmarks, history });
  },
}));
