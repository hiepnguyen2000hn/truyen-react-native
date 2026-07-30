import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { useStory } from "../../src/hooks/useStory";
import { HistoryItem } from "../../src/services/historyService";
import { c } from "../../src/theme";

function HistoryRow({ item }: { item: HistoryItem }) {
  const { story } = useStory(item.storyId);
  const { colorScheme } = useColorScheme();
  if (!story) return null;
  return (
    <View style={{ marginBottom: 4 }}>
      <StoryCardHorizontal
        story={story}
        onPress={() => router.push(`/reader/${story.id}/${item.chapterNumber}`)}
      />
      <View style={{
        backgroundColor: "rgba(233,64,87,0.12)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: -4,
        marginBottom: 8,
      }}>
        <Text style={{ color: "#E94057", fontSize: 11, fontWeight: "600" }}>
          📖 Đang đọc: Chương {item.chapterNumber}
        </Text>
      </View>
    </View>
  );
}

export default function BookshelfScreen() {
  const [tab, setTab] = useState<"bookmarks" | "history">("bookmarks");
  const { bookmarks, bookmarkedStories, history } = useBookshelfStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const isEmpty = tab === "bookmarks" ? bookmarkedStories.length === 0 : history.length === 0;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c("bg", colorScheme) }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: c("text", colorScheme) }}>
          Tủ Sách
        </Text>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: "row",
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: c("filterChip", colorScheme),
        borderRadius: 12,
        padding: 4,
      }}>
        {(["bookmarks", "history"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: tab === t ? c("card", colorScheme) : "transparent",
            }}
            onPress={() => setTab(t)}
          >
            <Text style={{
              fontWeight: "600",
              fontSize: 13,
              color: tab === t ? c("text", colorScheme) : c("textSub", colorScheme),
            }}>
              {t === "bookmarks" ? `Đã lưu (${bookmarks.length})` : `Đang đọc (${history.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{tab === "bookmarks" ? "📚" : "📖"}</Text>
          <Text style={{ color: c("textSub", colorScheme), fontSize: 15 }}>
            {tab === "bookmarks" ? "Chưa có truyện được lưu" : "Chưa có lịch sử đọc"}
          </Text>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push("/(tabs)/discover")}>
            <Text style={{ color: "#E94057", fontWeight: "600" }}>Khám phá truyện ngay →</Text>
          </TouchableOpacity>
        </View>
      ) : tab === "bookmarks" ? (
        <FlatList
          data={bookmarkedStories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 + insets.bottom }}
          renderItem={({ item }) => (
            <StoryCardHorizontal story={item} onPress={() => router.push(`/story/${item.id}`)} />
          )}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.storyId}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 + insets.bottom }}
          renderItem={({ item }) => <HistoryRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}
