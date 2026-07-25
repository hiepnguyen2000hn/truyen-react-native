import { Story, Chapter } from "../types/story";

const WORKER_URL =
  process.env.EXPO_PUBLIC_WORKER_URL ??
  "https://truyen-api.your-subdomain.workers.dev";

class StoryServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "StoryServiceError";
  }
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${WORKER_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new StoryServiceError(
      `HTTP ${response.status} for ${path}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

export const storyService = {
  async getStories(): Promise<Story[]> {
    return fetchJSON<Story[]>("/stories");
  },

  async getStory(id: string): Promise<Story> {
    return fetchJSON<Story>(`/stories/${id}`);
  },

  async getChapter(storyId: string, chapterId: string): Promise<Chapter> {
    return fetchJSON<Chapter>(`/chapters/${storyId}/${chapterId}`);
  },

  async getChapters(storyId: string): Promise<Chapter[]> {
    const story = await fetchJSON<Story & { chapters?: Chapter[] }>(
      `/stories/${storyId}`
    );
    return story.chapters ?? [];
  },
};
