import { useState, useEffect } from "react";
import { Chapter } from "../types/story";
import { chapterService } from "../services/chapterService";

interface UseChapterListResult {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
}

const listCache = new Map<string, Chapter[]>();

export function useChapterList(storyId: string): UseChapterListResult {
  const [chapters, setChapters] = useState<Chapter[]>(listCache.get(storyId) ?? []);
  const [loading, setLoading] = useState(!listCache.has(storyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listCache.has(storyId)) {
      setChapters(listCache.get(storyId)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    chapterService
      .getChapters(storyId, { limit: 100, order: "asc" })
      .then((res) => {
        const data: import("../types/story").Chapter[] = Array.isArray(res) ? res : (res.data ?? []);
        listCache.set(storyId, data);
        setChapters(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Lỗi kết nối"))
      .finally(() => setLoading(false));
  }, [storyId]);

  return { chapters, loading, error };
}
