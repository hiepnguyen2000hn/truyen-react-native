import { apiClient } from "../lib/apiClient";
import { Story } from "../types/story";

export interface BookmarkCheckResult {
  bookmarked: boolean;
}

export const bookmarkService = {
  getBookmarks(): Promise<Story[]> {
    return apiClient.get("/api/v1/me/bookmarks");
  },

  addBookmark(storyId: string): Promise<void> {
    return apiClient.post(`/api/v1/me/bookmarks/${storyId}`);
  },

  removeBookmark(storyId: string): Promise<void> {
    return apiClient.delete(`/api/v1/me/bookmarks/${storyId}`);
  },

  checkBookmark(storyId: string): Promise<BookmarkCheckResult> {
    return apiClient.get(`/api/v1/me/bookmarks/${storyId}/check`);
  },
};
