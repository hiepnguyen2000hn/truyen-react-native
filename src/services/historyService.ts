import { apiClient } from "../lib/apiClient";

export interface HistoryItem {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  readAt: string;
}

export const historyService = {
  getHistory(): Promise<HistoryItem[]> {
    return apiClient.get("/api/v1/me/history");
  },

  upsertHistory(item: Omit<HistoryItem, "readAt">): Promise<void> {
    return apiClient.post("/api/v1/me/history", item);
  },

  clearHistory(): Promise<void> {
    return apiClient.delete("/api/v1/me/history");
  },
};
