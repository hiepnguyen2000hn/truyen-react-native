# Plan 04: Category Filter — Fix và Cải thiện

> **Mục tiêu:** Kiểm tra và sửa filter truyện theo thể loại trong Discover screen. Hiện tại filter hoạt động nhưng có vài vấn đề: (1) UI pill filter chiếm 1 dòng ngang — nếu nhiều genre thì không thấy hết; (2) không có "đang lọc" indicator rõ ràng; (3) chưa có sort (mới nhất, nhiều đọc nhất).

**Files liên quan:**
- `app/(tabs)/discover.tsx` — màn discover chính
- `src/data/mockStories.ts` — ALL_GENRES, MOCK_STORIES
- `src/types/story.ts` — Story, Genre types

---

## Task 1: Fix hiển thị genre filter pills

**Vấn đề hiện tại:**
- `FlatList` horizontal với pills không wrap → có thể không thấy genre nếu màn hình nhỏ
- Item "Tất cả" dùng `id: null as unknown as string` — hack không an toàn

**Files:**
- Modify: `app/(tabs)/discover.tsx`

- [ ] **Step 1: Fix type cho "Tất cả" genre item**

Thay vì hack `id: null as unknown as string`, tạo type riêng:

```tsx
type GenreFilter = { id: string | null; name: string; color: string };

const ALL_FILTER: GenreFilter = { id: null, name: "Tất cả", color: "#E94057" };
const GENRE_FILTERS: GenreFilter[] = [ALL_FILTER, ...ALL_GENRES];
```

Cập nhật `selectedGenre` type từ `string | null` → giữ nguyên nhưng logic rõ hơn.

- [ ] **Step 2: Cải thiện visual của genre pills**

Hiện tại pill active chỉ đổi `bg-primary border-primary`. Cải thiện:
- Thêm số lượng truyện sau tên genre: `"Huyền Huyễn (4)"`
- Icon checkmark khi active
- Pill inactive có border nhạt hơn

```tsx
renderItem={({ item }) => {
  const isSelected = item.id === null ? selectedGenre === null : selectedGenre === item.id;
  const count = item.id === null
    ? MOCK_STORIES.length
    : MOCK_STORIES.filter(s => s.genres.some(g => g.id === item.id)).length;

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: isSelected ? "#E94057" : "#e5e7eb",
        backgroundColor: isSelected ? "#E94057" : "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
      onPress={() => setSelectedGenre(item.id)}
    >
      {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
      <Text style={{
        fontSize: 13,
        fontWeight: "600",
        color: isSelected ? "#ffffff" : "#374151",
      }}>
        {item.name} ({count})
      </Text>
    </TouchableOpacity>
  );
}}
```

- [ ] **Step 3: Commit**
```bash
git add app/(tabs)/discover.tsx
git commit -m "fix: improve genre filter pills with count and checkmark indicator"
```

---

## Task 2: Thêm Sort options

**Vấn đề:** Hiện tại không có cách sắp xếp kết quả — luôn theo thứ tự default.

**Files:**
- Modify: `app/(tabs)/discover.tsx`

- [ ] **Step 1: Thêm sort state và options**

```tsx
type SortOption = "default" | "views" | "rating" | "updated" | "chapters";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "default", label: "Mặc định" },
  { key: "views", label: "Lượt đọc" },
  { key: "rating", label: "Đánh giá" },
  { key: "updated", label: "Mới cập nhật" },
  { key: "chapters", label: "Số chương" },
];

const [sortBy, setSortBy] = useState<SortOption>("default");
```

- [ ] **Step 2: Apply sort trong useMemo**

```tsx
const filtered = useMemo(() => {
  let result = MOCK_STORIES.filter((s) => {
    const matchesQuery = query.trim() === "" ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.author.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = selectedGenre === null || s.genres.some((g) => g.id === selectedGenre);
    return matchesQuery && matchesGenre;
  });

  switch (sortBy) {
    case "views": return [...result].sort((a, b) => b.viewCount - a.viewCount);
    case "rating": return [...result].sort((a, b) => b.rating - a.rating);
    case "updated": return [...result].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "chapters": return [...result].sort((a, b) => b.totalChapters - a.totalChapters);
    default: return result;
  }
}, [query, selectedGenre, sortBy]);
```

- [ ] **Step 3: Thêm Sort button + modal/ActionSheet**

Thêm nút "Sắp xếp" bên phải header, khi tap mở bottom sheet chọn sort:

```tsx
// State:
const [sortVisible, setSortVisible] = useState(false);

// Button trong header:
<TouchableOpacity
  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
  onPress={() => setSortVisible(true)}
>
  <Ionicons name="funnel-outline" size={16} color="#666" />
  <Text style={{ fontSize: 13, color: "#666" }}>
    {SORT_OPTIONS.find(o => o.key === sortBy)?.label ?? "Sắp xếp"}
  </Text>
</TouchableOpacity>

// Modal:
<Modal visible={sortVisible} transparent animationType="slide" onRequestClose={() => setSortVisible(false)}>
  <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setSortVisible(false)}>
    <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 16 }}>Sắp xếp theo</Text>
      {SORT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f0f0f0" }}
          onPress={() => { setSortBy(opt.key); setSortVisible(false); }}
        >
          <Text style={{ fontSize: 15, color: sortBy === opt.key ? "#E94057" : "#111" }}>{opt.label}</Text>
          {sortBy === opt.key && <Ionicons name="checkmark" size={20} color="#E94057" />}
        </TouchableOpacity>
      ))}
    </View>
  </Pressable>
</Modal>
```

- [ ] **Step 4: Cập nhật header hiển thị bộ lọc đang active**

Khi có filter genre + sort active, hiện summary: `"Huyền Huyễn · Lượt đọc · 4 kết quả"`

```tsx
// Trong ListHeaderComponent của FlatList kết quả:
<View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
  <Text style={{ fontSize: 13, color: "#6b7280" }}>
    {filtered.length} kết quả
    {selectedGenre !== null ? ` · ${ALL_GENRES.find(g => g.id === selectedGenre)?.name}` : ""}
    {sortBy !== "default" ? ` · ${SORT_OPTIONS.find(o => o.key === sortBy)?.label}` : ""}
  </Text>
  {(selectedGenre !== null || sortBy !== "default") && (
    <TouchableOpacity onPress={() => { setSelectedGenre(null); setSortBy("default"); }}>
      <Text style={{ fontSize: 12, color: "#E94057", fontWeight: "600" }}>Xoá bộ lọc</Text>
    </TouchableOpacity>
  )}
</View>
```

- [ ] **Step 5: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**
```bash
git add app/(tabs)/discover.tsx
git commit -m "feat: add sort options and filter summary to discover screen"
```

---

## Task 3: Thêm filter Status (Đang ra / Hoàn thành)

**Files:**
- Modify: `app/(tabs)/discover.tsx`

- [ ] **Step 1: Thêm status filter**

```tsx
type StatusFilter = "all" | "ongoing" | "completed";
const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
```

Thêm vào filter logic:
```tsx
const matchesStatus = statusFilter === "all" || s.status === statusFilter;
return matchesQuery && matchesGenre && matchesStatus;
```

Thêm 2 toggle button nhỏ bên cạnh sort button:
```tsx
{(["all", "ongoing", "completed"] as StatusFilter[]).map((s) => (
  <TouchableOpacity
    key={s}
    onPress={() => setStatusFilter(s)}
    style={{
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
      backgroundColor: statusFilter === s ? "#E94057" : "#f3f4f6",
    }}
  >
    <Text style={{ fontSize: 11, color: statusFilter === s ? "#fff" : "#666", fontWeight: "600" }}>
      {s === "all" ? "Tất cả" : s === "ongoing" ? "Đang ra" : "Hoàn thành"}
    </Text>
  </TouchableOpacity>
))}
```

- [ ] **Step 2: Commit**
```bash
git add app/(tabs)/discover.tsx
git commit -m "feat: add status filter (ongoing/completed) to discover screen"
```

---

## Manual Test Checklist

1. Khám Phá → chọn "Huyền Huyễn" → chỉ thấy truyện có genre này, count đúng
2. Chọn "Lượt đọc" sort → truyện sắp xếp giảm dần theo viewCount
3. Chọn "Hoàn thành" status → chỉ thấy truyện completed
4. Kết hợp genre + sort + status → filter đúng
5. Tap "Xoá bộ lọc" → reset tất cả về default
6. Search kết hợp với genre filter → hoạt động đúng
7. Empty state hiện khi không có kết quả nào khớp
