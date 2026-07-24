# Reader Music-Player Bar + TTS Design

## Overview

Replace the current simple bottom toolbar in the reader screen with a music-player-style bottom bar (dark background, centered controls) and integrate TTS (text-to-speech) via `expo-speech` for paragraph-by-paragraph reading.

---

## Goals

- Music player aesthetic: always-visible dark bottom bar (does not hide on tap)
- Displays story title + chapter name (tap chapter name to open chapter selector)
- Progress bar showing current paragraph position in chapter
- 5 controls: Prev Chapter | Back paragraph | Play/Pause | Forward paragraph | Next Chapter
- TTS reads aloud paragraph by paragraph using `expo-speech`
- Chapter selector modal (FlatList of all chapters, tap to jump)

---

## Architecture

### New file: `src/components/reader/ReaderPlayerBar.tsx`

Always-visible bottom bar. Receives:

```ts
interface ReaderPlayerBarProps {
  storyTitle: string;
  chapterTitle: string;
  paragraphs: string[];          // chapter content split by \n\n
  paragraphIndex: number;        // current paragraph (0-based)
  onParagraphChange: (i: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onChapterSelect: () => void;   // opens chapter selector modal
}
```

Internal state: `isPlaying: boolean`. Uses `expo-speech` to speak current paragraph, auto-advances to next on completion.

### New file: `src/components/reader/ChapterSelectorModal.tsx`

Bottom sheet modal. Props:

```ts
interface ChapterSelectorModalProps {
  visible: boolean;
  chapters: Chapter[];
  currentChapterId: string;
  onSelect: (chapter: Chapter) => void;
  onClose: () => void;
}
```

FlatList of chapters, currently-reading chapter highlighted, scroll to it on open.

### Modified: `app/reader/[storyId]/[chapterId].tsx`

- Split `chapter.content` into paragraphs array: `content.split(/\n\n+/).filter(Boolean)`
- Track `paragraphIndex: number` in state
- Pass paragraphs + paragraphIndex to `ReaderPlayerBar`
- The ScrollView scrolls to the active paragraph via a ref array
- Add `ChapterSelectorModal`
- Top toolbar (back + settings) remains tap-to-show/hide as before; bottom player bar is **always visible**

### Modified: `src/components/reader/ReaderToolbar.tsx`

Remove the bottom prev/next chapter buttons — they move to the player bar. Keep only the top bar (back + settings).

---

## TTS Logic

```
paragraphs = content.split(/\n\n+/).filter(Boolean)
```

**Play:** `Speech.speak(paragraphs[paragraphIndex], { onDone: handleParagraphDone })`

**handleParagraphDone:** if `paragraphIndex + 1 < paragraphs.length` → advance index; else stop (end of chapter).

**Pause/Stop:** `Speech.stop()`

**Seek back (−1 paragraph):** Stop → set index − 1 → if playing, restart speech.

**Seek forward (+1 paragraph):** Stop → set index + 1 → if playing, restart speech.

**Chapter change:** Stop TTS, reset `paragraphIndex` to 0.

---

## Player Bar UI (music player style)

```
┌─────────────────────────────────────────────────────┐
│  Story Title                                        │
│  Chapter Name  ↑  (tap to open chapter selector)   │
│  ──────── progress bar ────────────────────────     │
│  para 8 of 23                                       │
│  [|◀]   [◀◀]   [ ▶ / ‖ ]   [▶▶]   [▶|]           │
└─────────────────────────────────────────────────────┘
```

- Background: always `#1a1a1a` (dark) regardless of reader theme
- Play/Pause button: circle, bg `#E94057`, size 54px
- Other icon buttons: 40px tap targets, icon color `#ccc`
- Disabled buttons (hasPrev/hasNext): opacity 0.35
- Uses `useSafeAreaInsets().bottom` for bottom padding
- Progress bar: white fill on `#444` track, shows `paragraphIndex / paragraphs.length`

---

## Chapter Selector Modal

- Modal with `transparent` background, dark overlay
- Bottom sheet style (slides from bottom)
- FlatList of all chapters
- Current chapter: primary color accent
- Already-read chapters: slightly dimmed
- Tap → stop TTS + navigate to chapter

---

## What Does NOT Change

- Top toolbar (back, title, settings) — tap to show/hide with 3s auto-hide timer
- `ReaderSettings` modal (theme + font size) — unchanged
- `useBookshelfStore` / `useReaderStore` — no changes
- `ReaderToolbar` top bar — keep as-is, only remove bottom section

---

## Constraints

- `expo-speech` only (no native audio, no streaming)
- No animations (Reanimated v4 API not available)
- TypeScript strict mode
- All UI text in Vietnamese
- Primary color: `#E94057`
- Player bar always visible (not hidden on tap)
- Tap anywhere on ScrollView still toggles top toolbar visibility
