import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ImageBackground,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useState, useCallback } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StoryCard } from "../../src/components/story/StoryCard";
import { StoryCardHorizontal } from "../../src/components/story/StoryCardHorizontal";
import { FEATURED_STORIES, TRENDING_STORIES, RECENT_STORIES } from "../../src/data/mockStories";
import { useAuthStore } from "../../src/stores/authStore";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 32;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng ☀️";
  if (hour < 18) return "Chào buổi chiều 🌤️";
  return "Chào buổi tối 🌙";
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  function goToStory(id: string) {
    router.push(`/story/${id}`);
  }

  const headerCover = FEATURED_STORIES[0]?.coverUrl;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E94057" />
        }
      >
        {/* ── Cinematic header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          {/* Background image */}
          {headerCover && (
            <ImageBackground
              source={{ uri: headerCover }}
              style={StyleSheet.absoluteFill}
              imageStyle={{ opacity: 0.2 }}
              resizeMode="cover"
            />
          )}
          {/* Gradient overlay */}
          <LinearGradient
            colors={["rgba(233,64,87,0.18)", "transparent", "#0d0d0d"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.headerContent}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <Text style={{ fontSize: 16 }}>📖</Text>
              </View>
              <Text style={styles.brandName}>
                Đọc<Text style={styles.brandAccent}>Truyện</Text>
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push("/(tabs)/discover")}
              >
                <Ionicons name="search-outline" size={17} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting row */}
          <View style={styles.greetingRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.displayName ?? "B")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTime}>{getGreeting()}</Text>
              <Text style={styles.greetingName}>
                {user?.displayName ?? "Bạn đọc"} ơi, đọc gì hôm nay?
              </Text>
            </View>
            <View style={styles.streak}>
              <Text style={styles.streakNum}>🔥7</Text>
              <Text style={styles.streakLbl}>ngày</Text>
            </View>
          </View>
        </View>

        {/* ── Banner carousel ── */}
        <View style={styles.bannerSection}>
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
                style={{ width: BANNER_WIDTH, borderRadius: 16, overflow: "hidden" }}
                onPress={() => goToStory(item.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.coverUrl }}
                  style={{ width: BANNER_WIDTH, height: 185 }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.93)"]}
                  style={[StyleSheet.absoluteFill, { justifyContent: "flex-end", padding: 14 }]}
                  start={{ x: 0, y: 0.3 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={styles.bannerTags}>
                    {item.genres.slice(0, 2).map((g) => (
                      <View key={g.id} style={styles.bannerTag}>
                        <Text style={styles.bannerTagText}>{g.name}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.bannerSub}>{item.author} · {item.totalChapters} chương</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* ── Đang Hot ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Đang Hot</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
              <Text style={styles.sectionMore}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TRENDING_STORIES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item, index }) => (
              <View style={{ flex: 1 }}>
                <StoryCard story={item} onPress={() => goToStory(item.id)} rank={index + 1} />
              </View>
            )}
          />
        </View>

        {/* ── Mới Cập Nhật ── */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🆕 Mới Cập Nhật</Text>
          </View>
          {RECENT_STORIES.map((story) => (
            <StoryCardHorizontal key={story.id} story={story} onPress={() => goToStory(story.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  /* Header */
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E94057",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  brandAccent: {
    color: "#E94057",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E94057",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  greetingTime: {
    color: "#888",
    fontSize: 11,
    marginBottom: 2,
  },
  greetingName: {
    color: "#f0f0f0",
    fontSize: 13,
    fontWeight: "600",
  },
  streak: {
    alignItems: "center",
    marginLeft: "auto",
  },
  streakNum: {
    color: "#f59e0b",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  streakLbl: {
    color: "#666",
    fontSize: 9,
  },
  /* Banner */
  bannerSection: {
    marginBottom: 24,
    marginTop: 4,
  },
  bannerTags: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 6,
  },
  bannerTag: {
    backgroundColor: "rgba(233,64,87,0.85)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bannerTagText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
  },
  /* Sections */
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionMore: {
    color: "#E94057",
    fontSize: 12,
    fontWeight: "600",
  },
});
