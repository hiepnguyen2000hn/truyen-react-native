import { apiClient } from "../lib/apiClient";
import { Story } from "../types/story";
import { PaginatedResponse, StoriesQuery } from "../types/api";

function buildQuery(params: Record<string, unknown> | object): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const storyService = {
  getStories(query: StoriesQuery = {}): Promise<PaginatedResponse<Story>> {
    return apiClient.get(`/api/v1/stories${buildQuery(query as Record<string, unknown>)}`);
  },

  async getStory(id: string): Promise<Story> {
    const res = await apiClient.get<{ data: Story } | Story>(`/api/v1/stories/${id}`);
    return (res as { data: Story }).data ?? (res as Story);
  },
};
