import { apiClient } from "../lib/apiClient";
import { Chapter } from "../types/story";
import { PaginatedResponse, ChaptersQuery } from "../types/api";

function buildQuery(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const chapterService = {
  getChapters(
    storyId: string,
    query: ChaptersQuery = {}
  ): Promise<PaginatedResponse<Chapter>> {
    return apiClient.get(
      `/api/v1/stories/${storyId}/chapters${buildQuery(query as Record<string, unknown>)}`
    );
  },

  async getChapterByNumber(storyId: string, number: number): Promise<Chapter> {
    const res = await apiClient.get<{ data: Chapter } | Chapter>(
      `/api/v1/stories/${storyId}/chapters/${number}`
    );
    return (res as { data: Chapter }).data ?? (res as Chapter);
  },
};
