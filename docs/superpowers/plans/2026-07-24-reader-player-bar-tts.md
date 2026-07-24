# Reader Music-Player Bar + TTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the reader's bottom toolbar with an always-visible music-player-style bar featuring TTS playback controls, chapter navigation, settings shortcut, and a volume slider popup.

**Architecture:** New `ReaderPlayerBar` (always-visible dark bottom bar with TTS + internal state) and `ChapterSelectorModal` (FlatList chapter picker); reader screen passes paragraphs array down; `ReaderToolbar` keeps only its top bar.

**Tech Stack:** Expo SDK 57, expo-speech, expo-router v4, TypeScript strict, React Native

## Global Constraints

- All UI strings in Vietnamese
- Primary color: `#E94057`
- Player bar background always `#1a1a1a` (dark) regardless of reader theme
- No Reanimated animations — simple show/hide only
- TypeScript strict mode — no `any`, no unused vars
- `expo-speech` for TTS; `volume` option passed on Android (iOS uses system volume)
- Player bar is **always visible**; top toolbar tap-to-show/hide unchanged
- Paragraph split: `content.split(/\n\n+/).filter(p => p.trim().length > 0)`
- Play/Pause circle: 54px diameter, bg `#E94057`
- Disabled chapter nav buttons: opacity 0.35
- Safe area: `useSafeAreaInsets().bottom` for bottom padding

## Controls layout (5 buttons)

```
[ ⚙️ ]   [ ⏮ ]   [ ▶/⏸ ]   [ ⏭ ]   [ 🔊 ]
Settings  Prev Ch  Play/Pause  Next Ch  Volume
```

- ⚙️ **Settings** (far left) — calls `onSettings` prop → opens ReaderSettings modal
- ⏮ **Prev Chapter** — icon only, no label, disabled + opacity 0.35 when `hasPrev=false`
- ▶/⏸ **Play/Pause** — big circle button, center
- ⏭ **Next Chapter** — icon only, no label, disabled + opacity 0.35 when `hasNext=false`
- 🔊 **Volume** (far right) — tap toggles vertical volume popup above the button

## Volume popup

Vertical popup above the 🔊 button:
- Position: `absolute`, bottom: 68, right: -8
- Background: `#222`, border `#333`, border-radius 10
- Contains: 🔊 icon (top), vertical slider track (90px tall), percentage text (bottom)
- Slider track: `#333` background, `#E94057` fill from bottom, `border-radius: 14`
- Tap anywhere on track → compute volume from touch Y position (0=top=1.0, 90=bottom=0)
- Default volume: `0.8`

---

## File Map

| Action | Path |
|--------|------|
| **Install** | `expo-speech` |
| **Create** | `src/components/reader/ReaderPlayerBar.tsx` |
| **Create** | `src/components/reader/ChapterSelectorModal.tsx` |
| **Modify** | `src/components/reader/ReaderToolbar.tsx` — remove bottom bar |
| **Modify** | `app/reader/[storyId]/[chapterId].tsx` — wire everything |

---

### Task 1: Install expo-speech

**Files:**
- Modify: `package.json` (via npx expo install)

**Interfaces:**
- Produces: `import * as Speech from 'expo-speech'` available in Tasks 4+

- [ ] **Step 1: Install**

```bash
cd /home/hiepnv/truyen-react-native && npx expo install expo-speech
```

Expected: added to `dependencies` in package.json, no errors.

- [ ] **Step 2: Verify**

```bash
grep expo-speech package.json
```

Expected: line like `"expo-speech": "~13.x.x"`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json 2>/dev/null; git add package.json
git commit -m "feat: install expo-speech for TTS"
```

---

### Task 2: Strip bottom bar from ReaderToolbar

**Files:**
- Modify: `src/components/reader/ReaderToolbar.tsx`

**Interfaces:**
- Produces: `ReaderToolbar` props = `{ title, chapterTitle, visible, isDark, onBack, onSettings }` (removed: `hasPrev`, `hasNext`, `onPrevChapter`, `onNextChapter`)

- [ ] **Step 1: Rewrite ReaderToolbar.tsx** (top bar only)

```tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  title: string;
  chapterTitle: string;
  visible: boolean;
  isDark: boolean;
  onBack: () => void;
  onSettings: () => void;
}

export function ReaderToolbar({ title, chapterTitle, visible, isDark, onBack, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const bg = isDark ? "#1f2937" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const subTextColor = isDark ? "#9ca3af" : "#6b7280";
  const iconColor = isDark ? "#e0e0e0" : "#333333";

  return (
    <View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        backgroundColor: bg,
        paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: "row", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2, elevation: 3,
      }}
    >
      <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
        <Ionicons name="arrow-back" size={24} color={iconColor} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", fontSize: 16, color: textColor }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: subTextColor }} numberOfLines={1}>
          {chapterTitle}
        </Text>
      </View>
      <TouchableOpacity onPress={onSettings} style={{ marginLeft: 12 }}>
        <Ionicons name="settings-outline" size={22} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/reader/ReaderToolbar.tsx
git commit -m "refactor: strip bottom bar from ReaderToolbar"
```

---

### Task 3: Create ChapterSelectorModal

**Files:**
- Create: `src/components/reader/ChapterSelectorModal.tsx`

**Interfaces:**
- Consumes: `Chapter` from `../../types/story`
- Produces:
  ```ts
  export function ChapterSelectorModal(props: {
    visible: boolean;
    chapters: Chapter[];
    currentChapterId: string;
    onSelect: (chapter: Chapter) => void;
    onClose: () => void;
  }): JSX.Element
  ```

- [ ] **Step 1: Create ChapterSelectorModal.tsx**

```tsx
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "../../types/story";

interface Props {
  visible: boolean;
  chapters: Chapter[];
  currentChapterId: string;
  onSelect: (chapter: Chapter) => void;
  onClose: () => void;
}

export function ChapterSelectorModal({ visible, chapters, currentChapterId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn chương</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={chapters}
            keyExtractor={(item) => item.id}
            initialScrollIndex={Math.max(0, currentIndex)}
            getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const isActive = item.id === currentChapterId;
              return (
                <TouchableOpacity
                  style={[styles.row, isActive && styles.rowActive]}
                  onPress={() => onSelect(item)}
                >
                  <Text
                    style={[styles.rowText, isActive && styles.rowTextActive]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {isActive && <Ionicons name="headset-outline" size={16} color="#E94057" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 16 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#333",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  row: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2a2a2a",
  },
  rowActive: { backgroundColor: "#2a1a1e" },
  rowText: { flex: 1, color: "#aaa", fontSize: 14, marginRight: 8 },
  rowTextActive: { color: "#E94057", fontWeight: "600" },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/reader/ChapterSelectorModal.tsx
git commit -m "feat: add ChapterSelectorModal"
```

---

### Task 4: Create ReaderPlayerBar

**Files:**
- Create: `src/components/reader/ReaderPlayerBar.tsx`

**Interfaces:**
- Consumes: `expo-speech` (Task 1)
- Produces:
  ```ts
  export function ReaderPlayerBar(props: {
    storyTitle: string;
    chapterTitle: string;
    paragraphs: string[];
    onPrevChapter: () => void;
    onNextChapter: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    onChapterSelect: () => void;
    onSettings: () => void;
  }): JSX.Element
  ```

Internal state: `paragraphIndex` (resets on chapter change), `isPlaying`, `volume` (0–1, default 0.8), `volumeVisible`.

TTS: `Speech.speak(paragraphs[idx], { language: "vi-VN", volume, onDone })` — onDone auto-advances index then speaks next paragraph. `Speech.stop()` to pause. `playingRef` + `indexRef` prevent stale closure bugs.

Volume popup: absolute View above 🔊 button, contains vertical track (90px). Tap Y position on track → `volume = 1 - y / 90`. Uses `onStartShouldSetResponder` + `onResponderGrant`/`onResponderMove` for drag.

- [ ] **Step 1: Create ReaderPlayerBar.tsx**

```tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  storyTitle: string;
  chapterTitle: string;
  paragraphs: string[];
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onChapterSelect: () => void;
  onSettings: () => void;
}

export function ReaderPlayerBar({
  storyTitle,
  chapterTitle,
  paragraphs,
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
  onChapterSelect,
  onSettings,
}: Props) {
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [volumeVisible, setVolumeVisible] = useState(false);

  const indexRef = useRef(0);
  const playingRef = useRef(false);
  const TRACK_HEIGHT = 90;

  // Sync ref when state changes
  useEffect(() => {
    indexRef.current = paragraphIndex;
  }, [paragraphIndex]);

  // Reset on chapter change
  useEffect(() => {
    playingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
    setParagraphIndex(0);
    indexRef.current = 0;
  }, [paragraphs]);

  function speakAt(index: number, vol: number) {
    if (index < 0 || index >= paragraphs.length) return;
    Speech.stop();
    Speech.speak(paragraphs[index], {
      language: "vi-VN",
      volume: vol,
      onDone: () => {
        if (!playingRef.current) return;
        const next = indexRef.current + 1;
        if (next < paragraphs.length) {
          setParagraphIndex(next);
          indexRef.current = next;
          speakAt(next, vol);
        } else {
          setIsPlaying(false);
          playingRef.current = false;
        }
      },
    });
  }

  function handlePlayPause() {
    if (isPlaying) {
      playingRef.current = false;
      Speech.stop();
      setIsPlaying(false);
    } else {
      playingRef.current = true;
      setIsPlaying(true);
      speakAt(paragraphIndex, volume);
    }
  }

  function handlePrevChapter() {
    playingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
    onPrevChapter();
  }

  function handleNextChapter() {
    playingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
    onNextChapter();
  }

  function handleVolumeTouch(e: GestureResponderEvent) {
    const y = Math.max(0, Math.min(TRACK_HEIGHT, e.nativeEvent.locationY));
    const newVol = parseFloat((1 - y / TRACK_HEIGHT).toFixed(2));
    setVolume(newVol);
    // If playing, restart current paragraph with new volume
    if (isPlaying) {
      playingRef.current = false;
      Speech.stop();
      playingRef.current = true;
      speakAt(indexRef.current, newVol);
    }
  }

  const progress = paragraphs.length > 1 ? paragraphIndex / (paragraphs.length - 1) : 0;
  const volPct = Math.round(volume * 100);

  const volIcon: keyof typeof Ionicons.glyphMap =
    volume === 0 ? "volume-mute" : volume < 0.4 ? "volume-low" : "volume-high";

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.storyTitle} numberOfLines={1}>{storyTitle}</Text>
        <TouchableOpacity style={styles.chapterRow} onPress={onChapterSelect} activeOpacity={0.7}>
          <Text style={styles.chapterTitle} numberOfLines={1}>{chapterTitle}</Text>
          <Ionicons name="chevron-up" size={14} color="#888" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>
      <Text style={styles.progressLabel}>Đ.{paragraphIndex + 1} / {paragraphs.length || 1}</Text>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Settings */}
        <TouchableOpacity style={styles.ctrlBtn} onPress={onSettings}>
          <Ionicons name="settings-outline" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Prev chapter */}
        <TouchableOpacity
          style={[styles.ctrlBtn, !hasPrev && styles.ctrlDisabled]}
          onPress={handlePrevChapter}
          disabled={!hasPrev}
        >
          <Ionicons name="play-skip-back" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={26}
            color="#fff"
            style={isPlaying ? undefined : { marginLeft: 3 }}
          />
        </TouchableOpacity>

        {/* Next chapter */}
        <TouchableOpacity
          style={[styles.ctrlBtn, !hasNext && styles.ctrlDisabled]}
          onPress={handleNextChapter}
          disabled={!hasNext}
        >
          <Ionicons name="play-skip-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Volume */}
        <View style={styles.volWrap}>
          {volumeVisible && (
            <View style={styles.volPopup}>
              <Ionicons name={volIcon} size={16} color="#fff" />
              <View
                style={styles.volTrack}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleVolumeTouch}
                onResponderMove={handleVolumeTouch}
              >
                <View style={[styles.volFill, { height: `${volPct}%` as `${number}%` }]} />
              </View>
              <Text style={styles.volPct}>{volPct}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => setVolumeVisible((v) => !v)}
          >
            <Ionicons name={volIcon} size={22} color={volumeVisible ? "#E94057" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#1a1a1a",
    paddingTop: 14, paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#333",
    zIndex: 10,
  },
  meta: { alignItems: "center", marginBottom: 10 },
  storyTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  chapterRow: { flexDirection: "row", alignItems: "center" },
  chapterTitle: { color: "#aaa", fontSize: 12 },
  progressTrack: {
    height: 3, backgroundColor: "#444", borderRadius: 2,
    marginBottom: 4, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
  progressLabel: { color: "#666", fontSize: 10, textAlign: "right", marginBottom: 14 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ctrlBtn: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  ctrlDisabled: { opacity: 0.35 },
  playBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "#E94057",
    alignItems: "center", justifyContent: "center",
  },
  volWrap: { alignItems: "center", justifyContent: "center" },
  volPopup: {
    position: "absolute", bottom: 52, right: -8,
    backgroundColor: "#222",
    borderWidth: 1, borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: "center", gap: 8,
    zIndex: 20,
  },
  volTrack: {
    width: 28, height: 90,
    backgroundColor: "#333",
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  volFill: { width: "100%", backgroundColor: "#E94057", borderRadius: 14 },
  volPct: { color: "#aaa", fontSize: 10 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/reader/ReaderPlayerBar.tsx
git commit -m "feat: add ReaderPlayerBar — music player UI, TTS, volume popup"
```

---

### Task 5: Wire reader screen

**Files:**
- Modify: `app/reader/[storyId]/[chapterId].tsx`

**Interfaces:**
- Consumes:
  - `ReaderToolbar` — slim props (no chapter nav)
  - `ReaderPlayerBar` — new props (Task 4 interface)
  - `ChapterSelectorModal` — (Task 3 interface)
- Produces: complete working reader screen

Changes from current file:
- Remove `paragraphIndex` state (now internal to `ReaderPlayerBar`)
- Remove `hasPrev`/`hasNext`/`onPrevChapter`/`onNextChapter` from `ReaderToolbar` call
- Pass `onSettings` to `ReaderPlayerBar` (removes settings from top toolbar… no, keep both — top toolbar settings also stays)
- Add `chapterSelectorVisible` state
- Add `<ReaderPlayerBar>` and `<ChapterSelectorModal>`
- `paddingBottom: 200` on ScrollView (player bar is ~170px tall)
- Derive `paragraphs` array and pass to `ReaderPlayerBar`

- [ ] **Step 1: Rewrite app/reader/[storyId]/[chapterId].tsx**

```tsx
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { ReaderToolbar } from "../../../src/components/reader/ReaderToolbar";
import { ReaderSettings } from "../../../src/components/reader/ReaderSettings";
import { ReaderPlayerBar } from "../../../src/components/reader/ReaderPlayerBar";
import { ChapterSelectorModal } from "../../../src/components/reader/ChapterSelectorModal";
import { MOCK_STORIES } from "../../../src/data/mockStories";
import { getMockChapters } from "../../../src/data/mockChapters";
import { useReaderStore } from "../../../src/stores/readerStore";
import { useBookshelfStore } from "../../../src/stores/bookshelfStore";
import { Chapter } from "../../../src/types/story";

const THEME_STYLES = {
  light: { bg: "#fdf6e3", text: "#2c2c2c", statusBar: "dark-content" as const },
  dark: { bg: "#1a1a1a", text: "#e0e0e0", statusBar: "light-content" as const },
  sepia: { bg: "#f4ecd8", text: "#4a3728", statusBar: "dark-content" as const },
};

export default function ReaderScreen() {
  const { storyId, chapterId } = useLocalSearchParams<{ storyId: string; chapterId: string }>();
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chapterSelectorVisible, setChapterSelectorVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings } = useReaderStore();
  const { addToHistory } = useBookshelfStore();

  const story = MOCK_STORIES.find((s) => s.id === storyId);
  const chapters = story ? getMockChapters(story.id) : [];
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const chapter = chapters[currentIndex];

  const paragraphs =
    chapter?.content.split(/\n\n+/).filter((p) => p.trim().length > 0) ?? [];

  const themeStyle = THEME_STYLES[settings.theme];

  useEffect(() => {
    if (story && chapter) {
      addToHistory(story.id, chapter.id, chapter.number);
    }
    autoHideToolbar();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
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

  function handleChapterSelect(c: Chapter) {
    setChapterSelectorVisible(false);
    const idx = chapters.findIndex((ch) => ch.id === c.id);
    if (idx !== -1 && idx !== currentIndex) {
      goToChapter(idx);
    }
  }

  if (!story || !chapter) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Không tìm thấy chương</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeStyle.bg }}>
      <StatusBar barStyle={themeStyle.statusBar} backgroundColor={themeStyle.bg} />

      <ReaderToolbar
        title={story.title}
        chapterTitle={chapter.title}
        visible={toolbarVisible}
        isDark={settings.theme === "dark"}
        onBack={() => router.back()}
        onSettings={() => {
          setSettingsVisible(true);
          setToolbarVisible(false);
        }}
      />

      <TouchableWithoutFeedback onPress={toggleToolbar}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 100, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              color: themeStyle.text,
              fontSize: settings.fontSizePx,
              lineHeight: settings.fontSizePx * 1.8,
            }}
            selectable
          >
            {chapter.title}
            {"\n\n"}
            {chapter.content}
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>

      <ReaderPlayerBar
        storyTitle={story.title}
        chapterTitle={chapter.title}
        paragraphs={paragraphs}
        onPrevChapter={() => goToChapter(currentIndex - 1)}
        onNextChapter={() => goToChapter(currentIndex + 1)}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < chapters.length - 1}
        onChapterSelect={() => setChapterSelectorVisible(true)}
        onSettings={() => {
          setSettingsVisible(true);
          setToolbarVisible(false);
        }}
      />

      <ReaderSettings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      <ChapterSelectorModal
        visible={chapterSelectorVisible}
        chapters={chapters}
        currentChapterId={chapterId}
        onSelect={handleChapterSelect}
        onClose={() => setChapterSelectorVisible(false)}
      />
    </View>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /home/hiepnv/truyen-react-native && npx tsc --noEmit 2>&1 | head -50
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/reader/[storyId]/[chapterId].tsx
git commit -m "feat: wire ReaderPlayerBar + ChapterSelectorModal into reader screen"
```

---

## Manual Test Checklist

1. Mở truyện → tap "Đọc từ đầu"
2. **Player bar** luôn hiển thị dưới cùng (dark bg)
3. Tap tên chương → modal chọn chương, chương hiện tại highlight đỏ
4. Tap chương khác → điều hướng, modal đóng
5. Tap ▶ → TTS bắt đầu đọc, progress bar tăng dần
6. Tap ⏸ → TTS dừng
7. Tap ⏮ (chapter trước, disabled nếu đang ở chapter 1) → chuyển chapter
8. Tap ⏭ (chapter sau, disabled nếu chapter cuối) → chuyển chapter
9. Tap 🔊 → popup volume hiện, kéo lên xuống thay đổi âm lượng
10. Tap ⚙️ → modal theme/font size hiện lên
11. Tap vùng nội dung → top toolbar hiện/ẩn
12. Hết chapter → TTS tự dừng
