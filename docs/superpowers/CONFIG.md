# Hướng dẫn Config — Plan 06 & 07

---

## Plan 06 — Performance (không cần config thêm)

Tất cả thay đổi đã hoạt động ngay, không cần config môi trường.

| Tính năng | Trạng thái |
|-----------|-----------|
| React.memo cho StoryCard / StoryCardHorizontal / ChapterItem | ✅ Hoạt động ngay |
| expo-image với blurhash placeholder | ✅ Hoạt động ngay (package đã cài) |
| FlatList tuning (windowSize, batchSize...) | ✅ Hoạt động ngay |
| ParagraphText memo trong reader | ✅ Hoạt động ngay |

---

## Plan 07 — Cloudflare R2

### Bước 1: Tạo tài khoản & cài Wrangler

```bash
npm install -g wrangler
wrangler login   # mở trình duyệt để xác thực Cloudflare account
```

### Bước 2: Tạo R2 Bucket

```bash
wrangler r2 bucket create truyen-bucket
```

> Tên bucket phải khớp với `bucket_name` trong `cloudflare/wrangler.toml` (hiện là `truyen-bucket`).

### Bước 3: Deploy Cloudflare Worker

```bash
cd cloudflare
wrangler deploy
```

Sau khi deploy, Wrangler in ra URL dạng:
```
https://truyen-api.<your-subdomain>.workers.dev
```

Ghi lại URL này — cần dùng ở bước tiếp theo.

### Bước 4: Cấu hình URL Worker trong app

Tạo file `.env.local` ở **thư mục gốc** dự án (file này đã có trong `.gitignore`, không bị commit):

```
EXPO_PUBLIC_WORKER_URL=https://truyen-api.<your-subdomain>.workers.dev
```

> Nếu không set biến này, app sẽ tự dùng mock data làm fallback (không crash).

### Bước 5: Upload dữ liệu lên R2

```bash
# Chạy từ thư mục gốc dự án:
node cloudflare/upload-stories.js
```

Script này upload:
- `stories/index.json` — danh sách tất cả truyện
- `stories/{id}.json` — chi tiết từng truyện
- `chapters/{storyId}/{chapterId}.json` — nội dung từng chương (50 chương × mỗi truyện)

### Bước 6: Test local với Wrangler Dev

```bash
cd cloudflare
wrangler dev   # chạy Worker ở http://localhost:8787
```

Đặt tạm trong `.env.local`:
```
EXPO_PUBLIC_WORKER_URL=http://localhost:8787
```

---

## Kiến trúc dữ liệu R2

```
truyen-bucket/
  stories/
    index.json          ← GET /stories
    1.json              ← GET /stories/1
    2.json              ← GET /stories/2
    ...
  chapters/
    1/
      1-chapter-1.json  ← GET /chapters/1/1-chapter-1
      1-chapter-2.json
      ...
```

---

## Fallback tự động (khi Worker chưa setup)

Cả `useStories` và `useChapter` đều có **mock fallback**:

- `useStories` — nếu fetch lỗi → dùng `MOCK_STORIES` từ `src/data/mockStories.ts`
- `useChapter` — nếu fetch lỗi → dùng `getMockChapters()` từ `src/data/mockChapters.ts`

App sẽ **không crash** khi chưa có Worker. Hiện tại app chạy bình thường với mock data.

---

## Tóm tắt files cần chú ý

| File | Mục đích | Cần config? |
|------|----------|-------------|
| `cloudflare/wrangler.toml` | Config Worker & R2 binding | Đổi `bucket_name` nếu dùng tên khác |
| `cloudflare/worker.js` | API Gateway chạy trên Cloudflare | Deploy bằng `wrangler deploy` |
| `cloudflare/upload-stories.js` | Upload mock data lên R2 | Chạy 1 lần sau khi tạo bucket |
| `.env.local` *(chưa có, tự tạo)* | URL Worker cho app | **BẮT BUỘC** để app fetch từ R2 |
| `src/services/storyService.ts` | HTTP client gọi Worker | Không cần đổi |
| `src/hooks/useStories.ts` | Hook fetch danh sách truyện | Không cần đổi |
| `src/hooks/useChapter.ts` | Hook fetch nội dung chương | Không cần đổi |
