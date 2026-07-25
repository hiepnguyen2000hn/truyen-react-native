/**
 * Upload mock data to R2 bucket.
 * Run from repo root: node cloudflare/upload-stories.js
 * Requires: wrangler CLI logged in, truyen-bucket created.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const MOCK_STORIES_PATH = path.join(__dirname, "mock-stories.json");
const BUCKET = "truyen-bucket";

if (!fs.existsSync(MOCK_STORIES_PATH)) {
  console.error("❌ mock-stories.json not found. Generate it first:");
  console.error("   node -e \"const d=require('./src/data/mockStories'); require('fs').writeFileSync('./cloudflare/mock-stories.json', JSON.stringify(d.MOCK_STORIES, null, 2))\"");
  process.exit(1);
}

const MOCK_STORIES = JSON.parse(fs.readFileSync(MOCK_STORIES_PATH, "utf8"));

function r2Put(key, json) {
  const tmp = path.join(require("os").tmpdir(), `r2-upload-${Date.now()}.json`);
  fs.writeFileSync(tmp, json);
  execSync(`wrangler r2 object put ${BUCKET}/${key} --file ${tmp} --content-type application/json`);
  fs.unlinkSync(tmp);
}

async function run() {
  // Upload stories/index.json — lightweight list
  const index = MOCK_STORIES.map((s) => ({
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
    description: s.description ? s.description.slice(0, 200) : "",
  }));
  r2Put("stories/index.json", JSON.stringify(index, null, 2));
  console.log("✅ Uploaded stories/index.json");

  // Upload each story detail
  for (const story of MOCK_STORIES) {
    r2Put(`stories/${story.id}.json`, JSON.stringify(story, null, 2));
    console.log(`✅ Uploaded stories/${story.id}.json`);
  }

  // Upload mock chapters for each story
  // Inline mock chapter generator (mirrors src/data/mockChapters.ts)
  const CHAPTER_CONTENT = `Tiêu Viêm bước vào phòng thi đấu, ánh mắt lạnh lùng quét qua những kẻ địch.\n\nAnh ta hiểu rõ hơn ai hết rằng trong thế giới này, sức mạnh là tất cả.`;

  for (const story of MOCK_STORIES) {
    const chapters = Array.from({ length: 50 }, (_, i) => ({
      id: `${story.id}-chapter-${i + 1}`,
      storyId: story.id,
      number: i + 1,
      title: `Chương ${i + 1}: ${["Bình Minh Mới", "Thử Thách", "Đỉnh Cao", "Bí Ẩn", "Chiến Đấu"][i % 5]}`,
      content: CHAPTER_CONTENT,
      wordCount: 1200 + Math.floor(Math.random() * 800),
      publishedAt: new Date(Date.now() - (50 - i) * 86400000 * 3).toISOString().split("T")[0],
    }));

    for (const ch of chapters) {
      r2Put(`chapters/${story.id}/${ch.id}.json`, JSON.stringify(ch, null, 2));
    }
    console.log(`✅ Uploaded ${chapters.length} chapters for "${story.title}"`);
  }

  console.log("\n🎉 Done! All data uploaded to R2.");
}

run().catch((err) => {
  console.error("❌ Upload failed:", err.message);
  process.exit(1);
});
