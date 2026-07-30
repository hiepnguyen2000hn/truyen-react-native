import { create } from "zustand";
import { Story } from "../types/story";
import { bookmarkService } from "../services/bookmarkService";
import { historyService, HistoryItem } from "../services/historyService";

interface BookshelfStore {
  bookmarks: string[];           // story IDs — dùng để check isFavorite nhanh
  bookmarkedStories: Story[];    // full story objects — dùng để hiển thị
  history: HistoryItem[];

  addBookmark: (storyId: string) => Promise<void>;
  removeBookmark: (storyId: string) => Promise<void>;
  addToHistory: (storyId: string, chapterId: string, chapterNumber: number) => Promise<void>;
  loadData: () => Promise<void>;
}

export const useBookshelfStore = create<BookshelfStore>((set, get) => ({
  bookmarks: [],
  bookmarkedStories: [],
  history: [],

  addBookmark: async (storyId) => {
    if (get().bookmarks.includes(storyId)) return;
    await bookmarkService.addBookmark(storyId);
    set((s) => ({ bookmarks: [...s.bookmarks, storyId] }));
    // re-fetch để có full story object
    bookmarkService.getBookmarks().then((stories) =>
      set({ bookmarkedStories: stories, bookmarks: stories.map((s) => s.id) })
    ).catch(() => {});
  },

  removeBookmark: async (storyId) => {
    await bookmarkService.removeBookmark(storyId);
    set((s) => ({
      bookmarks: s.bookmarks.filter((id) => id !== storyId),
      bookmarkedStories: s.bookmarkedStories.filter((st) => st.id !== storyId),
    }));
  },

  addToHistory: async (storyId, chapterId, chapterNumber) => {
    await historyService.upsertHistory({ storyId, chapterId, chapterNumber });
    set((s) => {
      const filtered = s.history.filter((h) => h.storyId !== storyId);
      return {
        history: [
          { storyId, chapterId, chapterNumber, readAt: new Date().toISOString() },
          ...filtered,
        ].slice(0, 50),
      };
    });
  },

  loadData: async () => {
    const [stories, history] = await Promise.all([
      bookmarkService.getBookmarks(),
      historyService.getHistory(),
    ]);
    set({
      bookmarkedStories: stories,
      bookmarks: stories.map((s) => s.id),
      history,
    });
  },
}));
