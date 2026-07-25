# Plan 07: Lấy Truyện từ Cloudflare R2

> **Mục tiêu:** Thay mock data bằng nội dung thật lấy từ Cloudflare R2. Setup: (1) R2 bucket lưu JSON metadata truyện và nội dung chương; (2) Cloudflare Worker làm API gateway; (3) App fetch từ Worker endpoint thay vì dùng mockStories/mockChapters.

**Architecture:**
```
App (React Native)
  → Cloudflare Worker (API gateway, auth, CORS)
    → R2 Bucket (JSON files)
```

**R2 File Structure:**
```
r2://truyen-bucket/
  stories/
    index.json          ← danh sách tất cả truyện (metadata)
    {storyId}.json      ← chi tiết 1 truyện + chapters list
  chapters/
    {storyId}/
      {chapterId}.json  ← nội dung 1 chương
  covers/
    {storyId}.jpg       ← ảnh bìa (public R2 URL)
```

---

## File Map

| Action | Path |
|--------|------|
| **Create** | `cloudflare/worker.js` — Cloudflare Worker script |
| **Create** | `cloudflare/upload-stories.js` — script upload mock data lên R2 |
| **Create** | `src/services/storyService.ts` — fetch từ Worker |
| **Create** | `src/hooks/useStories.ts` — hook với cache |
| **Create** | `src/hooks/useChapter.ts` — hook fetch chapter content |
| **Modify** | `app/(tabs)/index.tsx` — dùng useStories thay mock |
| **Modify** | `app/(tabs)/discover.tsx` — dùng useStories |
| **Modify** | `app/story/[id].tsx` — dùng useChapter |
| **Modify** | `app/reader/[storyId]/[chapterId].tsx` — fetch chapter content |

---

## Task 1: Setup Cloudflare Worker (API Gateway)

**Lưu ý:** Cần có Cloudflare account + R2 bucket. Nếu chưa có, dùng `wrangler` CLI.

**Files:**
- Create: `cloudflare/wrangler.toml`
- Create: `cloudflare/worker.js`

- [ ] **Step 1: Cài Wrangler CLI**

```bash
npm install -g wrangler
wrangler login
```

- [ ] **Step 2: Tạo R2 bucket**

```bash
wrangler r2 bucket create truyen-bucket
```

- [ ] **Step 3: Tạo wrangler.toml**

`cloudflare/wrangler.toml`:
```toml
name = "truyen-api"
main = "worker.js"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "TRUYEN_BUCKET"
bucket_name = "truyen-bucket"

[vars]
ALLOWED_ORIGIN = "exp://localhost:8081"
```

- [ ] **Step 4: Tạo Worker**

`cloudflare/worker.js`:
```js
export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname; // e.g. /stories, /stories/1, /chapters/1/chapter-1

    try {
      let key;

      if (path === "/stories") {
        key = "stories/index.json";
      } else if (path.match(/^\/stories\/[\w-]+$/)) {
        const storyId = path.split("/")[2];
        key = `stories/${storyId}.json`;
      } else if (path.match(/^\/chapters\/[\w-]+\/[\w-]+$/)) {
        const parts = path.split("/");
        key = `chapters/${parts[2]}/${parts[3]}.json`;
      } else {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const object = await env.TRUYEN_BUCKET.get(key);

      if (!object) {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const body = await object.text();
      return new Response(body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // cache 5 phút
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
```

- [ ] **Step 5: Deploy Worker**

```bash
cd cloudflare && wrangler deploy
```

Ghi lại URL Worker: `https://truyen-api.your-subdomain.workers.dev`

- [ ] **Step 6: Commit cloudflare config**
```bash
git add cloudflare/
git commit -m "feat: Cloudflare Worker as R2 API gateway"
```

---

## Task 2: Upload mock data lên R2

**Files:**
- Create: `cloudflare/upload-stories.js`

- [ ] **Step 1: Tạo upload script**

`cloudflare/upload-stories.js`:
```js
const { execSync } = require("child_process");
const path = require("path");

// Import mock data (cần compile TypeScript trước hoặc dùng ts-node)
// Hoặc copy nội dung mockStories.ts thành JSON

const MOCK_STORIES = require("./mock-stories.json"); // tạo file này
const BUCKET = "truyen-bucket";

async function uploadStories() {
  // Upload index.json (danh sách tất cả truyện)
  const indexJson = JSON.stringify(
    MOCK_STORIES.map(s => ({
      id: s.id,
      title: s.title,
      author: s.author,
      coverUrl: s.coverUrl,
      genres: s.genres,
      totalChapters: s.totalChapters,
      viewCount: s.viewCount,
      rating: s.rating,
      status: s.status,
      updatedAt: s.updatedAt,
      description: s.description.slice(0, 200), // short description for list
    }))
  );

  execSync(`echo '${indexJson}' | wrangler r2 object put ${BUCKET}/stories/index.json --content-type application/json --pipe`);
  console.log("✅ Uploaded stories/index.json");

  // Upload từng story detail
  for (const story of MOCK_STORIES) {
    const storyJson = JSON.stringify(story);
    execSync(`echo '${storyJson}' | wrangler r2 object put ${BUCKET}/stories/${story.id}.json --content-type application/json --pipe`);
    console.log(`✅ Uploaded stories/${story.id}.json`);
  }
}

uploadStories().catch(console.error);
```

- [ ] **Step 2: Tạo mock-stories.json từ TypeScript**

```bash
# Chạy trong thư mục project root:
cd /home/user/truyen-react-native
npx ts-node -e "
const { MOCK_STORIES } = require('./src/data/mockStories');
const fs = require('fs');
fs.writeFileSync('./cloudflare/mock-stories.json', JSON.stringify(MOCK_STORIES, null, 2));
console.log('Done');
"
```

- [ ] **Step 3: Upload chapters**

Thêm vào `upload-stories.js`:
```js
// Upload mock chapters cho từng story
const { getMockChapters } = require("./mock-chapters"); // tương tự

for (const story of MOCK_STORIES) {
  const chapters = getMockChapters(story.id);
  for (const chapter of chapters) {
    const chJson = JSON.stringify(chapter);
    execSync(`echo '${chJson}' | wrangler r2 object put ${BUCKET}/chapters/${story.id}/${chapter.id}.json --content-type application/json --pipe`);
  }
  console.log(`✅ Uploaded ${chapters.length} chapters for ${story.title}`);
}
```

- [ ] **Step 4: Commit**
```bash
git add cloudflare/upload-stories.js cloudflare/mock-stories.json
git commit -m "feat: R2 upload script for stories and chapters"
```

---

## Task 3: Tạo storyService.ts

**Files:**
- Create: `src/services/storyService.ts`

- [ ] **Step 1: Tạo service với fetch + error handling**

`src/services/storyService.ts`:
```ts
import { Story, Chapter } from "../types/story";

// Thay bằng URL Worker thật sau khi deploy
const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL ?? "https://truyen-api.your-subdomain.workers.dev";

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
    throw new StoryServiceError(`HTTP ${response.status} for ${path}`, response.status);
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
    // Worker trả về story.json có chapters list
    const story = await fetchJSON<Story & { chapters?: Chapter[] }>(`/stories/${storyId}`);
    return story.chapters ?? [];
  },
};
```

- [ ] **Step 2: Thêm EXPO_PUBLIC_WORKER_URL vào .env**

Tạo `.env.local` (không commit):
```
EXPO_PUBLIC_WORKER_URL=https://truyen-api.your-subdomain.workers.dev
```

Thêm `.env.local` vào `.gitignore`.

- [ ] **Step 3: Commit**
```bash
git add src/services/storyService.ts
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "feat: storyService fetching from Cloudflare Worker"
```

---

## Task 4: Tạo hooks với local cache

**Files:**
- Create: `src/hooks/useStories.ts`
- Create: `src/hooks/useChapter.ts`

- [ ] **Step 1: useStories hook**

`src/hooks/useStories.ts`:
```ts
import { useState, useEffect } from "react";
import { Story } from "../types/story";
import { storyService } from "../services/storyService";
import { MOCK_STORIES } from "../data/mockStories"; // fallback

interface UseStoriesResult {
  stories: Story[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// In-memory cache
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
      // Giữ mock data làm fallback
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
```

- [ ] **Step 2: useChapter hook**

`src/hooks/useChapter.ts`:
```ts
import { useState, useEffect } from "react";
import { Chapter } from "../types/story";
import { storyService } from "../services/storyService";
import { getMockChapters } from "../data/mockChapters"; // fallback

const chapterCache = new Map<string, Chapter>();

interface UseChapterResult {
  chapter: Chapter | null;
  loading: boolean;
  error: string | null;
}

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
    storyService.getChapter(storyId, chapterId)
      .then((data) => {
        chapterCache.set(cacheKey, data);
        setChapter(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Lỗi kết nối");
        // Fallback về mock
        const mockChapters = getMockChapters(storyId);
        const mock = mockChapters.find(c => c.id === chapterId);
        if (mock) setChapter(mock);
      })
      .finally(() => setLoading(false));
  }, [storyId, chapterId]);

  return { chapter, loading, error };
}
```

- [ ] **Step 3: Commit**
```bash
git add src/hooks/useStories.ts src/hooks/useChapter.ts
git commit -m "feat: useStories and useChapter hooks with R2 fetch and mock fallback"
```

---

## Task 5: Wire vào screens

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/discover.tsx`
- Modify: `app/reader/[storyId]/[chapterId].tsx`

- [ ] **Step 1: Home screen dùng useStories**

`app/(tabs)/index.tsx`:
```tsx
import { useStories } from "../../src/hooks/useStories";

export default function HomeScreen() {
  const { stories, loading, refresh } = useStories();

  // Thay FEATURED_STORIES, TRENDING_STORIES, RECENT_STORIES bằng derived từ `stories`:
  const featuredStories = stories.slice(0, 5);
  const trendingStories = [...stories].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
  const recentStories = [...stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);

  // Thêm loading indicator và RefreshControl với refresh callback
  // ...
}
```

- [ ] **Step 2: Discover screen dùng useStories**

Tương tự — thay `MOCK_STORIES` bằng `stories` từ hook.

- [ ] **Step 3: Reader screen dùng useChapter**

`app/reader/[storyId]/[chapterId].tsx`:
```tsx
import { useChapter } from "../../../src/hooks/useChapter";

export default function ReaderScreen() {
  const { storyId, chapterId } = useLocalSearchParams<...>();
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);

  const { chapter, loading, error } = useChapter(storyId, currentChapterId);
  const { stories } = useStories();
  const story = stories.find(s => s.id === storyId);

  // Hiện loading spinner khi fetch chapter
  if (loading && !chapter) return <LoadingSpinner />;
  if (error && !chapter) return <ErrorView message={error} onRetry={...} />;

  // ...rest giữ nguyên
}
```

- [ ] **Step 4: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add app/(tabs)/index.tsx app/(tabs)/discover.tsx app/reader/[storyId]/[chapterId].tsx
git commit -m "feat: wire useStories/useChapter into screens, R2 data with mock fallback"
```

---

## Manual Test Checklist

1. Set EXPO_PUBLIC_WORKER_URL trong .env.local
2. Chạy Worker locally: `cd cloudflare && wrangler dev`
3. App fetch `/stories` → thấy danh sách truyện (same data, từ R2)
4. Tap vào truyện → fetch `/stories/{id}` → detail đúng
5. Đọc chương → fetch `/chapters/{storyId}/{chapterId}` → nội dung load
6. Tắt Worker (offline mode) → app fallback về mock data, không crash
7. Pull-to-refresh → re-fetch từ R2
8. Chuyển chương → cache hit (không fetch lại chapter đã đọc)
9. Deploy Worker production: `cd cloudflare && wrangler deploy`
10. Test với URL production
