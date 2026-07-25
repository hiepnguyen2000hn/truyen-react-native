import { useState, useEffect } from "react";
import { Story } from "../types/story";
import { storyService } from "../services/storyService";
import { MOCK_STORIES } from "../data/mockStories";

interface UseStoriesResult {
  stories: Story[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

let storiesCache: Story[] | null = null;

export function useStories(): UseStoriesResult {
  const [stories, setStories] = useState<Story[]>(storiesCache ?? MOCK_STORIES);
  const [loading, setLoading] = useState(!storiesCache);
  const [error, setError] = useState<string | null>(null);

  async function fetchStories() {
    setLoading(true);
    setError(null);
    try {
      const data = await storyService.getStories();
      storiesCache = data;
      setStories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối");
      if (!storiesCache) setStories(MOCK_STORIES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storiesCache) fetchStories();
  }, []);

  return { stories, loading, error, refresh: fetchStories };
}
