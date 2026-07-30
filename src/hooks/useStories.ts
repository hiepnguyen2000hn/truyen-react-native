import { useState, useEffect, useCallback } from "react";
import { Story } from "../types/story";
import { StoriesQuery } from "../types/api";
import { storyService } from "../services/storyService";

interface UseStoriesResult {
  stories: Story[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const DEFAULT_LIMIT = 20;

export function useStories(query: StoriesQuery = {}): UseStoriesResult {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await storyService.getStories({
          ...query,
          page: pageNum,
          limit: query.limit ?? DEFAULT_LIMIT,
        });
        const items = Array.isArray(res) ? res : (res.data ?? []);
        const totalCount = Array.isArray(res) ? res.length : (res.meta?.total ?? items.length);
        setTotal(totalCount);
        setStories((prev) => (replace ? items : [...prev, ...items]));
        setPage(pageNum);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi kết nối");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(query)]
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  async function refresh() {
    await fetchPage(1, true);
  }

  async function loadMore() {
    if (loading || stories.length >= total) return;
    await fetchPage(page + 1, false);
  }

  return { stories, loading, error, total, hasMore: stories.length < total, refresh, loadMore };
}
