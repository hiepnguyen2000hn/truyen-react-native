import { useState, useEffect } from "react";
import { Chapter } from "../types/story";
import { chapterService } from "../services/chapterService";

interface UseChapterResult {
  chapter: Chapter | null;
  loading: boolean;
  error: string | null;
}

const chapterCache = new Map<string, Chapter>();

export function useChapter(storyId: string, chapterNumber: number): UseChapterResult {
  const cacheKey = `${storyId}/${chapterNumber}`;
  const [chapter, setChapter] = useState<Chapter | null>(chapterCache.get(cacheKey) ?? null);
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

    chapterService
      .getChapterByNumber(storyId, chapterNumber)
      .then((data) => {
        chapterCache.set(cacheKey, data);
        setChapter(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Lỗi kết nối"))
      .finally(() => setLoading(false));
  }, [storyId, chapterNumber]);

  return { chapter, loading, error };
}
