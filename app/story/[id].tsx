import {
  View, Text, Image, ScrollView, FlatList, TouchableOpacity, Share, Alert, Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useRef } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "../../src/components/ui/Badge";
import { ChapterItem } from "../../src/components/story/ChapterItem";
import { MOCK_STORIES } from "../../src/data/mockStories";
import { getMockChapters } from "../../src/data/mockChapters";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { formatViewCount } from "../../src/utils/format";

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"info" | "chapters">("info");
  const [descExpanded, setDescExpanded] = useState(false);
  const [descTruncated, setDescTruncated] = useState(false);
  const DESC_LINES = 6;
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabBarWidthRef = useRef(0);
  const insets = useSafeAreaInsets();

  const story = MOCK_STORIES.find((s) => s.id === id);
  const chapters = story ? getMockChapters(story.id) : [];

  const lastRead = useBookshelfStore((s) =>
    story ? s.history.find((h) => h.storyId === story.id) : undefined
  );
  const isFavorite = useBookshelfStore((s) =>
    story ? s.bookmarks.includes(story.id) : false
  );
  const addBookmark = useBookshelfStore((s) => s.addBookmark);
  const removeBookmark = useBookshelfStore((s) => s.removeBookmark);

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
    if (chapters.length > 0) router.push(`/reader/${story!.id}/${chapters[0].id}`);
  }

  function handleContinue() {
    if (lastRead) router.push(`/reader/${story!.id}/${lastRead.chapterId}`);
    else handleReadFirst();
  }

  function handleToggleFavorite() {
    if (!story) return;
    if (isFavorite) removeBookmark(story.id);
    else addBookmark(story.id);
  }

  async function handleShare() {
    try {
      await Share.share({ message: `Đọc truyện "${story!.title}" tại ứng dụng Truyện` });
    } catch {}
  }

  function switchTab(tab: "info" | "chapters") {
    if (tab === activeTab) return;
    setActiveTab(tab);
    Animated.spring(indicatorAnim, {
      toValue: tab === "info" ? 0 : tabBarWidthRef.current / 2,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header cố định */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-8 items-start">
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-gray-900 text-lg">Truyện</Text>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => Alert.alert("Báo cáo", "Chức năng đang phát triển")}>
            <Ionicons name="flag-outline" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Phần trên fold: cover + info */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-none">
        <View className="px-4 pt-4 pb-4 flex-row">
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
              {story.genres.map((g) => <Badge key={g.id} genre={g} />)}
            </View>
            <View className="mt-2">
              <View className={`px-2 py-0.5 rounded self-start ${story.status === "ongoing" ? "bg-green-100" : "bg-gray-100"}`}>
                <Text className={`text-xs font-medium ${story.status === "ongoing" ? "text-green-700" : "text-gray-600"}`}>
                  {story.status === "ongoing" ? "Đang ra" : "Hoàn thành"}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500 mt-1">{story.totalChapters} chương</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tab bar cố định */}
      <View
        className="mx-4 border-b border-gray-100"
        onLayout={(e) => { tabBarWidthRef.current = e.nativeEvent.layout.width; }}
      >
        <View className="flex-row">
          {(["info", "chapters"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              className="flex-1 py-3 items-center"
              onPress={() => switchTab(tab)}
              activeOpacity={0.7}
            >
              <Text className={`font-semibold text-sm ${activeTab === tab ? "text-primary" : "text-gray-500"}`}>
                {tab === "info" ? "Giới thiệu" : `Chương (${chapters.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View
          style={{
            position: "absolute", bottom: 0, height: 2,
            width: "50%", backgroundColor: "#E94057", borderRadius: 1,
            transform: [{ translateX: indicatorAnim }],
          }}
        />
      </View>

      {/* Tab content — flex:1, NGOÀI ScrollView chính, mỗi tab scroll độc lập */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ display: activeTab === "info" ? "flex" : "none", flex: 1 }}
          className="px-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="text-gray-700 leading-6"
            numberOfLines={descExpanded ? undefined : DESC_LINES}
            onTextLayout={(e) => {
              if (!descExpanded) setDescTruncated(e.nativeEvent.lines.length >= DESC_LINES);
            }}
          >
            {story.description}
          </Text>
          {descTruncated && (
            <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} className="mt-2 mb-8">
              <Text className="text-primary text-sm">{descExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <FlatList
          style={{ display: activeTab === "chapters" ? "flex" : "none" }}
          data={chapters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChapterItem
              chapter={item}
              onPress={() => router.push(`/reader/${story.id}/${item.id}`)}
              isRead={lastRead ? item.number <= lastRead.chapterNumber : false}
            />
          )}
        />
      </View>

      {/* Bottom navbar */}
      <View
        className="flex-row items-center px-4 border-t border-gray-100 bg-white"
        style={{ paddingTop: 10, paddingBottom: 10 + insets.bottom }}
        accessibilityRole="toolbar"
      >
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 0.5 }}
          className={`items-center justify-center ${isFavorite ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}
          accessibilityLabel="Yêu thích"
          accessibilityState={{ selected: isFavorite }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? "#E94057" : "#888"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReadFirst}
          className="flex-1 mx-3 flex-row items-center justify-center gap-2 bg-primary rounded-full"
          style={{ paddingVertical: 12 }}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={18} color="white" />
          <Text className="text-white font-semibold text-[15px]">
            {lastRead ? `Đọc tiếp Ch.${lastRead.chapterNumber}` : "Đọc truyện"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert("Tải về", "Chức năng đang phát triển")}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 0.5 }}
          className="items-center justify-center bg-gray-50 border-gray-200"
          accessibilityLabel="Tải về"
        >
          <Ionicons name="download-outline" size={22} color="#888" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
