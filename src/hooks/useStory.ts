import { useState, useEffect } from "react";
import { Story } from "../types/story";
import { storyService } from "../services/storyService";

interface UseStoryResult {
  story: Story | null;
  loading: boolean;
  error: string | null;
}

const storyCache = new Map<string, Story>();

export function useStory(id: string): UseStoryResult {
  const [story, setStory] = useState<Story | null>(storyCache.get(id) ?? null);
  const [loading, setLoading] = useState(!storyCache.has(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyCache.has(id)) {
      setStory(storyCache.get(id)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    storyService
      .getStory(id)
      .then((data) => {
        storyCache.set(id, data);
        setStory(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Lỗi kết nối"))
      .finally(() => setLoading(false));
  }, [id]);

  return { story, loading, error };
}
