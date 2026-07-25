# Plan 01: TTS Improvement — Test với đoạn tiểu thuyết thật

> **Mục tiêu:** Cải thiện TTS trong ReaderPlayerBar: thêm tốc độ đọc, highlight đoạn đang đọc, và test bằng đoạn văn tiểu thuyết thực tế (thay hardcode placeholder).

**Tech Stack:** expo-speech (đã cài), React Native Reanimated (đã cài)

**Files liên quan:**
- `src/components/reader/ReaderPlayerBar.tsx` — main TTS logic
- `src/data/mockChapters.ts` — nơi có nội dung hardcode
- `app/reader/[storyId]/[chapterId].tsx` — truyền paragraphs xuống

---

## Task 1: Thay nội dung hardcode bằng đoạn tiểu thuyết thật

**Files:**
- Modify: `src/data/mockChapters.ts`

**Vấn đề hiện tại:** `CHAPTER_CONTENT` là đoạn văn ngắn lặp lại 3 lần — không tự nhiên để test TTS.

- [ ] **Step 1: Thay CHAPTER_CONTENT bằng đoạn tiểu thuyết Việt Nam dài hơn**

Thay toàn bộ `CHAPTER_CONTENT` trong `src/data/mockChapters.ts` bằng đoạn văn 5–8 đoạn paragraph thực tế (không lặp), ngắt dòng bằng `\n\n`. Ví dụ nội dung Đấu Phá Thương Khung chương 1 ngắn gọn:

```ts
const CHAPTER_CONTENT = `Trên bầu trời Đấu Khí Đại Lục, đấu khí là nền tảng của tất cả. Người có đấu khí mạnh thì được tôn trọng, kẻ không có đấu khí thì bị khinh thường — đó là quy luật bất di bất dịch của thế giới này.

Tiêu Viêm, mười lăm tuổi, ngồi một mình trên tảng đá lớn ở phía sau Tiêu gia. Ánh mắt hắn nhìn ra khoảng không mênh mông, trong lòng chứa đầy sự thất vọng và cay đắng.

Ba năm trước, hắn còn là một thiên tài được cả tộc kỳ vọng — cấp bậc đấu khí tăng mỗi tháng, ai cũng ca ngợi. Nhưng ba năm sau, hắn chính thức trở thành phế vật — đấu khí không những không tăng mà còn suy giảm, dừng lại mãi ở cấp Đấu Giả bậc ba.

"Tiêu Viêm, ngươi lại ra đây một mình sao?" Một giọng nói quen thuộc vang lên từ phía sau. Đó là Tiêu Ninh, em họ của hắn — cùng tuổi nhưng hiện đã đạt cấp Đấu Giả bậc bảy.

Tiêu Viêm không quay đầu lại. "Ừ. Một mình cho yên tĩnh."

Tiêu Ninh ngập ngừng một chút rồi ngồi xuống cạnh anh. "Đại lão gia nói ngày mai là ngày thử nghiệm đấu khí của các thiếu niên trong tộc. Ngươi... có tham gia không?"

"Tham gia làm gì?" Tiêu Viêm cười nhạt. "Để làm trò cười thêm một lần nữa à?"

Bầu không khí rơi vào im lặng. Gió nhẹ thổi qua, mang theo tiếng lá cây xào xạc. Tiêu Viêm nhìn lên bầu trời đầy sao, lòng chợt nhớ lại lời hứa hẹn năm xưa — hắn sẽ trở thành đấu sư mạnh nhất đại lục.

Có lẽ... lời hứa đó giờ chỉ còn là trò cười.`;
```

Cập nhật hàm `getMockChapters` để mỗi chương dùng `CHAPTER_CONTENT` trực tiếp (không `.repeat(3)`):
```ts
content: CHAPTER_CONTENT + `\n\nHết chương ${i + 1}.`,
```

- [ ] **Step 2: Commit**
```bash
git add src/data/mockChapters.ts
git commit -m "content: replace hardcode placeholder with realistic Vietnamese novel excerpt"
```

---

## Task 2: Thêm tốc độ đọc (speech rate) vào TTS

**Files:**
- Modify: `src/components/reader/ReaderPlayerBar.tsx`
- Modify: `src/components/reader/ReaderSettings.tsx`
- Modify: `src/stores/readerStore.ts`
- Modify: `src/types/reader.ts`

**Mục tiêu:** Cho phép user chọn tốc độ đọc: 0.8x / 1.0x / 1.25x / 1.5x / 2.0x

- [ ] **Step 1: Thêm `speechRate` vào ReaderSettings type**

`src/types/reader.ts` — thêm:
```ts
export type SpeechRate = 0.8 | 1.0 | 1.25 | 1.5 | 2.0;

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  fontSizePx: number;
  speechRate: SpeechRate;  // thêm dòng này
}
```

- [ ] **Step 2: Cập nhật readerStore**

`src/stores/readerStore.ts` — thêm default và setter:
```ts
const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: "medium",
  fontSizePx: 17,
  speechRate: 1.0,  // thêm
};

// Trong interface ReaderStore thêm:
setSpeechRate: (rate: SpeechRate) => Promise<void>;

// Trong create() thêm:
setSpeechRate: async (speechRate) => {
  const settings = { ...get().settings, speechRate };
  await storage.set("readerSettings", settings);
  set({ settings });
},
```

- [ ] **Step 3: Dùng speechRate trong speakAt()**

`src/components/reader/ReaderPlayerBar.tsx`:
- Nhận thêm prop `speechRate: number` (lấy từ `useReaderStore`)
- Truyền vào `Speech.speak`: `rate: speechRate`

```ts
Speech.speak(paragraphs[index], {
  language: "vi-VN",
  volume: volumeRef.current,
  rate: speechRateRef.current,  // thêm
  onDone: ...
});
```

Dùng `speechRateRef` (useRef) tương tự `volumeRef` để tránh stale closure.

- [ ] **Step 4: Thêm speed selector vào ReaderSettings bottom sheet**

`src/components/reader/ReaderSettings.tsx` — thêm section sau font size:

```tsx
const SPEECH_RATES: { value: SpeechRate; label: string }[] = [
  { value: 0.8, label: "0.8x" },
  { value: 1.0, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2.0, label: "2x" },
];

// Trong render:
<Text className="text-sm font-semibold text-gray-600 mb-3">Tốc độ đọc</Text>
<View className="flex-row flex-wrap gap-2 mb-6">
  {SPEECH_RATES.map((r) => (
    <TouchableOpacity
      key={r.value}
      className={`px-4 py-2 rounded-full border ${settings.speechRate === r.value ? "border-primary bg-red-50" : "border-gray-200"}`}
      onPress={() => setSpeechRate(r.value)}
    >
      <Text className={`text-sm font-semibold ${settings.speechRate === r.value ? "text-primary" : "text-gray-600"}`}>
        {r.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

- [ ] **Step 5: Wire speechRate trong reader screen**

`app/reader/[storyId]/[chapterId].tsx` — lấy `settings.speechRate` từ `useReaderStore` và truyền xuống `ReaderPlayerBar` như prop.

- [ ] **Step 6: Commit**
```bash
git add src/types/reader.ts src/stores/readerStore.ts src/components/reader/ReaderPlayerBar.tsx src/components/reader/ReaderSettings.tsx app/reader/[storyId]/[chapterId].tsx
git commit -m "feat: add speech rate control (0.8x–2x) to TTS player"
```

---

## Task 3: Highlight paragraph đang được đọc

**Files:**
- Modify: `app/reader/[storyId]/[chapterId].tsx`
- Modify: `src/components/reader/ReaderPlayerBar.tsx`

**Mục tiêu:** Khi TTS đang đọc paragraph nào, đoạn đó được highlight nhẹ trong ScrollView.

- [ ] **Step 1: Expose `activeParagraphIndex` từ ReaderPlayerBar lên reader screen**

Thay vì giữ `paragraphIndex` hoàn toàn bên trong `ReaderPlayerBar`, thêm callback prop:
```ts
onParagraphChange?: (index: number) => void;
```
Gọi `onParagraphChange(next)` mỗi khi `setParagraphIndex(next)`.

- [ ] **Step 2: Trong reader screen, track `activeParagraphIndex`**

```ts
const [activeParagraphIndex, setActiveParagraphIndex] = useState(-1);
// -1 khi không đang play

// reset khi chapter đổi:
useEffect(() => { setActiveParagraphIndex(-1); }, [chapterId]);
```

- [ ] **Step 3: Render paragraphs riêng lẻ với highlight**

Thay vì render `chapter.content` như một Text duy nhất, map qua `paragraphs` array:

```tsx
{paragraphs.map((p, i) => (
  <Text
    key={i}
    style={{
      color: themeStyle.text,
      fontSize: settings.fontSizePx,
      lineHeight: settings.fontSizePx * 1.8,
      backgroundColor: activeParagraphIndex === i
        ? (settings.theme === "dark" ? "rgba(233,64,87,0.15)" : "rgba(233,64,87,0.08)")
        : "transparent",
      borderRadius: 4,
      marginBottom: settings.fontSizePx * 0.8,
      paddingHorizontal: activeParagraphIndex === i ? 4 : 0,
    }}
    selectable
  >
    {p}
  </Text>
))}
```

- [ ] **Step 4: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add app/reader/[storyId]/[chapterId].tsx src/components/reader/ReaderPlayerBar.tsx
git commit -m "feat: highlight active paragraph during TTS playback"
```

---

## Manual Test Checklist

1. Mở Reader → tap ▶ → TTS bắt đầu đọc đoạn tiểu thuyết thật (không phải placeholder)
2. Paragraph đang đọc có highlight nhẹ màu đỏ
3. Tap ⚙️ → đổi tốc độ 1.5x → TTS đọc nhanh hơn rõ rệt
4. Tap 2.0x → TTS đọc rất nhanh
5. Tap 0.8x → TTS đọc chậm, rõ ràng
6. Dừng TTS → highlight biến mất
7. Chuyển chương → TTS dừng, highlight reset, paragraph index về 0
