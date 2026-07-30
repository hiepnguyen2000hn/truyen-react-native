import {
  View, Text, Image, ScrollView, FlatList, TouchableOpacity, Share, Alert, Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useRef } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Badge } from "../../src/components/ui/Badge";
import { ChapterItem } from "../../src/components/story/ChapterItem";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { useStory } from "../../src/hooks/useStory";
import { useChapterList } from "../../src/hooks/useChapterList";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { formatViewCount } from "../../src/utils/format";
import { c } from "../../src/theme";

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"info" | "chapters">("info");
  const [descExpanded, setDescExpanded] = useState(false);
  const [descTruncated, setDescTruncated] = useState(false);
  const DESC_LINES = 6;
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabBarWidthRef = useRef(0);
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const { story, loading: storyLoading } = useStory(id);
  const { chapters } = useChapterList(id);

  const lastRead = useBookshelfStore((s) =>
    story ? s.history.find((h) => h.storyId === story.id) : undefined
  );
  const isFavorite = useBookshelfStore((s) =>
    story ? s.bookmarks.includes(story.id) : false
  );
  const addBookmark = useBookshelfStore((s) => s.addBookmark);
  const removeBookmark = useBookshelfStore((s) => s.removeBookmark);

  if (storyLoading && !story) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c("bg", colorScheme) }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c("bg", colorScheme) }}>
        <Ionicons name="alert-circle-outline" size={48} color={c("textMuted", colorScheme)} />
        <Text style={{ color: c("textSub", colorScheme), marginTop: 12, fontSize: 16 }}>Không tìm thấy truyện</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text className="text-primary font-semibold">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function handleReadFirst() {
    if (chapters.length > 0) router.push(`/reader/${story!.id}/${chapters[0].number}`);
  }

  function handleContinue() {
    if (lastRead) router.push(`/reader/${story!.id}/${lastRead.chapterNumber}`);
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

  const statusBg = story.status === "ongoing"
    ? (colorScheme === "dark" ? "rgba(16,185,129,0.15)" : "#dcfce7")
    : c("filterChip", colorScheme);
  const statusText = story.status === "ongoing" ? "#10b981" : c("textSub", colorScheme);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c("bg", colorScheme) }} edges={["top"]}>
      {/* Header cố định */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c("divider", colorScheme) }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 32, alignItems: "flex-start" }}>
          <Ionicons name="close" size={24} color={c("text", colorScheme)} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 18, color: c("text", colorScheme) }}>Truyện</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={() => Alert.alert("Báo cáo", "Chức năng đang phát triển")}>
            <Ionicons name="flag-outline" size={22} color={c("text", colorScheme)} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={c("text", colorScheme)} />
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
            <Text style={{ fontWeight: "bold", fontSize: 20, color: c("text", colorScheme) }} numberOfLines={2}>
              {story.title}
            </Text>
            <Text style={{ color: c("textSub", colorScheme), marginTop: 4 }}>{story.author}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: c("text", colorScheme) }}>{story.rating}</Text>
              <Text style={{ color: c("textMuted", colorScheme) }}>·</Text>
              <Text style={{ fontSize: 13, color: c("textSub", colorScheme) }}>{formatViewCount(story.viewCount)} đọc</Text>
            </View>
            <View className="flex-row flex-wrap gap-1 mt-2">
              {story.genres.map((g) => <Badge key={g.id} genre={g} />)}
            </View>
            <View className="mt-2">
              <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 11, fontWeight: "500", color: statusText }}>
                  {story.status === "ongoing" ? "Đang ra" : "Hoàn thành"}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: c("textSub", colorScheme), marginTop: 4 }}>{story.totalChapters} chương</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tab bar cố định */}
      <View
        style={{ marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c("divider", colorScheme) }}
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
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 13,
                  color: activeTab === tab ? "#E94057" : c("textSub", colorScheme),
                }}
              >
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
            style={{ color: c("textSub", colorScheme), lineHeight: 22 }}
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
              onPress={() => router.push(`/reader/${story.id}/${item.number}`)}
              isRead={lastRead ? item.number <= lastRead.chapterNumber : false}
            />
          )}
        />
      </View>

      {/* Bottom navbar */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
          borderTopWidth: 1, borderTopColor: c("divider", colorScheme), backgroundColor: c("tabBar", colorScheme),
          paddingTop: 10, paddingBottom: 10 + insets.bottom,
        }}
        accessibilityRole="toolbar"
      >
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={{
            width: 44, height: 44, borderRadius: 22, borderWidth: 0.5, alignItems: "center", justifyContent: "center",
            backgroundColor: isFavorite ? (colorScheme === "dark" ? "rgba(233,64,87,0.15)" : "#fef2f2") : c("filterChip", colorScheme),
            borderColor: isFavorite ? "#E94057" : c("cardBorder", colorScheme),
          }}
          accessibilityLabel="Yêu thích"
          accessibilityState={{ selected: isFavorite }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? "#E94057" : c("textSub", colorScheme)}
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
          style={{
            width: 44, height: 44, borderRadius: 22, borderWidth: 0.5, alignItems: "center", justifyContent: "center",
            backgroundColor: c("filterChip", colorScheme), borderColor: c("cardBorder", colorScheme),
          }}
          accessibilityLabel="Tải về"
        >
          <Ionicons name="download-outline" size={22} color={c("textSub", colorScheme)} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
