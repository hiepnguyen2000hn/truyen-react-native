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
      const matchesQuery =
        query.trim() === "" ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.author.toLowerCase().includes(query.toLowerCase());
      const matchesGenre =
        selectedGenre === null || s.genres.some((g) => g.id === selectedGenre);
      return matchesQuery && matchesGenre;
    });
  }, [query, selectedGenre]);

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
              <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Results list */}
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
