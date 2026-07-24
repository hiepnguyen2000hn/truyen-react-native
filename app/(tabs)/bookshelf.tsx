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
