import { useState, useEffect } from "react";
import { Chapter } from "../types/story";
import { storyService } from "../services/storyService";
import { getMockChapters } from "../data/mockChapters";

interface UseChapterResult {
  chapter: Chapter | null;
  loading: boolean;
  error: string | null;
}

const chapterCache = new Map<string, Chapter>();

export function useChapter(storyId: string, chapterId: string): UseChapterResult {
  const cacheKey = `${storyId}/${chapterId}`;
  const [chapter, setChapter] = useState<Chapter | null>(
    chapterCache.get(cacheKey) ?? null
  );
  const [loading, setLoading] = useState(!chapterCache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapterCache.has(cacheKey)) {
      setChapter(chapterCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    storyService
      .getChapter(storyId, chapterId)
      .then((data) => {
        chapterCache.set(cacheKey, data);
        setChapter(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Lỗi kết nối");
        const mockChapters = getMockChapters(storyId);
        const mock = mockChapters.find((c) => c.id === chapterId);
        if (mock) {
          chapterCache.set(cacheKey, mock);
          setChapter(mock);
        }
      })
      .finally(() => setLoading(false));
  }, [storyId, chapterId]);

  return { chapter, loading, error };
}
