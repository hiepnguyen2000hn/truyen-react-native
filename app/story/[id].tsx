import { View, Text, Image, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { ChapterItem } from "../../src/components/story/ChapterItem";
import { MOCK_STORIES } from "../../src/data/mockStories";
import { getMockChapters } from "../../src/data/mockChapters";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { formatViewCount } from "../../src/utils/format";

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"info" | "chapters">("info");
  const [descExpanded, setDescExpanded] = useState(false);

  const story = MOCK_STORIES.find((s) => s.id === id);
  const chapters = story ? getMockChapters(story.id) : [];

  const addBookmark = useBookshelfStore((s) => s.addBookmark);
  const removeBookmark = useBookshelfStore((s) => s.removeBookmark);
  const bookmarked = useBookshelfStore((s) => (story ? s.bookmarks.includes(story.id) : false));
  const lastRead = useBookshelfStore((s) => (story ? s.history.find((h) => h.storyId === story.id) : undefined));

  if (!story) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="text-gray-500 mt-3 text-base">Không tìm thấy truyện</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function handleReadFirst() {
    if (chapters.length > 0) {
      router.push(`/reader/${story!.id}/${chapters[0].id}`);
    }
  }

  function handleContinue() {
    if (lastRead) {
      router.push(`/reader/${story!.id}/${lastRead.chapterId}`);
    } else {
      handleReadFirst();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="flex-1 font-bold text-gray-900 text-lg" numberOfLines={1}>
          {story.title}
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            bookmarked ? removeBookmark(story.id) : addBookmark(story.id);
          }}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={bookmarked ? "#E94057" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {/* Cover + info */}
      <View className="px-4 pb-4 flex-row">
        <Image
          source={{ uri: story.coverUrl }}
          style={{ width: 120, height: 168, borderRadius: 12 }}
          resizeMode="cover"
        />
        <View className="flex-1 ml-4">
          <Text className="font-bold text-gray-900 text-xl" numberOfLines={2}>
            {story.title}
          </Text>
          <Text className="text-gray-600 mt-1">{story.author}</Text>
          <View className="flex-row items-center mt-2 gap-2">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-sm font-semibold text-gray-700">{story.rating}</Text>
            <Text className="text-gray-300">·</Text>
            <Text className="text-sm text-gray-500">{formatViewCount(story.viewCount)} đọc</Text>
          </View>
          <View className="flex-row flex-wrap gap-1 mt-2">
            {story.genres.map((g) => (
              <Badge key={g.id} genre={g} />
            ))}
          </View>
          <View className="mt-2">
            <View
              className={`px-2 py-0.5 rounded self-start ${
                story.status === "ongoing" ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  story.status === "ongoing" ? "text-green-700" : "text-gray-600"
                }`}
              >
                {story.status === "ongoing" ? "Đang ra" : "Hoàn thành"}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-gray-500 mt-1">{story.totalChapters} chương</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row px-4 gap-3 mb-4">
        <Button
          label={lastRead ? `Đọc tiếp Ch.${lastRead.chapterNumber}` : "Đọc từ đầu"}
          onPress={handleContinue}
          className="flex-1"
        />
        {lastRead && (
          <Button label="Ch.1" onPress={handleReadFirst} variant="outline" className="px-4" />
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100 mx-4">
        {(["info", "chapters"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === tab ? "border-primary" : "border-transparent"
            }`}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className={`font-semibold text-sm ${
                activeTab === tab ? "text-primary" : "text-gray-500"
              }`}
            >
              {tab === "info" ? "Giới thiệu" : `Chương (${chapters.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "info" ? (
        <ScrollView className="flex-1 px-4 pt-4">
          <Text
            className="text-gray-700 leading-6"
            numberOfLines={descExpanded ? undefined : 5}
          >
            {story.description}
          </Text>
          <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} className="mt-2 mb-8">
            <Text className="text-primary text-sm">
              {descExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ChapterItem
              chapter={item}
              onPress={() => router.push(`/reader/${story.id}/${item.id}`)}
              isRead={lastRead ? item.number <= lastRead.chapterNumber : false}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
