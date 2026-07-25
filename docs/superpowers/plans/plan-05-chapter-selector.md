# Plan 05: Chapter Selector — Smooth Navigation

> **Mục tiêu:** Cải thiện việc chọn và chuyển chương trong reader. Vấn đề hiện tại: (1) `router.replace()` khi chuyển chương gây full re-render và mất scroll position; (2) ChapterSelectorModal scroll đến chapter hiện tại có thể fail nếu `initialScrollIndex` không chính xác; (3) chưa có swipe gesture để chuyển chương.

**Files liên quan:**
- `app/reader/[storyId]/[chapterId].tsx` — reader screen
- `src/components/reader/ChapterSelectorModal.tsx` — modal chọn chương
- `src/components/reader/ReaderPlayerBar.tsx` — player bar có chapter nav

---

## Task 1: Fix ChapterSelectorModal scroll về chapter hiện tại

**Vấn đề:** `initialScrollIndex` với `FlatList` có thể crash nếu index nằm ngoài visible range khi chưa render. `getItemLayout` cần chính xác.

**Files:**
- Modify: `src/components/reader/ChapterSelectorModal.tsx`

- [ ] **Step 1: Fix initialScrollIndex với onLayout**

Thay `initialScrollIndex` (có thể gây crash) bằng `ref.scrollToIndex()` sau khi list mount:

```tsx
import { useRef, useEffect } from "react";
import { FlatList, Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

export function ChapterSelectorModal({ visible, chapters, currentChapterId, onSelect, onClose }) {
  const listRef = useRef<FlatList>(null);
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);

  // Scroll về chapter hiện tại khi modal mở
  useEffect(() => {
    if (visible && currentIndex >= 0) {
      // Delay nhỏ để FlatList render xong trước
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: currentIndex,
          animated: false,
          viewPosition: 0.3,  // chapter hiện tại xuất hiện ở 30% từ trên
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, currentIndex]);

  // ...rest of component dùng listRef thay vì initialScrollIndex
  return (
    <Modal ...>
      <FlatList
        ref={listRef}
        // XÓA: initialScrollIndex={Math.max(0, currentIndex)}
        onScrollToIndexFailed={(info) => {
          // Fallback: scroll đến offset ước tính nếu index fail
          listRef.current?.scrollToOffset({
            offset: info.index * 56,
            animated: false,
          });
        }}
        ...
      />
    </Modal>
  );
}
```

- [ ] **Step 2: Thêm search trong ChapterSelectorModal**

User có thể tìm nhanh chương theo số:

```tsx
const [search, setSearch] = useState("");
const filteredChapters = search
  ? chapters.filter(c => c.title.includes(search) || String(c.number).includes(search))
  : chapters;

// Header của modal:
<View style={styles.header}>
  <Text style={styles.headerTitle}>Chọn chương ({chapters.length})</Text>
  <TouchableOpacity onPress={onClose}>
    <Ionicons name="close" size={24} color="#ccc" />
  </TouchableOpacity>
</View>
<View style={styles.searchBox}>
  <Ionicons name="search" size={14} color="#666" />
  <TextInput
    style={styles.searchInput}
    placeholder="Tìm chương..."
    placeholderTextColor="#555"
    value={search}
    onChangeText={setSearch}
    keyboardType="numeric"
    returnKeyType="search"
  />
</View>
```

Styles mới:
```ts
searchBox: {
  flexDirection: "row", alignItems: "center", gap: 8,
  backgroundColor: "#252525", borderRadius: 10,
  marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8,
},
searchInput: { flex: 1, color: "#fff", fontSize: 14 },
```

- [ ] **Step 3: Commit**
```bash
git add src/components/reader/ChapterSelectorModal.tsx
git commit -m "fix: chapter modal scroll-to-current with fallback, add search"
```

---

## Task 2: Smooth chapter transition (không full re-render)

**Vấn đề hiện tại:** `router.replace()` unmount + remount toàn bộ ReaderScreen khi chuyển chương. TTS bị stop, scroll về top, và có flicker.

**Giải pháp:** Giữ `chapterId` trong local state trong reader screen thay vì dùng URL params để navigate. URL chỉ update sau khi chapter load xong.

**Files:**
- Modify: `app/reader/[storyId]/[chapterId].tsx`

- [ ] **Step 1: Dùng local state cho currentChapterId**

```tsx
const { storyId, chapterId: initialChapterId } = useLocalSearchParams<{ storyId: string; chapterId: string }>();

// Local state — không navigate khi đổi chapter
const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);

const chapters = story ? getMockChapters(story.id) : [];
const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);
const chapter = chapters[currentIndex];
```

- [ ] **Step 2: goToChapter chỉ update state (không router.replace)**

```tsx
const scrollRef = useRef<ScrollView>(null);

function goToChapter(index: number) {
  if (index < 0 || index >= chapters.length) return;
  const nextChapter = chapters[index];

  // Scroll về top trước
  scrollRef.current?.scrollTo({ y: 0, animated: false });

  // Update local state (không re-mount component)
  setCurrentChapterId(nextChapter.id);

  // Update URL để history đúng (background, không navigate)
  router.setParams({ chapterId: nextChapter.id });
}
```

- [ ] **Step 3: Thêm transition animation khi đổi chương**

Dùng `Animated.Value` hoặc đơn giản là fade:

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from "react-native-reanimated";

const contentOpacity = useSharedValue(1);

function goToChapter(index: number) {
  if (index < 0 || index >= chapters.length) return;

  // Fade out
  contentOpacity.value = withTiming(0, { duration: 150 }, () => {
    runOnJS(setCurrentChapterId)(chapters[index].id);
    runOnJS(scrollToTop)();
    // Fade in
    contentOpacity.value = withTiming(1, { duration: 200 });
  });

  router.setParams({ chapterId: chapters[index].id });
}

function scrollToTop() {
  scrollRef.current?.scrollTo({ y: 0, animated: false });
}

const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

// Wrap content:
<Animated.View style={[{ flex: 1 }, contentStyle]}>
  <ScrollView ref={scrollRef} ...>
    ...
  </ScrollView>
</Animated.View>
```

- [ ] **Step 4: Commit**
```bash
git add app/reader/[storyId]/[chapterId].tsx
git commit -m "feat: smooth chapter transition with local state, fade animation"
```

---

## Task 3: Swipe gesture để chuyển chương

**Mục tiêu:** Swipe sang trái/phải để chuyển chương tiếp/trước.

**Files:**
- Modify: `app/reader/[storyId]/[chapterId].tsx`

**Lưu ý:** Cần cẩn thận để không conflict với ScrollView vertical scroll.

- [ ] **Step 1: Dùng PanResponder để detect horizontal swipe**

```tsx
import { PanResponder } from "react-native";

const swipeThreshold = 60; // px
const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: (_, gestureState) => {
    // Chỉ bắt gesture nếu horizontal > vertical (để không conflict scroll)
    return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
           Math.abs(gestureState.dx) > 10;
  },
  onPanResponderRelease: (_, gestureState) => {
    if (gestureState.dx < -swipeThreshold) {
      // Swipe trái → chương tiếp
      goToChapter(currentIndex + 1);
    } else if (gestureState.dx > swipeThreshold) {
      // Swipe phải → chương trước
      goToChapter(currentIndex - 1);
    }
  },
});
```

- [ ] **Step 2: Áp panHandlers lên content view**

```tsx
<View style={{ flex: 1 }} {...panResponder.panHandlers}>
  <Animated.View style={[{ flex: 1 }, contentStyle]}>
    <ScrollView ref={scrollRef} ...>
      ...
    </ScrollView>
  </Animated.View>
</View>
```

- [ ] **Step 3: Hiện edge hint khi swipe**

Khi `dx > 20`, hiện arrow hint mờ ở cạnh màn hình:

```tsx
const [swipeHint, setSwipeHint] = useState<"left" | "right" | null>(null);

onPanResponderMove: (_, gestureState) => {
  if (gestureState.dx > 20 && currentIndex > 0) setSwipeHint("right");
  else if (gestureState.dx < -20 && currentIndex < chapters.length - 1) setSwipeHint("left");
  else setSwipeHint(null);
},
onPanResponderRelease: () => {
  setSwipeHint(null);
  // ... xử lý navigate
},

// Render:
{swipeHint === "right" && (
  <View style={{ position: "absolute", left: 0, top: "50%", marginTop: -24, padding: 8, backgroundColor: "rgba(0,0,0,0.2)", borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>
    <Ionicons name="chevron-back" size={24} color="#fff" />
  </View>
)}
{swipeHint === "left" && (
  <View style={{ position: "absolute", right: 0, top: "50%", marginTop: -24, padding: 8, backgroundColor: "rgba(0,0,0,0.2)", borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>
    <Ionicons name="chevron-forward" size={24} color="#fff" />
  </View>
)}
```

- [ ] **Step 4: TypeScript check + Commit**
```bash
npx tsc --noEmit 2>&1 | head -20
git add app/reader/ src/components/reader/ChapterSelectorModal.tsx
git commit -m "feat: swipe gesture for chapter navigation with edge hint"
```

---

## Manual Test Checklist

1. Mở Reader → tap tên chương trong player bar → modal mở
2. Modal tự scroll đến chương đang đọc (không crash)
3. Search "5" trong modal → thấy chương 5, 15, 25...
4. Chọn chương khác → màn hình fade, scroll về top, nội dung mới xuất hiện (không flash/reload)
5. TTS đang play → chuyển chương → TTS stop, reset về paragraph 0 chương mới
6. Swipe sang trái → fade + chuyển chương tiếp, có arrow hint
7. Swipe sang phải → chương trước
8. Swipe ở chương 1 sang phải → không có action (disabled)
9. Scroll dọc bình thường không bị trigger swipe
