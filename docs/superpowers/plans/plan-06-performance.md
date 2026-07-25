# Plan 06: Performance Audit & Optimization

> **Mục tiêu:** Kiểm tra và cải thiện performance của app: memo hóa các component re-render nhiều, tối ưu FlatList, lazy load màn hình, và giảm JS bundle size.

**Các vấn đề thường gặp cần check:**
1. StoryCard re-render mỗi khi parent state thay đổi
2. Home screen có nhiều FlatList nested trong ScrollView — có thể gây layout issue trên Android
3. ChapterSelectorModal FlatList 50 items — cần `windowSize` tối ưu
4. Zustand store subscription không cần thiết gây re-render
5. Images không có `cachePolicy`

---

## Task 1: Memo hóa các components hay re-render

**Files:**
- Modify: `src/components/story/StoryCard.tsx`
- Modify: `src/components/story/StoryCardHorizontal.tsx`
- Modify: `src/components/story/ChapterItem.tsx`
- Modify: `src/components/ui/BottomTabBar.tsx` (nếu đã tạo từ plan 03)

- [ ] **Step 1: Wrap StoryCard với React.memo**

`src/components/story/StoryCard.tsx`:
```tsx
import { memo } from "react";

// Thay: export function StoryCard(...)
// Thành:
function StoryCardComponent({ story, onPress }: StoryCardProps) {
  // ...existing code không đổi...
}

export const StoryCard = memo(StoryCardComponent);
```

- [ ] **Step 2: Memo StoryCardHorizontal**

Tương tự: wrap `StoryCardHorizontal` với `memo`.

- [ ] **Step 3: Memo ChapterItem**

Tương tự với `ChapterItem`.

- [ ] **Step 4: Stable callbacks với useCallback trong màn hình**

`app/(tabs)/index.tsx` — wrap `goToStory` với `useCallback`:
```tsx
import { useCallback } from "react";

const goToStory = useCallback((id: string) => {
  router.push(`/story/${id}`);
}, []);
```

`app/(tabs)/discover.tsx` — wrap renderItem callbacks:
```tsx
const renderStoryItem = useCallback(({ item }: { item: Story }) => (
  <StoryCardHorizontal story={item} onPress={() => router.push(`/story/${item.id}`)} />
), []);

// Dùng trong FlatList:
renderItem={renderStoryItem}
```

- [ ] **Step 5: Commit**
```bash
git add src/components/story/ app/(tabs)/index.tsx app/(tabs)/discover.tsx
git commit -m "perf: memo StoryCard/StoryCardHorizontal/ChapterItem, stable callbacks"
```

---

## Task 2: Tối ưu FlatList config

**Files:**
- Modify: `app/(tabs)/discover.tsx`
- Modify: `src/components/reader/ChapterSelectorModal.tsx`
- Modify: `app/story/[id].tsx`

- [ ] **Step 1: Thêm FlatList performance props vào Discover screen**

```tsx
<FlatList
  data={filtered}
  // ...existing props...
  maxToRenderPerBatch={10}        // render 10 items mỗi batch
  windowSize={5}                   // keep 5 screens worth in memory
  initialNumToRender={8}           // render 8 items đầu tiên
  removeClippedSubviews={true}     // Android: remove off-screen views
  updateCellsBatchingPeriod={50}   // batch update mỗi 50ms
/>
```

- [ ] **Step 2: Tối ưu ChapterSelectorModal FlatList**

```tsx
<FlatList
  data={filteredChapters}  // từ plan-05
  maxToRenderPerBatch={15}
  windowSize={7}
  initialNumToRender={10}
  removeClippedSubviews={true}
  // getItemLayout đã có — giữ nguyên (quan trọng nhất cho perf)
/>
```

- [ ] **Step 3: Fix nested ScrollView trong Home screen**

**Vấn đề:** `app/(tabs)/index.tsx` dùng `ScrollView` ngoài chứa nhiều view con có chiều cao cố định và `FlatList` ngang. Đây là pattern đúng vì FlatList ngang không conflict với ScrollView dọc. Tuy nhiên, 2 dòng grid truyện (`View > StoryCard * 4`) hiện render tĩnh — thêm separator và giảm memory.

Đảm bảo trending grid render đúng bằng `FlatList` 2 cột thay vì 2 `View`:
```tsx
// Thay 2 dòng View với 4 StoryCard mỗi dòng:
<FlatList
  data={TRENDING_STORIES.slice(0, 8)}
  numColumns={2}
  keyExtractor={(item) => item.id}
  columnWrapperStyle={{ gap: 12 }}
  renderItem={({ item }) => (
    <StoryCard story={item} onPress={() => goToStory(item.id)} />
  )}
  scrollEnabled={false}  // quan trọng: disabled vì nằm trong ScrollView
/>
```

- [ ] **Step 4: Commit**
```bash
git add app/(tabs)/discover.tsx app/(tabs)/index.tsx app/story/[id].tsx src/components/reader/ChapterSelectorModal.tsx
git commit -m "perf: FlatList windowSize/batchSize tuning, fix trending grid"
```

---

## Task 3: Tối ưu Image loading

**Files:**
- Modify: `src/components/story/StoryCard.tsx`
- Modify: `src/components/story/StoryCardHorizontal.tsx`

- [ ] **Step 1: Dùng expo-image thay Image từ react-native**

`expo-image` nhanh hơn, có built-in cache, blurhash placeholder:

```bash
npx expo install expo-image
```

- [ ] **Step 2: Thay Image import**

`src/components/story/StoryCard.tsx`:
```tsx
// Thay:
import { Image } from "react-native";
// Thành:
import { Image } from "expo-image";

// Cập nhật Image usage:
<Image
  source={{ uri: story.coverUrl }}
  style={{ width: "100%", aspectRatio: 2/3, borderRadius: 12 }}
  contentFit="cover"
  transition={200}        // fade transition khi load xong
  cachePolicy="memory-disk"  // cache cả memory lẫn disk
  placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}  // generic blurhash
/>
```

`src/components/story/StoryCardHorizontal.tsx` — tương tự.

- [ ] **Step 3: Commit**
```bash
npx expo install expo-image
git add src/components/story/StoryCard.tsx src/components/story/StoryCardHorizontal.tsx package.json
git commit -m "perf: replace Image with expo-image for caching and blurhash placeholder"
```

---

## Task 4: Zustand selector optimization

**Vấn đề:** Nếu component subscribe `useBookshelfStore()` (lấy toàn bộ store), nó re-render khi bất kỳ trường nào trong store thay đổi.

**Files:**
- Audit: tất cả files dùng `useBookshelfStore`, `useAuthStore`, `useReaderStore`

- [ ] **Step 1: Kiểm tra các store subscriptions**

```bash
grep -rn "useBookshelfStore()" src/ app/ --include="*.tsx" --include="*.ts"
grep -rn "useAuthStore()" src/ app/ --include="*.tsx" --include="*.ts"
grep -rn "useReaderStore()" src/ app/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Fix subscriptions dùng selector**

Mỗi chỗ dùng store, chuyển sang dùng selector cụ thể:

```tsx
// Thay:
const { bookmarks, history } = useBookshelfStore();

// Thành:
const bookmarks = useBookshelfStore((s) => s.bookmarks);
const history = useBookshelfStore((s) => s.history);
```

Với selector, component chỉ re-render khi `bookmarks` hoặc `history` thay đổi, không phải khi `addBookmark` function reference thay đổi.

- [ ] **Step 3: Dùng shallow comparison cho object selectors**

```tsx
import { useShallow } from "zustand/react/shallow";

// Khi cần lấy nhiều fields cùng lúc:
const { bookmarks, history } = useBookshelfStore(
  useShallow((s) => ({ bookmarks: s.bookmarks, history: s.history }))
);
```

- [ ] **Step 4: Commit**
```bash
git add app/ src/
git commit -m "perf: use zustand selectors to reduce unnecessary re-renders"
```

---

## Task 5: Reader content performance

**Vấn đề:** Nội dung chương render tất cả paragraphs cùng lúc. Với chương dài 200+ paragraphs, có thể chậm.

**Files:**
- Modify: `app/reader/[storyId]/[chapterId].tsx`

- [ ] **Step 1: Dùng FlashList thay FlatList cho nội dung (nếu nhiều chapter)**

Với nội dung đọc, `ScrollView` là đúng vì người dùng scroll liên tục. Tuy nhiên, cần đảm bảo Text không re-render khi không cần thiết.

Thay vì render từng paragraph trong map(), tách thành component riêng với memo:

```tsx
const ParagraphText = memo(function ParagraphText({
  text, color, fontSize, lineHeight, isActive
}: {
  text: string; color: string; fontSize: number; lineHeight: number; isActive: boolean
}) {
  return (
    <Text
      style={{
        color,
        fontSize,
        lineHeight,
        backgroundColor: isActive ? "rgba(233,64,87,0.1)" : "transparent",
        borderRadius: 4,
        marginBottom: fontSize * 0.8,
        paddingHorizontal: isActive ? 4 : 0,
      }}
      selectable
    >
      {text}
    </Text>
  );
});
```

Dùng trong reader:
```tsx
{paragraphs.map((p, i) => (
  <ParagraphText
    key={i}
    text={p}
    color={themeStyle.text}
    fontSize={settings.fontSizePx}
    lineHeight={settings.fontSizePx * 1.8}
    isActive={activeParagraphIndex === i}
  />
))}
```

- [ ] **Step 2: Commit**
```bash
git add app/reader/[storyId]/[chapterId].tsx
git commit -m "perf: memo ParagraphText to reduce re-renders during TTS highlight"
```

---

## Manual Performance Test Checklist

1. React DevTools (hoặc Flipper): kiểm tra component re-render highlights — StoryCard không re-render khi scroll
2. Home screen scroll: 60fps không giật (đặc biệt Android)
3. Discover: search real-time không lag
4. Chapter modal với 50 chương: scroll mượt
5. Reader với 30+ paragraphs: không jank khi highlight thay đổi mỗi paragraph TTS
6. Image load: hiện blurhash trước khi ảnh thật load xong
