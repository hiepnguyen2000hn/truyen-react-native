import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { useStories } from "../../src/hooks/useStories";
import { c } from "../../src/theme";

type SortOption = "default" | "views" | "rating" | "updated" | "chapters";
type StatusFilter = "all" | "ongoing" | "completed";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "default", label: "Mặc định" },
  { key: "views", label: "Lượt đọc" },
  { key: "rating", label: "Đánh giá" },
  { key: "updated", label: "Mới cập nhật" },
  { key: "chapters", label: "Số chương" },
];

export default function DiscoverScreen() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortVisible, setSortVisible] = useState(false);
  const { stories } = useStories();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  const filtered = useMemo(() => {
    let result = stories.filter((s) => {
      const matchesQuery =
        query.trim() === "" ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.author.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    switch (sortBy) {
      case "views":
        return [...result].sort((a, b) => b.viewCount - a.viewCount);
      case "rating":
        return [...result].sort((a, b) => b.rating - a.rating);
      case "updated":
        return [...result].sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
        );
      case "chapters":
        return [...result].sort((a, b) => b.totalChapters - a.totalChapters);
      default:
        return result;
    }
  }, [query, sortBy, statusFilter]);

  const hasActiveFilters = sortBy !== "default" || statusFilter !== "all";

  function resetFilters() {
    setSortBy("default");
    setStatusFilter("all");
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c("bg", colorScheme) }}
    >
      {/* Header + Search bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: c("text", colorScheme), marginBottom: 16 }}>
          Khám Phá
        </Text>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c("card", colorScheme),
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: c("cardBorder", colorScheme),
        }}>
          <Ionicons name="search" size={18} color={c("textMuted", colorScheme)} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, color: c("text", colorScheme), fontSize: 15 }}
            placeholder="Tìm truyện, tác giả..."
            placeholderTextColor={c("textMuted", colorScheme)}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={c("textMuted", colorScheme)} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort + Status filter bar */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}>
        {(["all", "ongoing", "completed"] as StatusFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: statusFilter === s ? "#E94057" : c("filterChip", colorScheme),
            }}
          >
            <Text style={{
              fontSize: 11,
              color: statusFilter === s ? "#fff" : c("filterChipText", colorScheme),
              fontWeight: "600",
            }}>
              {s === "all" ? "Tất cả" : s === "ongoing" ? "Đang ra" : "Hoàn thành"}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          onPress={() => setSortVisible(true)}
        >
          <Ionicons name="funnel-outline" size={16} color={c("textSub", colorScheme)} />
          <Text style={{ fontSize: 13, color: c("textSub", colorScheme) }}>
            {SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "Sắp xếp"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: c("textSub", colorScheme) }}>
              {filtered.length} kết quả
              {sortBy !== "default" ? ` · ${SORT_OPTIONS.find((o) => o.key === sortBy)?.label}` : ""}
              {statusFilter !== "all" ? ` · ${statusFilter === "ongoing" ? "Đang ra" : "Hoàn thành"}` : ""}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={resetFilters}>
                <Text style={{ fontSize: 12, color: "#E94057", fontWeight: "600" }}>Xoá bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
            <Text style={{ color: c("textSub", colorScheme) }}>Không tìm thấy kết quả</Text>
          </View>
        }
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        renderItem={({ item }) => (
          <StoryCardHorizontal
            story={item}
            onPress={() => router.push(`/story/${item.id}`)}
          />
        )}
      />

      {/* Sort Modal */}
      <Modal
        visible={sortVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setSortVisible(false)}
        >
          <View style={{
            backgroundColor: c("modalBg", colorScheme),
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 20 + insets.bottom,
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 16, color: c("text", colorScheme) }}>
              Sắp xếp theo
            </Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c("divider", colorScheme),
                }}
                onPress={() => {
                  setSortBy(opt.key);
                  setSortVisible(false);
                }}
              >
                <Text style={{ fontSize: 15, color: sortBy === opt.key ? "#E94057" : c("text", colorScheme) }}>
                  {opt.label}
                </Text>
                {sortBy === opt.key && (
                  <Ionicons name="checkmark" size={20} color="#E94057" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
