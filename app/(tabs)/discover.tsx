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
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { MOCK_STORIES, ALL_GENRES } from "../../src/data/mockStories";
import { Genre } from "../../src/types/story";

type GenreFilter = { id: string | null; name: string; color: string };
type SortOption = "default" | "views" | "rating" | "updated" | "chapters";
type StatusFilter = "all" | "ongoing" | "completed";

const ALL_FILTER: GenreFilter = { id: null, name: "Tất cả", color: "#E94057" };
const GENRE_FILTERS: GenreFilter[] = [ALL_FILTER, ...(ALL_GENRES as Genre[])];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "default", label: "Mặc định" },
  { key: "views", label: "Lượt đọc" },
  { key: "rating", label: "Đánh giá" },
  { key: "updated", label: "Mới cập nhật" },
  { key: "chapters", label: "Số chương" },
];

export default function DiscoverScreen() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortVisible, setSortVisible] = useState(false);

  const filtered = useMemo(() => {
    let result = MOCK_STORIES.filter((s) => {
      const matchesQuery =
        query.trim() === "" ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.author.toLowerCase().includes(query.toLowerCase());
      const matchesGenre =
        selectedGenre === null || s.genres.some((g) => g.id === selectedGenre);
      const matchesStatus =
        statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesGenre && matchesStatus;
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
  }, [query, selectedGenre, sortBy, statusFilter]);

  const hasActiveFilters =
    selectedGenre !== null || sortBy !== "default" || statusFilter !== "all";

  function resetFilters() {
    setSelectedGenre(null);
    setSortBy("default");
    setStatusFilter("all");
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header + Search bar */}
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

      {/* Genre filter pills */}
      <FlatList
        data={GENRE_FILTERS}
        keyExtractor={(item) => item.id ?? "all"}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        renderItem={({ item }) => {
          const isSelected =
            item.id === null ? selectedGenre === null : selectedGenre === item.id;
          const count =
            item.id === null
              ? MOCK_STORIES.length
              : MOCK_STORIES.filter((s) =>
                  s.genres.some((g) => g.id === item.id)
                ).length;

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
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isSelected ? "#ffffff" : "#374151",
                }}
              >
                {item.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Sort + Status filter bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 10,
          gap: 8,
        }}
      >
        {/* Status filter */}
        {(["all", "ongoing", "completed"] as StatusFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: statusFilter === s ? "#E94057" : "#f3f4f6",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: statusFilter === s ? "#fff" : "#666",
                fontWeight: "600",
              }}
            >
              {s === "all" ? "Tất cả" : s === "ongoing" ? "Đang ra" : "Hoàn thành"}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ flex: 1 }} />

        {/* Sort button */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          onPress={() => setSortVisible(true)}
        >
          <Ionicons name="funnel-outline" size={16} color="#666" />
          <Text style={{ fontSize: 13, color: "#666" }}>
            {SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "Sắp xếp"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              {filtered.length} kết quả
              {selectedGenre !== null
                ? ` · ${ALL_GENRES.find((g) => g.id === selectedGenre)?.name}`
                : ""}
              {sortBy !== "default"
                ? ` · ${SORT_OPTIONS.find((o) => o.key === sortBy)?.label}`
                : ""}
              {statusFilter !== "all"
                ? ` · ${statusFilter === "ongoing" ? "Đang ra" : "Hoàn thành"}`
                : ""}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={resetFilters}>
                <Text
                  style={{ fontSize: 12, color: "#E94057", fontWeight: "600" }}
                >
                  Xoá bộ lọc
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">🔍</Text>
            <Text className="text-gray-500">Không tìm thấy kết quả</Text>
          </View>
        }
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
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={() => setSortVisible(false)}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
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
                  borderBottomColor: "#f0f0f0",
                }}
                onPress={() => {
                  setSortBy(opt.key);
                  setSortVisible(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: sortBy === opt.key ? "#E94057" : "#111",
                  }}
                >
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
