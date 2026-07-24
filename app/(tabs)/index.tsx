import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StoryCard } from "../../src/components/story/StoryCard";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { FEATURED_STORIES, TRENDING_STORIES, RECENT_STORIES } from "../../src/data/mockStories";
import { useAuthStore } from "../../src/stores/authStore";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 48;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  function goToStory(id: string) {
    router.push(`/story/${id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <View>
            <Text className="text-gray-500 text-sm">Xin chào 👋</Text>
            <Text className="text-xl font-bold text-gray-900">{user?.displayName ?? "Bạn đọc"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/discover")} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Banner carousel */}
        <View className="mb-6">
          <FlatList
            data={FEATURED_STORIES}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            snapToInterval={BANNER_WIDTH + 12}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ width: BANNER_WIDTH }}
                className="rounded-2xl overflow-hidden"
                onPress={() => goToStory(item.id)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.coverUrl }} style={{ width: BANNER_WIDTH, height: 180 }} resizeMode="cover" />
                <View className="absolute inset-0 bg-black/40 justify-end p-4">
                  <View className="flex-row gap-1 mb-2">
                    {item.genres.slice(0, 2).map((g) => (
                      <View key={g.id} className="bg-white/20 rounded px-2 py-0.5">
                        <Text className="text-white text-xs">{g.name}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-white/80 text-sm">{item.author} · {item.totalChapters} chương</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Trending section */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">🔥 Đang Hot</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
              <Text className="text-primary text-sm">Xem thêm</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TRENDING_STORIES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 4 }}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <StoryCard story={item} onPress={() => goToStory(item.id)} />
              </View>
            )}
          />
        </View>

        {/* Recent updates */}
        <View className="px-4 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">🆕 Mới Cập Nhật</Text>
          </View>
          {RECENT_STORIES.map((story) => (
            <StoryCardHorizontal key={story.id} story={story} onPress={() => goToStory(story.id)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
