# App Đọc Truyện — React Native Expo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng ứng dụng đọc truyện mobile (React Native Expo) với 4 tab chính, reader màn đọc có dark mode, và xác thực người dùng.

**Architecture:** Tab navigation (Home, Khám Phá, Tủ Sách, Profile) với Stack navigator trong mỗi tab. State quản lý bằng Zustand. Data mock ban đầu, sau thay bằng API thật.

**Tech Stack:** Expo SDK 52, React Native, TypeScript, Expo Router v4 (file-based routing), Zustand (state), NativeWind v4 (Tailwind styling), React Native Reanimated 3, AsyncStorage, Expo Secure Store.

## Global Constraints

- Expo SDK 52, target iOS 16+ / Android 10+
- TypeScript strict mode (`"strict": true`)
- NativeWind v4 cho styling — không dùng StyleSheet trừ trường hợp dynamic
- Expo Router v4 — file-based routing trong `app/` directory
- Tất cả text UI dùng tiếng Việt
- Font chữ đọc truyện: hỗ trợ 3 size (nhỏ/vừa/lớn = 15/17/20px)
- Dark mode reader: background `#1a1a1a`, text `#e0e0e0`
- Light mode reader: background `#fdf6e3`, text `#2c2c2c`

---

## File Structure

```
app/
  _layout.tsx                    # Root layout — font loading, auth gate
  (auth)/
    _layout.tsx                  # Auth stack layout
    login.tsx                    # Màn đăng nhập
    register.tsx                 # Màn đăng ký
  (tabs)/
    _layout.tsx                  # Tab bar layout
    index.tsx                    # Tab Home
    discover.tsx                 # Tab Khám Phá
    bookshelf.tsx                # Tab Tủ Sách
    profile.tsx                  # Tab Profile
  story/
    [id].tsx                     # Chi tiết truyện
    [id]/chapters.tsx            # Danh sách chương
  reader/
    [storyId]/[chapterId].tsx    # Màn đọc truyện

src/
  components/
    ui/
      Button.tsx                 # Nút bấm tái sử dụng
      Input.tsx                  # Input text
      Badge.tsx                  # Tag thể loại
      LoadingSpinner.tsx         # Loading indicator
    story/
      StoryCard.tsx              # Card truyện dạng grid
      StoryCardHorizontal.tsx    # Card truyện dạng ngang (featured)
      ChapterItem.tsx            # Row một chương
      GenreTag.tsx               # Tag thể loại
    reader/
      ReaderToolbar.tsx          # Toolbar trên/dưới khi đọc
      ReaderSettings.tsx         # Bottom sheet cài đặt đọc
      ReaderContent.tsx          # Vùng hiển thị nội dung

  stores/
    authStore.ts                 # Auth state (user, token, login/logout)
    readerStore.ts               # Reader preferences (font size, theme)
    bookshelfStore.ts            # Bookmarks, reading history

  services/
    api.ts                       # Axios instance + interceptors
    storyService.ts              # CRUD truyện, chương
    authService.ts               # Login, register, refresh token

  data/
    mockStories.ts               # Mock data 20+ truyện
    mockChapters.ts              # Mock data chương

  types/
    story.ts                     # Story, Chapter, Genre types
    auth.ts                      # User, AuthState types
    reader.ts                    # ReaderSettings type

  hooks/
    useStories.ts                # Fetch + cache stories
    useChapter.ts                # Fetch chapter content
    useAuth.ts                   # Auth helpers
    useBookshelf.ts              # Bookmark/history helpers

  utils/
    storage.ts                   # AsyncStorage helpers (typed)
    format.ts                    # Format date, số chương, số từ
```

---

## Task 1: Project Setup + Navigation Scaffold

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `src/types/story.ts`
- Create: `src/types/auth.ts`
- Create: `src/types/reader.ts`

**Interfaces:**
- Produces:
  - `Story`, `Chapter`, `Genre` types (dùng ở mọi task sau)
  - `User`, `AuthState` types
  - `ReaderSettings` type
  - Tab navigation: 4 tab (Home, Khám Phá, Tủ Sách, Profile)

- [ ] **Step 1: Khởi tạo Expo project**

```bash
npx create-expo-app@latest truyen-react-native --template blank-typescript
cd truyen-react-native
```

- [ ] **Step 2: Cài dependencies**

```bash
npx expo install expo-router expo-font expo-status-bar expo-secure-store @react-native-async-storage/async-storage
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens
npm install zustand nativewind tailwindcss
npm install axios
npx expo install @expo/vector-icons
```

- [ ] **Step 3: Cấu hình NativeWind + Tailwind**

Tạo `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#E94057",
        "primary-dark": "#c73347",
        surface: "#fff",
        "surface-dark": "#1e1e1e",
        "bg-reader-light": "#fdf6e3",
        "bg-reader-dark": "#1a1a1a",
      },
    },
  },
  plugins: [],
};
```

Tạo `babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

Tạo `metro.config.js`:
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

Tạo `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Cấu hình app.json cho Expo Router**

```json
{
  "expo": {
    "name": "Đọc Truyện",
    "slug": "doc-truyen",
    "scheme": "doctruyen",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "backgroundColor": "#E94057" },
    "android": { "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#E94057" } },
    "plugins": ["expo-router", "expo-font", "expo-secure-store"]
  }
}
```

- [ ] **Step 5: Tạo type definitions**

`src/types/story.ts`:
```ts
export interface Genre {
  id: string;
  name: string;
  color: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  genres: Genre[];
  totalChapters: number;
  viewCount: number;
  rating: number;
  status: "ongoing" | "completed";
  updatedAt: string;
}

export interface Chapter {
  id: string;
  storyId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  publishedAt: string;
}
```

`src/types/auth.ts`:
```ts
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
}
```

`src/types/reader.ts`:
```ts
export type ReaderTheme = "light" | "dark" | "sepia";
export type FontSize = "small" | "medium" | "large";

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  fontSizePx: number;
}
```

- [ ] **Step 6: Root layout**

`app/_layout.tsx`:
```tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="story/[id]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="reader/[storyId]/[chapterId]" options={{ headerShown: false }} />
    </Stack>
  );
}
```

- [ ] **Step 7: Tab layout**

`app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E94057",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { borderTopColor: "#f0f0f0", height: 60, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang Chủ",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Khám Phá",
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookshelf"
        options={{
          title: "Tủ Sách",
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá Nhân",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 8: Tạo placeholder screens để test navigation**

`app/(tabs)/index.tsx`:
```tsx
import { View, Text } from "react-native";
export default function HomeScreen() {
  return <View className="flex-1 items-center justify-center"><Text>Home</Text></View>;
}
```

Tương tự cho `discover.tsx`, `bookshelf.tsx`, `profile.tsx`.

- [ ] **Step 9: Chạy và kiểm tra navigation**

```bash
npx expo start
```

Mở app trên Expo Go hoặc simulator. Kiểm tra:
- 4 tab xuất hiện ở bottom
- Chuyển tab không lỗi
- Màu active tab là `#E94057`

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: project setup, navigation scaffold, type definitions"
```

---

## Task 2: Mock Data + State Stores

**Files:**
- Create: `src/data/mockStories.ts`
- Create: `src/data/mockChapters.ts`
- Create: `src/stores/authStore.ts`
- Create: `src/stores/readerStore.ts`
- Create: `src/stores/bookshelfStore.ts`
- Create: `src/utils/storage.ts`

**Interfaces:**
- Consumes: `Story`, `Chapter`, `Genre`, `User`, `ReaderSettings` từ Task 1
- Produces:
  - `useAuthStore()` — `{ user, isLoggedIn, login(user,token), logout() }`
  - `useReaderStore()` — `{ settings, setTheme(t), setFontSize(s) }`
  - `useBookshelfStore()` — `{ bookmarks, history, addBookmark(storyId), removeBookmark(storyId), addToHistory(storyId, chapterId) }`
  - `MOCK_STORIES: Story[]` — 15 truyện
  - `getMockChapters(storyId): Chapter[]` — 10 chương mỗi truyện

- [ ] **Step 1: Tạo mock data truyện**

`src/data/mockStories.ts`:
```ts
import { Story } from "../types/story";

export const MOCK_STORIES: Story[] = [
  {
    id: "1",
    title: "Đấu Phá Thương Khung",
    author: "Thiên Tàm Thổ Đậu",
    coverUrl: "https://picsum.photos/seed/story1/200/300",
    description: "Tại thế giới này, không có ma pháp chỉ có đấu khí. Tiêu Viêm, một thiên tài bị phế bỏ...",
    genres: [{ id: "1", name: "Huyền Huyễn", color: "#8b5cf6" }, { id: "2", name: "Tu Tiên", color: "#06b6d4" }],
    totalChapters: 1648,
    viewCount: 15200000,
    rating: 4.8,
    status: "completed",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Toàn Chức Pháp Sư",
    author: "Loạn",
    coverUrl: "https://picsum.photos/seed/story2/200/300",
    description: "Thế giới dị giới kỳ diệu nơi phép thuật thống trị...",
    genres: [{ id: "1", name: "Huyền Huyễn", color: "#8b5cf6" }, { id: "3", name: "Phiêu Lưu", color: "#f59e0b" }],
    totalChapters: 2400,
    viewCount: 12800000,
    rating: 4.7,
    status: "completed",
    updatedAt: "2024-02-20",
  },
  {
    id: "3",
    title: "Võ Luyện Đỉnh Phong",
    author: "Mặc Mặc",
    coverUrl: "https://picsum.photos/seed/story3/200/300",
    description: "Hành trình tu luyện từ tầm thường đến đỉnh cao...",
    genres: [{ id: "2", name: "Tu Tiên", color: "#06b6d4" }],
    totalChapters: 890,
    viewCount: 8500000,
    rating: 4.5,
    status: "ongoing",
    updatedAt: "2026-07-20",
  },
  {
    id: "4",
    title: "Cô Nàng Ký Sự",
    author: "Nguyên Lai Thị Bằng",
    coverUrl: "https://picsum.photos/seed/story4/200/300",
    description: "Câu chuyện tình cảm lãng mạn của đôi trẻ...",
    genres: [{ id: "4", name: "Ngôn Tình", color: "#ec4899" }],
    totalChapters: 320,
    viewCount: 6200000,
    rating: 4.6,
    status: "completed",
    updatedAt: "2024-03-10",
  },
  {
    id: "5",
    title: "Hắc Ám Vương Tọa",
    author: "Thần Tiền",
    coverUrl: "https://picsum.photos/seed/story5/200/300",
    description: "Đế vương bóng tối thống trị thiên hạ...",
    genres: [{ id: "5", name: "Đô Thị", color: "#64748b" }, { id: "1", name: "Huyền Huyễn", color: "#8b5cf6" }],
    totalChapters: 750,
    viewCount: 9800000,
    rating: 4.4,
    status: "ongoing",
    updatedAt: "2026-07-22",
  },
  {
    id: "6", title: "Siêu Phàm Đặc Lực", author: "Phong Hỏa Hý Chư Hầu",
    coverUrl: "https://picsum.photos/seed/story6/200/300",
    description: "Đặc vụ siêu năng lực bảo vệ thế giới...",
    genres: [{ id: "6", name: "Hành Động", color: "#ef4444" }],
    totalChapters: 1200, viewCount: 7300000, rating: 4.3, status: "ongoing", updatedAt: "2026-07-21",
  },
  {
    id: "7", title: "Trọng Sinh Chi Đế", author: "Thần Bộ Hành",
    coverUrl: "https://picsum.photos/seed/story7/200/300",
    description: "Trọng sinh trở về quá khứ làm lại cuộc đời...",
    genres: [{ id: "7", name: "Trọng Sinh", color: "#10b981" }],
    totalChapters: 580, viewCount: 5400000, rating: 4.2, status: "completed", updatedAt: "2024-06-01",
  },
  {
    id: "8", title: "Linh Kiếm Tôn", author: "Thiên Sơn Lão Yêu",
    coverUrl: "https://picsum.photos/seed/story8/200/300",
    description: "Kiếm đạo siêu phàm, một kiếm phá vạn pháp...",
    genres: [{ id: "2", name: "Tu Tiên", color: "#06b6d4" }],
    totalChapters: 1900, viewCount: 11000000, rating: 4.6, status: "completed", updatedAt: "2024-08-15",
  },
  {
    id: "9", title: "Vạn Cổ Thần Đế", author: "Phi Thiên Ngư",
    coverUrl: "https://picsum.photos/seed/story9/200/300",
    description: "Thần đế tái thế, hành trình chinh phục thiên hà...",
    genres: [{ id: "1", name: "Huyền Huyễn", color: "#8b5cf6" }],
    totalChapters: 3000, viewCount: 13500000, rating: 4.7, status: "completed", updatedAt: "2025-01-10",
  },
  {
    id: "10", title: "Dị Thế Tà Quân", author: "Anh Hùng Triệu",
    coverUrl: "https://picsum.photos/seed/story10/200/300",
    description: "Kẻ tà ác độc nhất trở thành vị cứu thế...",
    genres: [{ id: "3", name: "Phiêu Lưu", color: "#f59e0b" }],
    totalChapters: 450, viewCount: 4100000, rating: 4.1, status: "ongoing", updatedAt: "2026-07-18",
  },
  {
    id: "11", title: "Thiên Thần Xúc Phạm", author: "Mặc Lăng",
    coverUrl: "https://picsum.photos/seed/story11/200/300",
    description: "Ngôn tình ngọt ngào xúc động lòng người...",
    genres: [{ id: "4", name: "Ngôn Tình", color: "#ec4899" }],
    totalChapters: 280, viewCount: 3800000, rating: 4.3, status: "completed", updatedAt: "2024-11-20",
  },
  {
    id: "12", title: "Cửu Tinh Bá Thể Quyết", author: "Lục Đạo Phàm Hỏa",
    coverUrl: "https://picsum.photos/seed/story12/200/300",
    description: "Thể quyết cửu tinh mở ra con đường thần...",
    genres: [{ id: "2", name: "Tu Tiên", color: "#06b6d4" }, { id: "6", name: "Hành Động", color: "#ef4444" }],
    totalChapters: 2100, viewCount: 10200000, rating: 4.5, status: "ongoing", updatedAt: "2026-07-23",
  },
  {
    id: "13", title: "Mặt Nạ Bá Vương", author: "Trầm Mặc Đề Ký",
    coverUrl: "https://picsum.photos/seed/story13/200/300",
    description: "Bá chủ đeo mặt nạ và tình yêu thầm kín...",
    genres: [{ id: "4", name: "Ngôn Tình", color: "#ec4899" }, { id: "5", name: "Đô Thị", color: "#64748b" }],
    totalChapters: 390, viewCount: 5100000, rating: 4.4, status: "completed", updatedAt: "2025-03-05",
  },
  {
    id: "14", title: "Tuyệt Thế Đường Môn", author: "Đường Gia Tam Thiếu",
    coverUrl: "https://picsum.photos/seed/story14/200/300",
    description: "Thế giới Đấu La Đại Lục kỳ diệu...",
    genres: [{ id: "1", name: "Huyền Huyễn", color: "#8b5cf6" }, { id: "3", name: "Phiêu Lưu", color: "#f59e0b" }],
    totalChapters: 1700, viewCount: 14000000, rating: 4.9, status: "completed", updatedAt: "2025-06-10",
  },
  {
    id: "15", title: "Thần Mộ", author: "Thần Huyệt",
    coverUrl: "https://picsum.photos/seed/story15/200/300",
    description: "Hành trình khám phá thần mộ bí ẩn...",
    genres: [{ id: "8", name: "Kiếm Hiệp", color: "#a3e635" }],
    totalChapters: 670, viewCount: 7600000, rating: 4.4, status: "completed", updatedAt: "2024-09-30",
  },
];

export const FEATURED_STORIES = MOCK_STORIES.slice(0, 5);
export const TRENDING_STORIES = [...MOCK_STORIES].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
export const RECENT_STORIES = [...MOCK_STORIES].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);

export const ALL_GENRES = [
  { id: "1", name: "Huyền Huyễn", color: "#8b5cf6" },
  { id: "2", name: "Tu Tiên", color: "#06b6d4" },
  { id: "3", name: "Phiêu Lưu", color: "#f59e0b" },
  { id: "4", name: "Ngôn Tình", color: "#ec4899" },
  { id: "5", name: "Đô Thị", color: "#64748b" },
  { id: "6", name: "Hành Động", color: "#ef4444" },
  { id: "7", name: "Trọng Sinh", color: "#10b981" },
  { id: "8", name: "Kiếm Hiệp", color: "#a3e635" },
];
```

- [ ] **Step 2: Tạo mock chapters**

`src/data/mockChapters.ts`:
```ts
import { Chapter } from "../types/story";

const CHAPTER_CONTENT = `Tiêu Viêm bước vào phòng thi đấu, ánh mắt lạnh lùng quét qua những kẻ địch. 

Anh ta hiểu rõ hơn ai hết rằng trong thế giới này, sức mạnh là tất cả. Không có sức mạnh, ngay cả tình thân cũng trở nên mỏng manh như giấy.

"Tiêu Viêm, ngươi dám đến đây?" Một giọng nói khinh thường vang lên từ phía trước.

Tiêu Viêm không vội vàng, môi khẽ cong lên một nụ cười lạnh. Hắn đã chờ đợi khoảnh khắc này quá lâu rồi.

Đấu khí bùng phát từ cơ thể hắn, màu vàng rực rỡ bao phủ toàn thân. Cấp bậc Đại Đấu Sư — một bước tiến vượt bậc chỉ trong một năm.

"Hôm nay, ta sẽ chứng minh cho tất cả thấy. Thiên tài không phải là bẩm sinh — mà là được rèn giũa qua thử thách."

Hắn giơ tay, một luồng đấu khí mạnh mẽ xoáy tròn trong lòng bàn tay. Đối thủ trước mặt chần chừ một chút, lùi lại vài bước.

Cuộc chiến bắt đầu.`;

export function getMockChapters(storyId: string): Chapter[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `${storyId}-chapter-${i + 1}`,
    storyId,
    number: i + 1,
    title: `Chương ${i + 1}: ${getChapterTitle(i + 1)}`,
    content: CHAPTER_CONTENT.repeat(3) + `\n\n[Chương ${i + 1} của truyện ${storyId}]`,
    wordCount: 1200 + Math.floor(Math.random() * 800),
    publishedAt: new Date(Date.now() - (50 - i) * 86400000).toISOString(),
  }));
}

function getChapterTitle(n: number): string {
  const titles = [
    "Khởi Đầu Mới", "Thử Thách", "Sức Mạnh Tiềm Ẩn", "Bước Đột Phá",
    "Kẻ Thù Cũ", "Cơ Duyên Kỳ Ngộ", "Trận Đấu Quyết Định", "Thăng Cấp",
    "Bí Mật Phong Ấn", "Hành Trình Mới",
  ];
  return titles[(n - 1) % titles.length];
}
```

- [ ] **Step 3: Tạo AsyncStorage helper**

`src/utils/storage.ts`:
```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
```

- [ ] **Step 4: Tạo authStore**

`src/stores/authStore.ts`:
```ts
import { create } from "zustand";
import { User } from "../types/auth";
import { storage } from "../utils/storage";

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: async (user, token) => {
    await storage.set("user", user);
    await storage.set("token", token);
    set({ user, token, isLoggedIn: true });
  },

  logout: async () => {
    await storage.remove("user");
    await storage.remove("token");
    set({ user: null, token: null, isLoggedIn: false });
  },

  restoreSession: async () => {
    const user = await storage.get<User>("user");
    const token = await storage.get<string>("token");
    if (user && token) {
      set({ user, token, isLoggedIn: true });
    }
  },
}));
```

- [ ] **Step 5: Tạo readerStore**

`src/stores/readerStore.ts`:
```ts
import { create } from "zustand";
import { ReaderSettings, ReaderTheme, FontSize } from "../types/reader";
import { storage } from "../utils/storage";

const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 15,
  medium: 17,
  large: 20,
};

interface ReaderStore {
  settings: ReaderSettings;
  setTheme: (theme: ReaderTheme) => Promise<void>;
  setFontSize: (size: FontSize) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: "medium",
  fontSizePx: 17,
};

export const useReaderStore = create<ReaderStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  setTheme: async (theme) => {
    const settings = { ...get().settings, theme };
    await storage.set("readerSettings", settings);
    set({ settings });
  },

  setFontSize: async (fontSize) => {
    const settings = { ...get().settings, fontSize, fontSizePx: FONT_SIZE_MAP[fontSize] };
    await storage.set("readerSettings", settings);
    set({ settings });
  },

  loadSettings: async () => {
    const saved = await storage.get<ReaderSettings>("readerSettings");
    if (saved) set({ settings: saved });
  },
}));
```

- [ ] **Step 6: Tạo bookshelfStore**

`src/stores/bookshelfStore.ts`:
```ts
import { create } from "zustand";
import { storage } from "../utils/storage";

interface HistoryItem {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  readAt: string;
}

interface BookshelfStore {
  bookmarks: string[];
  history: HistoryItem[];
  addBookmark: (storyId: string) => Promise<void>;
  removeBookmark: (storyId: string) => Promise<void>;
  isBookmarked: (storyId: string) => boolean;
  addToHistory: (storyId: string, chapterId: string, chapterNumber: number) => Promise<void>;
  getLastRead: (storyId: string) => HistoryItem | undefined;
  loadData: () => Promise<void>;
}

export const useBookshelfStore = create<BookshelfStore>((set, get) => ({
  bookmarks: [],
  history: [],

  addBookmark: async (storyId) => {
    const bookmarks = [...get().bookmarks, storyId];
    await storage.set("bookmarks", bookmarks);
    set({ bookmarks });
  },

  removeBookmark: async (storyId) => {
    const bookmarks = get().bookmarks.filter((id) => id !== storyId);
    await storage.set("bookmarks", bookmarks);
    set({ bookmarks });
  },

  isBookmarked: (storyId) => get().bookmarks.includes(storyId),

  addToHistory: async (storyId, chapterId, chapterNumber) => {
    const existing = get().history.filter((h) => h.storyId !== storyId);
    const history = [{ storyId, chapterId, chapterNumber, readAt: new Date().toISOString() }, ...existing].slice(0, 50);
    await storage.set("readHistory", history);
    set({ history });
  },

  getLastRead: (storyId) => get().history.find((h) => h.storyId === storyId),

  loadData: async () => {
    const bookmarks = await storage.get<string[]>("bookmarks") ?? [];
    const history = await storage.get<HistoryItem[]>("readHistory") ?? [];
    set({ bookmarks, history });
  },
}));
```

- [ ] **Step 7: Load stores trong root layout**

Cập nhật `app/_layout.tsx`:
```tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useReaderStore } from "../src/stores/readerStore";
import { useBookshelfStore } from "../src/stores/bookshelfStore";
import "../global.css";

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const loadSettings = useReaderStore((s) => s.loadSettings);
  const loadData = useBookshelfStore((s) => s.loadData);

  useEffect(() => {
    Promise.all([restoreSession(), loadSettings(), loadData()]);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="story/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reader/[storyId]/[chapterId]" options={{ headerShown: false }} />
    </Stack>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/ app/_layout.tsx
git commit -m "feat: mock data, zustand stores (auth, reader, bookshelf)"
```

---

## Task 3: UI Components dùng chung

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/LoadingSpinner.tsx`
- Create: `src/components/story/StoryCard.tsx`
- Create: `src/components/story/StoryCardHorizontal.tsx`
- Create: `src/components/story/ChapterItem.tsx`
- Create: `src/utils/format.ts`

**Interfaces:**
- Consumes: `Story`, `Chapter`, `Genre` từ Task 1
- Produces:
  - `<Button label onPress variant? loading? />` — variant: "primary" | "outline" | "ghost"
  - `<Input value onChangeText label? placeholder? secureTextEntry? />`
  - `<Badge genre />` — hiện tên thể loại với màu
  - `<StoryCard story onPress />` — card dạng đứng (2 column grid)
  - `<StoryCardHorizontal story onPress />` — card ngang với ảnh bìa lớn
  - `<ChapterItem chapter onPress isRead? />`
  - `formatViewCount(n): string` — "1.2 triệu"
  - `formatDate(iso): string` — "20 giờ trước"

- [ ] **Step 1: Tạo format utils**

`src/utils/format.ts`:
```ts
export function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

export function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Vừa xong";
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function formatWordCount(n: number): string {
  return `${(n / 1000).toFixed(1)}k từ`;
}
```

- [ ] **Step 2: Tạo Button component**

`src/components/ui/Button.tsx`:
```tsx
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, className }: ButtonProps) {
  const baseClass = "flex-row items-center justify-center rounded-xl py-3 px-6";
  const variantClass = {
    primary: "bg-primary",
    outline: "border border-primary",
    ghost: "bg-transparent",
  }[variant];
  const textClass = {
    primary: "text-white font-semibold text-base",
    outline: "text-primary font-semibold text-base",
    ghost: "text-primary font-semibold text-base",
  }[variant];

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${disabled || loading ? "opacity-50" : ""} ${className ?? ""}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#E94057"} />
      ) : (
        <Text className={textClass}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Tạo Input component**

`src/components/ui/Input.tsx`:
```tsx
import { View, Text, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 ${error ? "border-red-500" : "border-gray-200"} bg-white ${className ?? ""}`}
        placeholderTextColor="#aaa"
        {...props}
      />
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
```

- [ ] **Step 4: Tạo Badge component**

`src/components/ui/Badge.tsx`:
```tsx
import { View, Text } from "react-native";
import { Genre } from "../../types/story";

export function Badge({ genre }: { genre: Genre }) {
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: genre.color + "20" }}>
      <Text className="text-xs font-medium" style={{ color: genre.color }}>{genre.name}</Text>
    </View>
  );
}
```

- [ ] **Step 5: Tạo StoryCard (dạng đứng)**

`src/components/story/StoryCard.tsx`:
```tsx
import { TouchableOpacity, View, Text, Image } from "react-native";
import { Story } from "../../types/story";
import { formatViewCount } from "../../utils/format";

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export function StoryCard({ story, onPress }: StoryCardProps) {
  return (
    <TouchableOpacity className="flex-1 mb-4" onPress={onPress} activeOpacity={0.8}>
      <View className="relative">
        <Image
          source={{ uri: story.coverUrl }}
          className="w-full rounded-xl bg-gray-100"
          style={{ aspectRatio: 2 / 3 }}
          resizeMode="cover"
        />
        {story.status === "ongoing" && (
          <View className="absolute top-2 left-2 bg-primary rounded px-1.5 py-0.5">
            <Text className="text-white text-xs font-bold">Đang ra</Text>
          </View>
        )}
      </View>
      <Text className="font-semibold text-gray-900 mt-2 text-sm" numberOfLines={2}>{story.title}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{story.author}</Text>
      <Text className="text-xs text-gray-400 mt-0.5">{formatViewCount(story.viewCount)} lượt đọc</Text>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 6: Tạo StoryCardHorizontal (dạng ngang)**

`src/components/story/StoryCardHorizontal.tsx`:
```tsx
import { TouchableOpacity, View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Story } from "../../types/story";
import { Badge } from "../ui/Badge";
import { formatViewCount, formatDate } from "../../utils/format";

interface Props {
  story: Story;
  onPress: () => void;
}

export function StoryCardHorizontal({ story, onPress }: Props) {
  return (
    <TouchableOpacity className="flex-row bg-white rounded-2xl p-3 mb-3 shadow-sm" onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{ uri: story.coverUrl }}
        className="rounded-xl bg-gray-100"
        style={{ width: 80, height: 112 }}
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="font-bold text-gray-900 text-base" numberOfLines={2}>{story.title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{story.author}</Text>
        <View className="flex-row flex-wrap gap-1 mt-2">
          {story.genres.slice(0, 2).map((g) => <Badge key={g.id} genre={g} />)}
        </View>
        <View className="flex-row items-center mt-2 gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text className="text-xs text-gray-600">{story.rating}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="eye" size={12} color="#999" />
            <Text className="text-xs text-gray-500">{formatViewCount(story.viewCount)}</Text>
          </View>
        </View>
        <Text className="text-xs text-gray-400 mt-1">{story.totalChapters} chương · {formatDate(story.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 7: Tạo ChapterItem**

`src/components/story/ChapterItem.tsx`:
```tsx
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "../../types/story";
import { formatDate, formatWordCount } from "../../utils/format";

interface Props {
  chapter: Chapter;
  onPress: () => void;
  isRead?: boolean;
}

export function ChapterItem({ chapter, onPress, isRead }: Props) {
  return (
    <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-50" onPress={onPress} activeOpacity={0.7}>
      <View className="flex-1">
        <Text className={`text-sm font-medium ${isRead ? "text-gray-400" : "text-gray-800"}`} numberOfLines={1}>
          {chapter.title}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">{formatWordCount(chapter.wordCount)} · {formatDate(chapter.publishedAt)}</Text>
      </View>
      {isRead && <Ionicons name="checkmark-circle" size={16} color="#10b981" className="ml-2" />}
      <Ionicons name="chevron-forward" size={16} color="#ddd" className="ml-1" />
    </TouchableOpacity>
  );
}
```

- [ ] **Step 8: Tạo LoadingSpinner**

`src/components/ui/LoadingSpinner.tsx`:
```tsx
import { View, ActivityIndicator } from "react-native";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <View className={`flex-1 items-center justify-center ${className ?? ""}`}>
      <ActivityIndicator size="large" color="#E94057" />
    </View>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add src/components src/utils/format.ts
git commit -m "feat: shared UI components (Button, Input, Badge, StoryCard, ChapterItem)"
```

---

## Task 4: Auth Screens (Login + Register)

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/register.tsx`

**Interfaces:**
- Consumes: `useAuthStore()` từ Task 2, `Button`, `Input` từ Task 3
- Produces: Auth flow hoàn chỉnh. Sau login thành công → redirect về `/(tabs)`

- [ ] **Step 1: Auth stack layout**

`app/(auth)/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

- [ ] **Step 2: Màn Login**

`app/(auth)/login.tsx`:
```tsx
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await login({ id: "u1", email, displayName: email.split("@")[0] }, "mock-token-123");
    setLoading(false);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl">📚</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Đọc Truyện</Text>
            <Text className="text-gray-500 mt-1">Đăng nhập để tiếp tục</Text>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button label="Đăng nhập" onPress={handleLogin} loading={loading} className="mt-2" />

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-100" />
            <Text className="mx-4 text-gray-400 text-sm">hoặc</Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <Button
            label="Tiếp tục không đăng nhập"
            onPress={() => router.replace("/(tabs)")}
            variant="outline"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-primary font-semibold">Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 3: Màn Register**

`app/(auth)/register.tsx`:
```tsx
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await login({ id: "u1", email, displayName: name }, "mock-token-123");
    setLoading(false);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-primary text-base">← Quay lại</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản</Text>
          <Text className="text-gray-500 mb-8">Đăng ký để lưu lịch sử đọc truyện</Text>

          <Input label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Tên của bạn" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="Tối thiểu 6 ký tự" secureTextEntry />
          <Input label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Nhập lại mật khẩu" secureTextEntry />

          <Button label="Đăng ký" onPress={handleRegister} loading={loading} className="mt-2" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 4: Test auth flow**

Chạy app, vào Profile tab → nhấn "Đăng nhập" → điền thông tin → verify:
- Login thành công → redirect về Home
- "Tiếp tục không đăng nhập" hoạt động
- Validation hiện alert đúng

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/
git commit -m "feat: auth screens (login, register) with mock authentication"
```

---

## Task 5: Home Screen

**Files:**
- Create: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `FEATURED_STORIES`, `TRENDING_STORIES`, `RECENT_STORIES` từ Task 2; `StoryCard`, `StoryCardHorizontal` từ Task 3
- Produces: Màn Home hiện 3 sections: Banner (FlatList ngang), Trending (grid), Recent Updates

- [ ] **Step 1: Tạo Home screen**

`app/(tabs)/index.tsx`:
```tsx
import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StoryCard } from "../../src/components/story/StoryCard";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { FEATURED_STORIES, TRENDING_STORIES, RECENT_STORIES } from "../../src/data/mockStories";
import { useAuthStore } from "../../src/stores/authStore";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 48;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  function goToStory(id: string) {
    router.push(`/story/${id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <View>
            <Text className="text-gray-500 text-sm">Xin chào 👋</Text>
            <Text className="text-xl font-bold text-gray-900">{user?.displayName ?? "Bạn đọc"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/discover")} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Banner carousel */}
        <View className="mb-6">
          <FlatList
            data={FEATURED_STORIES}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            snapToInterval={BANNER_WIDTH + 12}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ width: BANNER_WIDTH }}
                className="rounded-2xl overflow-hidden"
                onPress={() => goToStory(item.id)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.coverUrl }} style={{ width: BANNER_WIDTH, height: 180 }} resizeMode="cover" />
                <View className="absolute inset-0 bg-black/40 justify-end p-4">
                  <View className="flex-row gap-1 mb-2">
                    {item.genres.slice(0, 2).map((g) => (
                      <View key={g.id} className="bg-white/20 rounded px-2 py-0.5">
                        <Text className="text-white text-xs">{g.name}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-white/80 text-sm">{item.author} · {item.totalChapters} chương</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Trending section */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">🔥 Đang Hot</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
              <Text className="text-primary text-sm">Xem thêm</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            {TRENDING_STORIES.slice(0, 4).map((story) => (
              <View key={story.id} style={{ flex: 1 }}>
                <StoryCard story={story} onPress={() => goToStory(story.id)} />
              </View>
            ))}
          </View>
          <View className="flex-row gap-3">
            {TRENDING_STORIES.slice(4, 8).map((story) => (
              <View key={story.id} style={{ flex: 1 }}>
                <StoryCard story={story} onPress={() => goToStory(story.id)} />
              </View>
            ))}
          </View>
        </View>

        {/* Recent updates */}
        <View className="px-4 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">🆕 Mới Cập Nhật</Text>
          </View>
          {RECENT_STORIES.map((story) => (
            <StoryCardHorizontal key={story.id} story={story} onPress={() => goToStory(story.id)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Test Home screen**

Verify:
- Banner carousel scroll ngang mượt, snap đúng vị trí
- Grid 2 cột hiển thị đúng
- "Mới cập nhật" hiện list ngang với ảnh + info
- Nhấn bất kỳ card → navigate đúng (sẽ lỗi vì story/[id] chưa có — bình thường)

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: home screen with banner carousel, trending grid, recent updates"
```

---

## Task 6: Discover / Search Screen

**Files:**
- Create: `app/(tabs)/discover.tsx`

**Interfaces:**
- Consumes: `MOCK_STORIES`, `ALL_GENRES` từ Task 2; `StoryCardHorizontal`, `Badge` từ Task 3
- Produces: Màn search + filter theo thể loại real-time

- [ ] **Step 1: Tạo Discover screen**

`app/(tabs)/discover.tsx`:
```tsx
import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { MOCK_STORIES, ALL_GENRES } from "../../src/data/mockStories";

export default function DiscoverScreen() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK_STORIES.filter((s) => {
      const matchesQuery = query.trim() === "" || s.title.toLowerCase().includes(query.toLowerCase()) || s.author.toLowerCase().includes(query.toLowerCase());
      const matchesGenre = selectedGenre === null || s.genres.some((g) => g.id === selectedGenre);
      return matchesQuery && matchesGenre;
    });
  }, [query, selectedGenre]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Search bar */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Khám Phá</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 text-base"
            placeholder="Tìm truyện, tác giả..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genre filter */}
      <FlatList
        data={[{ id: null as unknown as string, name: "Tất cả", color: "#E94057" }, ...ALL_GENRES]}
        keyExtractor={(item) => item.id ?? "all"}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        renderItem={({ item }) => {
          const isSelected = item.id === null ? selectedGenre === null : selectedGenre === item.id;
          return (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full border ${isSelected ? "bg-primary border-primary" : "bg-white border-gray-200"}`}
              onPress={() => setSelectedGenre(item.id ?? null)}
            >
              <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="text-sm text-gray-500 mb-3">{filtered.length} kết quả</Text>
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">🔍</Text>
            <Text className="text-gray-500">Không tìm thấy kết quả</Text>
          </View>
        }
        renderItem={({ item }) => (
          <StoryCardHorizontal story={item} onPress={() => router.push(`/story/${item.id}`)} />
        )}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Test Discover screen**

Verify:
- Search real-time lọc đúng theo tên và tác giả
- Filter thể loại hoạt động, kết hợp với search
- "Tất cả" reset filter
- Empty state hiển thị khi không có kết quả

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/discover.tsx
git commit -m "feat: discover screen with real-time search and genre filter"
```

---

## Task 7: Story Detail Screen

**Files:**
- Create: `app/story/[id].tsx`

**Interfaces:**
- Consumes: `MOCK_STORIES`, `getMockChapters` từ Task 2; `Badge`, `Button` từ Task 3; `useBookshelfStore` từ Task 2
- Produces: Màn chi tiết truyện với tab "Thông tin" và "Danh sách chương", nút Đọc/Bookmark

- [ ] **Step 1: Tạo Story Detail screen**

`app/story/[id].tsx`:
```tsx
import { View, Text, Image, ScrollView, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { ChapterItem } from "../../src/components/story/ChapterItem";
import { MOCK_STORIES } from "../../src/data/mockStories";
import { getMockChapters } from "../../src/data/mockChapters";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { formatViewCount } from "../../src/utils/format";

const { width } = Dimensions.get("window");

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"info" | "chapters">("info");
  const [descExpanded, setDescExpanded] = useState(false);

  const story = MOCK_STORIES.find((s) => s.id === id);
  const chapters = story ? getMockChapters(story.id) : [];

  const { isBookmarked, addBookmark, removeBookmark, getLastRead } = useBookshelfStore();
  const bookmarked = story ? isBookmarked(story.id) : false;
  const lastRead = story ? getLastRead(story.id) : undefined;

  if (!story) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Không tìm thấy truyện</Text>
      </SafeAreaView>
    );
  }

  function handleReadFirst() {
    router.push(`/reader/${story!.id}/${chapters[0].id}`);
  }

  function handleContinue() {
    if (lastRead) {
      router.push(`/reader/${story!.id}/${lastRead.chapterId}`);
    } else {
      handleReadFirst();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="flex-1 font-bold text-gray-900 text-lg" numberOfLines={1}>{story.title}</Text>
        <TouchableOpacity onPress={() => bookmarked ? removeBookmark(story.id) : addBookmark(story.id)}>
          <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color={bookmarked ? "#E94057" : "#666"} />
        </TouchableOpacity>
      </View>

      {/* Cover + info */}
      <View className="px-4 pb-4 flex-row">
        <Image source={{ uri: story.coverUrl }} style={{ width: 120, height: 168, borderRadius: 12 }} resizeMode="cover" />
        <View className="flex-1 ml-4">
          <Text className="font-bold text-gray-900 text-xl" numberOfLines={2}>{story.title}</Text>
          <Text className="text-gray-600 mt-1">{story.author}</Text>
          <View className="flex-row items-center mt-2 gap-2">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-sm font-semibold text-gray-700">{story.rating}</Text>
            <Text className="text-gray-300">·</Text>
            <Text className="text-sm text-gray-500">{formatViewCount(story.viewCount)} đọc</Text>
          </View>
          <View className="flex-row flex-wrap gap-1 mt-2">
            {story.genres.map((g) => <Badge key={g.id} genre={g} />)}
          </View>
          <View className="mt-2">
            <View className={`px-2 py-0.5 rounded self-start ${story.status === "ongoing" ? "bg-green-100" : "bg-gray-100"}`}>
              <Text className={`text-xs font-medium ${story.status === "ongoing" ? "text-green-700" : "text-gray-600"}`}>
                {story.status === "ongoing" ? "Đang ra" : "Hoàn thành"}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-gray-500 mt-1">{story.totalChapters} chương</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row px-4 gap-3 mb-4">
        <Button
          label={lastRead ? `Đọc tiếp Ch.${lastRead.chapterNumber}` : "Đọc từ đầu"}
          onPress={handleContinue}
          className="flex-1"
        />
        {lastRead && (
          <Button label="Ch.1" onPress={handleReadFirst} variant="outline" className="px-4" />
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100 mx-4">
        {(["info", "chapters"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab ? "border-primary" : "border-transparent"}`}
            onPress={() => setActiveTab(tab)}
          >
            <Text className={`font-semibold text-sm ${activeTab === tab ? "text-primary" : "text-gray-500"}`}>
              {tab === "info" ? "Giới thiệu" : `Chương (${chapters.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "info" ? (
        <ScrollView className="flex-1 px-4 pt-4">
          <Text className={`text-gray-700 leading-6 ${!descExpanded ? "line-clamp-5" : ""}`} numberOfLines={descExpanded ? undefined : 5}>
            {story.description}
          </Text>
          <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} className="mt-2 mb-8">
            <Text className="text-primary text-sm">{descExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ChapterItem
              chapter={item}
              onPress={() => router.push(`/reader/${story.id}/${item.id}`)}
              isRead={false}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Test Story Detail**

Từ Home → nhấn bất kỳ truyện → verify:
- Cover, tên, tác giả, rating, genres hiện đúng
- Tab "Giới thiệu" / "Chương" switch mượt
- Nút bookmark toggle icon đúng
- "Đọc từ đầu" navigate đến reader (sẽ lỗi vì reader chưa tạo — bình thường)

- [ ] **Step 3: Commit**

```bash
git add app/story/
git commit -m "feat: story detail screen with info tab, chapter list, bookmark"
```

---

## Task 8: Reader Screen (Dark Mode + Font Size)

**Files:**
- Create: `app/reader/[storyId]/[chapterId].tsx`
- Create: `src/components/reader/ReaderToolbar.tsx`
- Create: `src/components/reader/ReaderSettings.tsx`

**Interfaces:**
- Consumes: `getMockChapters` từ Task 2; `useReaderStore`, `useBookshelfStore` từ Task 2
- Produces: Màn đọc full-screen với toolbar toggle, settings panel (font size, theme), auto-save progress

- [ ] **Step 1: Tạo ReaderToolbar**

`src/components/reader/ReaderToolbar.tsx`:
```tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

interface Props {
  title: string;
  chapterTitle: string;
  visible: boolean;
  isDark: boolean;
  onBack: () => void;
  onSettings: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ReaderToolbar({ title, chapterTitle, visible, isDark, onBack, onSettings, onPrevChapter, onNextChapter, hasPrev, hasNext }: Props) {
  const topStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    transform: [{ translateY: withTiming(visible ? 0 : -60, { duration: 200 }) }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    transform: [{ translateY: withTiming(visible ? 0 : 60, { duration: 200 }) }],
  }));

  const bg = isDark ? "bg-gray-900" : "bg-white";
  const text = isDark ? "text-gray-100" : "text-gray-900";
  const iconColor = isDark ? "#e0e0e0" : "#333";

  return (
    <>
      <Animated.View style={[topStyle, { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }]}
        className={`${bg} px-4 pt-12 pb-4 flex-row items-center shadow-sm`}>
        <TouchableOpacity onPress={onBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`font-bold text-base ${text}`} numberOfLines={1}>{title}</Text>
          <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`} numberOfLines={1}>{chapterTitle}</Text>
        </View>
        <TouchableOpacity onPress={onSettings} className="ml-3">
          <Ionicons name="settings-outline" size={22} color={iconColor} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[bottomStyle, { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }]}
        className={`${bg} px-4 pt-4 pb-8 flex-row items-center justify-between shadow-sm`}>
        <TouchableOpacity
          className={`flex-row items-center gap-1 ${!hasPrev ? "opacity-30" : ""}`}
          onPress={onPrevChapter}
          disabled={!hasPrev}
        >
          <Ionicons name="chevron-back" size={18} color={iconColor} />
          <Text className={`text-sm ${text}`}>Chương trước</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-row items-center gap-1 ${!hasNext ? "opacity-30" : ""}`}
          onPress={onNextChapter}
          disabled={!hasNext}
        >
          <Text className={`text-sm ${text}`}>Chương sau</Text>
          <Ionicons name="chevron-forward" size={18} color={iconColor} />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}
```

- [ ] **Step 2: Tạo ReaderSettings bottom sheet**

`src/components/reader/ReaderSettings.tsx`:
```tsx
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useReaderStore } from "../../stores/readerStore";
import { ReaderTheme, FontSize } from "../../types/reader";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const THEMES: { key: ReaderTheme; label: string; bg: string; text: string }[] = [
  { key: "light", label: "Sáng", bg: "#fdf6e3", text: "#2c2c2c" },
  { key: "dark", label: "Tối", bg: "#1a1a1a", text: "#e0e0e0" },
  { key: "sepia", label: "Sepia", bg: "#f4ecd8", text: "#4a3728" },
];

const FONT_SIZES: { key: FontSize; label: string; px: number }[] = [
  { key: "small", label: "Nhỏ", px: 15 },
  { key: "medium", label: "Vừa", px: 17 },
  { key: "large", label: "Lớn", px: 20 },
];

export function ReaderSettings({ visible, onClose }: Props) {
  const { settings, setTheme, setFontSize } = useReaderStore();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl px-6 py-6" onPress={() => {}}>
          <Text className="text-lg font-bold text-gray-900 mb-4">Cài đặt đọc</Text>

          <Text className="text-sm font-semibold text-gray-600 mb-3">Màu nền</Text>
          <View className="flex-row gap-3 mb-5">
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                className={`flex-1 py-3 rounded-xl items-center border-2 ${settings.theme === t.key ? "border-primary" : "border-transparent"}`}
                style={{ backgroundColor: t.bg }}
                onPress={() => setTheme(t.key)}
              >
                <Text style={{ color: t.text, fontWeight: "600" }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold text-gray-600 mb-3">Cỡ chữ</Text>
          <View className="flex-row gap-3 mb-6">
            {FONT_SIZES.map((f) => (
              <TouchableOpacity
                key={f.key}
                className={`flex-1 py-3 rounded-xl items-center border ${settings.fontSize === f.key ? "border-primary bg-red-50" : "border-gray-200"}`}
                onPress={() => setFontSize(f.key)}
              >
                <Text style={{ fontSize: f.px, color: settings.fontSize === f.key ? "#E94057" : "#666", fontWeight: "600" }}>A</Text>
                <Text className={`text-xs mt-1 ${settings.fontSize === f.key ? "text-primary" : "text-gray-500"}`}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 3: Tạo Reader screen**

`app/reader/[storyId]/[chapterId].tsx`:
```tsx
import { View, Text, ScrollView, TouchableWithoutFeedback, StatusBar } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderToolbar } from "../../../src/components/reader/ReaderToolbar";
import { ReaderSettings } from "../../../src/components/reader/ReaderSettings";
import { MOCK_STORIES } from "../../../src/data/mockStories";
import { getMockChapters } from "../../../src/data/mockChapters";
import { useReaderStore } from "../../../src/stores/readerStore";
import { useBookshelfStore } from "../../../src/stores/bookshelfStore";

const THEME_STYLES = {
  light: { bg: "#fdf6e3", text: "#2c2c2c", statusBar: "dark-content" as const },
  dark: { bg: "#1a1a1a", text: "#e0e0e0", statusBar: "light-content" as const },
  sepia: { bg: "#f4ecd8", text: "#4a3728", statusBar: "dark-content" as const },
};

export default function ReaderScreen() {
  const { storyId, chapterId } = useLocalSearchParams<{ storyId: string; chapterId: string }>();
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings } = useReaderStore();
  const { addToHistory } = useBookshelfStore();

  const story = MOCK_STORIES.find((s) => s.id === storyId);
  const chapters = story ? getMockChapters(story.id) : [];
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const chapter = chapters[currentIndex];

  const themeStyle = THEME_STYLES[settings.theme];

  useEffect(() => {
    if (story && chapter) {
      addToHistory(story.id, chapter.id, chapter.number);
    }
    autoHideToolbar();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [chapterId]);

  function autoHideToolbar() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
  }

  function toggleToolbar() {
    const next = !toolbarVisible;
    setToolbarVisible(next);
    if (next) autoHideToolbar();
  }

  function goToChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;
    router.replace(`/reader/${storyId}/${chapters[index].id}`);
  }

  if (!story || !chapter) {
    return <View className="flex-1 items-center justify-center"><Text>Không tìm thấy chương</Text></View>;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: themeStyle.bg }}>
      <StatusBar barStyle={themeStyle.statusBar} backgroundColor={themeStyle.bg} />

      <ReaderToolbar
        title={story.title}
        chapterTitle={chapter.title}
        visible={toolbarVisible}
        isDark={settings.theme === "dark"}
        onBack={() => router.back()}
        onSettings={() => { setSettingsVisible(true); setToolbarVisible(false); }}
        onPrevChapter={() => goToChapter(currentIndex - 1)}
        onNextChapter={() => goToChapter(currentIndex + 1)}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < chapters.length - 1}
      />

      <TouchableWithoutFeedback onPress={toggleToolbar}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 100, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{ color: themeStyle.text, fontSize: settings.fontSizePx, lineHeight: settings.fontSizePx * 1.8, fontFamily: "System" }}
            selectable
          >
            {chapter.title}
            {"\n\n"}
            {chapter.content}
          </Text>

          {/* Next chapter prompt */}
          {currentIndex < chapters.length - 1 && (
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className="mt-12 mb-4 items-center">
                <TouchableWithoutFeedback onPress={() => goToChapter(currentIndex + 1)}>
                  <View className="bg-primary px-8 py-3 rounded-full">
                    <Text className="text-white font-semibold">Đọc chương tiếp →</Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      <ReaderSettings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}
```

- [ ] **Step 4: Test Reader**

Từ Story Detail → nhấn "Đọc từ đầu" → verify:
- Nội dung chương hiển thị
- Nhấn màn hình → toolbar xuất hiện, tự ẩn sau 3 giây
- Nhấn settings icon → bottom sheet cài đặt mở
- Đổi theme → nền thay đổi ngay
- Đổi font size → chữ to/nhỏ
- "Chương tiếp/trước" navigate đúng
- Nút cuối trang "Đọc chương tiếp" hoạt động

- [ ] **Step 5: Commit**

```bash
git add app/reader/ src/components/reader/
git commit -m "feat: reader screen with dark/light/sepia theme, font size, toolbar toggle"
```

---

## Task 9: Bookshelf Screen

**Files:**
- Create: `app/(tabs)/bookshelf.tsx`

**Interfaces:**
- Consumes: `useBookshelfStore` từ Task 2; `MOCK_STORIES` từ Task 2; `StoryCardHorizontal` từ Task 3
- Produces: Màn Tủ Sách với 2 tab: Đã lưu (bookmarks) và Đang đọc (history)

- [ ] **Step 1: Tạo Bookshelf screen**

`app/(tabs)/bookshelf.tsx`:
```tsx
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { MOCK_STORIES } from "../../src/data/mockStories";

export default function BookshelfScreen() {
  const [tab, setTab] = useState<"bookmarks" | "history">("bookmarks");
  const { bookmarks, history } = useBookshelfStore();

  const bookmarkedStories = MOCK_STORIES.filter((s) => bookmarks.includes(s.id));
  const historyStories = history
    .map((h) => ({ story: MOCK_STORIES.find((s) => s.id === h.storyId), chapter: h }))
    .filter((x) => x.story !== undefined);

  const isEmpty = tab === "bookmarks" ? bookmarkedStories.length === 0 : historyStories.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Tủ Sách</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-4 bg-gray-100 mx-4 rounded-xl p-1">
        {(["bookmarks", "history"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            className={`flex-1 py-2 rounded-lg items-center ${tab === t ? "bg-white shadow-sm" : ""}`}
            onPress={() => setTab(t)}
          >
            <Text className={`font-semibold text-sm ${tab === t ? "text-gray-900" : "text-gray-500"}`}>
              {t === "bookmarks" ? `Đã lưu (${bookmarks.length})` : `Đang đọc (${history.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">{tab === "bookmarks" ? "📚" : "📖"}</Text>
          <Text className="text-gray-500 text-base">
            {tab === "bookmarks" ? "Chưa có truyện được lưu" : "Chưa có lịch sử đọc"}
          </Text>
          <TouchableOpacity className="mt-4" onPress={() => router.push("/(tabs)/discover")}>
            <Text className="text-primary font-semibold">Khám phá truyện ngay →</Text>
          </TouchableOpacity>
        </View>
      ) : tab === "bookmarks" ? (
        <FlatList
          data={bookmarkedStories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <StoryCardHorizontal story={item} onPress={() => router.push(`/story/${item.id}`)} />
          )}
        />
      ) : (
        <FlatList
          data={historyStories}
          keyExtractor={(item) => item.story!.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="mb-1">
              <StoryCardHorizontal
                story={item.story!}
                onPress={() => router.push(`/reader/${item.story!.id}/${item.chapter.chapterId}`)}
              />
              <View className="bg-primary/10 rounded-b-xl px-3 py-1.5 -mt-3">
                <Text className="text-primary text-xs font-medium">📖 Đang đọc: Chương {item.chapter.chapterNumber}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Test Bookshelf**

Verify:
- Bookmark 1 truyện từ màn chi tiết → vào Tủ Sách → hiện trong "Đã lưu"
- Đọc 1 chương → vào Tủ Sách → hiện trong "Đang đọc" với số chương đúng
- Empty state hiện đúng khi chưa có data
- Nhấn vào truyện trong "Đang đọc" → mở đúng chương đang đọc

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/bookshelf.tsx
git commit -m "feat: bookshelf screen with saved stories and reading history"
```

---

## Task 10: Profile + Settings Screen

**Files:**
- Create: `app/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: `useAuthStore` từ Task 2; `useBookshelfStore` từ Task 2; `Button` từ Task 3
- Produces: Màn profile hiện thông tin user, thống kê, nút đăng nhập/xuất

- [ ] **Step 1: Tạo Profile screen**

`app/(tabs)/profile.tsx`:
```tsx
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../src/components/ui/Button";
import { useAuthStore } from "../../src/stores/authStore";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";

interface SettingRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  value?: string;
  showArrow?: boolean;
}

function SettingRow({ icon, label, onPress, value, showArrow = true }: SettingRowProps) {
  return (
    <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-50" onPress={onPress} activeOpacity={0.7}>
      <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-3">
        <Ionicons name={icon as any} size={16} color="#666" />
      </View>
      <Text className="flex-1 text-gray-800 text-base">{label}</Text>
      {value && <Text className="text-gray-400 text-sm mr-2">{value}</Text>}
      {showArrow && <Ionicons name="chevron-forward" size={16} color="#ccc" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const { bookmarks, history } = useBookshelfStore();

  async function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Cá Nhân</Text>
        </View>

        {/* User info card */}
        <View className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
          {isLoggedIn && user ? (
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center">
                <Text className="text-2xl font-bold text-primary">{user.displayName[0].toUpperCase()}</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-900">{user.displayName}</Text>
                <Text className="text-gray-500 text-sm">{user.email}</Text>
              </View>
            </View>
          ) : (
            <View className="items-center py-2">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="person" size={28} color="#aaa" />
              </View>
              <Text className="text-gray-500 mb-4">Đăng nhập để lưu tiến độ đọc</Text>
              <Button label="Đăng nhập" onPress={() => router.push("/(auth)/login")} />
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-gray-900 mb-3">Thống kê</Text>
          <View className="flex-row">
            {[
              { label: "Đã lưu", value: bookmarks.length, icon: "bookmark" },
              { label: "Đã đọc", value: history.length, icon: "book" },
              { label: "Tổng chương", value: history.length, icon: "list" },
            ].map((stat) => (
              <View key={stat.label} className="flex-1 items-center">
                <Ionicons name={stat.icon as any} size={20} color="#E94057" />
                <Text className="text-xl font-bold text-gray-900 mt-1">{stat.value}</Text>
                <Text className="text-xs text-gray-500">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View className="mx-4 bg-white rounded-2xl px-4 shadow-sm mb-4">
          <SettingRow icon="notifications-outline" label="Thông báo" onPress={() => {}} />
          <SettingRow icon="download-outline" label="Truyện đã tải" onPress={() => {}} />
          <SettingRow icon="shield-checkmark-outline" label="Chính sách bảo mật" onPress={() => {}} />
          <SettingRow icon="information-circle-outline" label="Phiên bản" onPress={() => {}} value="1.0.0" />
        </View>

        {isLoggedIn && (
          <View className="mx-4 mb-8">
            <Button label="Đăng xuất" onPress={handleLogout} variant="outline" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Test Profile**

Verify:
- Chưa đăng nhập → hiện nút "Đăng nhập" → nhấn → navigate đến màn login
- Đăng nhập → hiện tên, email, avatar chữ cái đầu
- Stats hiện số bookmark và history đúng
- Logout → alert confirm → confirm → user cleared

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: profile screen with user info, stats, logout"
```

---

## Task 11: Polish + Edge Cases

**Files:**
- Modify: `app/_layout.tsx` — redirect logic
- Modify: `app/(tabs)/index.tsx` — pull-to-refresh
- Create: `src/components/ui/EmptyState.tsx`

**Interfaces:**
- Consumes: tất cả tasks trước

- [ ] **Step 1: Pull-to-refresh trên Home**

Cập nhật `app/(tabs)/index.tsx`, thêm RefreshControl:
```tsx
import { RefreshControl } from "react-native";
import { useState, useCallback } from "react";

// Trong component:
const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await new Promise((r) => setTimeout(r, 1000));
  setRefreshing(false);
}, []);

// Trên ScrollView:
<ScrollView
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E94057" />}
  ...
>
```

- [ ] **Step 2: Xử lý ảnh lỗi load**

Cập nhật `src/components/story/StoryCard.tsx` và `StoryCardHorizontal.tsx`, thêm fallback:
```tsx
<Image
  source={{ uri: story.coverUrl }}
  defaultSource={require("../../assets/placeholder.png")}
  onError={(e) => console.warn("Image load error", e.nativeEvent.error)}
  ...
/>
```

Tạo `assets/placeholder.png` — có thể dùng ảnh placeholder 200x300 bất kỳ.

- [ ] **Step 3: Haptic feedback khi bookmark**

Cập nhật `app/story/[id].tsx`:
```tsx
import * as Haptics from "expo-haptics";

// Trong toggle bookmark:
async function toggleBookmark() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (bookmarked) {
    removeBookmark(story.id);
  } else {
    addBookmark(story.id);
  }
}
```

Cài: `npx expo install expo-haptics`

- [ ] **Step 4: Kiểm tra toàn bộ luồng**

Checklist manual:
- [ ] Home → Story Detail → Đọc từ đầu → Reader → Đổi theme sang Dark → Chương tiếp
- [ ] Home → Story Detail → Bookmark → Tủ Sách → thấy trong "Đã lưu"
- [ ] Tủ Sách → Đang đọc → nhấn → mở đúng chương
- [ ] Khám Phá → Search "Đấu Phá" → thấy kết quả → filter "Huyền Huyễn" → đúng
- [ ] Profile → Đăng nhập → thấy tên user → Đăng xuất → về guest state

- [ ] **Step 5: Commit cuối**

```bash
git add .
git commit -m "feat: polish - pull-to-refresh, haptic feedback, image error handling"
```

---

## Tổng Kết

| Task | Mô tả | Màn hình / Feature |
|------|-------|-------------------|
| 1 | Setup + Navigation | Expo Router, 4 tabs |
| 2 | Mock Data + Stores | Zustand (auth, reader, bookshelf) |
| 3 | UI Components | Button, Input, Badge, StoryCard |
| 4 | Auth Screens | Login, Register |
| 5 | Home Screen | Banner, Trending, Recent |
| 6 | Discover Screen | Search, Genre filter |
| 7 | Story Detail | Info tab, Chapter list, Bookmark |
| 8 | Reader Screen | Dark/Light/Sepia, Font size |
| 9 | Bookshelf | Đã lưu, Đang đọc |
| 10 | Profile | User info, Stats, Logout |
| 11 | Polish | Pull-to-refresh, Haptics |

**Thời gian ước tính:** 3-5 ngày làm full-time.

**Bước tiếp theo sau plan này:**
- Tích hợp API thật (thay mock data bằng `storyService.ts` + Axios)
- Thêm pagination cho danh sách chương (infinite scroll)
- Push notification cho chương mới
- Tính năng đọc offline (download chapter)
