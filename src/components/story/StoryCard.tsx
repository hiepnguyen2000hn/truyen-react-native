import { useEffect, useRef, memo } from "react";
import { TouchableOpacity, View, Text, Animated, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Story } from "../../types/story";
import { formatViewCount } from "../../utils/format";

const CARD_WIDTH = (Dimensions.get("window").width - 32 - 16 - 12) / 2;
const GLOW_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#84cc16"];

const RANK_CONFIG = [
  {
    emoji: "👑",
    gradient: ["rgba(255,215,0,0.85)", "rgba(160,110,0,0.9)"] as const,
    border: "#FFD700",
    label: "#FFD700",
  },
  {
    emoji: "💎",
    gradient: ["rgba(200,220,240,0.85)", "rgba(120,150,180,0.9)"] as const,
    border: "#A8C8E8",
    label: "#C8E0F4",
  },
  {
    emoji: "🌟",
    gradient: ["rgba(205,127,50,0.85)", "rgba(120,65,15,0.9)"] as const,
    border: "#CD7F32",
    label: "#E8A060",
  },
];

interface StoryCardProps {
  story: Story;
  onPress: () => void;
  rank?: number;
}

function StoryCardComponent({ story, onPress, rank }: StoryCardProps) {
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowColor = rank ? GLOW_COLORS[(rank - 1) % GLOW_COLORS.length] : undefined;

  useEffect(() => {
    if (!rank) return;
    const timer = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(shimmerX, { toValue: -1, duration: 0, useNativeDriver: true }),
          Animated.delay(2800),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, (rank - 1) * 450);
    return () => clearTimeout(timer);
  }, []);

  const translateX = shimmerX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-CARD_WIDTH * 1.5, CARD_WIDTH * 2.5],
  });

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale }] },
          glowColor && {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.55,
            shadowRadius: 14,
            elevation: 10,
            borderColor: glowColor + "55",
            borderWidth: 1,
          },
        ]}
      >
        {/* Cover image */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: story.coverUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          />

          {/* Bottom gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Shimmer sweep */}
          {rank && (
            <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX }, { skewX: "-18deg" }] },
                ]}
              />
            </View>
          )}

          {/* Rank badge – top 3 only */}
          {rank && rank <= 3 && (
            <View style={[styles.premiumBadgeWrap, { borderColor: RANK_CONFIG[rank - 1].border + "90" }]}>
              <LinearGradient
                colors={RANK_CONFIG[rank - 1].gradient}
                style={styles.premiumBadgeGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <Text style={styles.premiumEmoji}>{RANK_CONFIG[rank - 1].emoji}</Text>
              </LinearGradient>
            </View>
          )}

          {/* Ongoing badge */}
          {story.status === "ongoing" && (
            <View style={styles.ongoingBadge}>
              <Text style={styles.ongoingText}>Đang ra</Text>
            </View>
          )}

          {/* Title + views inside card */}
          {rank && (
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{story.title}</Text>
              <Text style={[styles.cardViews, { color: glowColor }]}>
                {formatViewCount(story.viewCount)} lượt đọc
              </Text>
            </View>
          )}
        </View>

        {/* Below-image info (when no rank) */}
        {!rank && (
          <View style={styles.belowInfo}>
            <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
            <Text style={styles.author}>{story.author}</Text>
            <Text style={styles.views}>{formatViewCount(story.viewCount)} lượt đọc</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export const StoryCard = memo(StoryCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: "#161616",
    overflow: "visible",
  },
  imageWrap: {
    borderRadius: 14,
    overflow: "hidden",
    aspectRatio: 2 / 3,
    backgroundColor: "#1e1e1e",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 55,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  premiumBadgeWrap: {
    position: "absolute",
    top: 7,
    right: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  premiumBadgeGrad: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: "center",
    gap: 1,
  },
  premiumEmoji: {
    fontSize: 16,
    lineHeight: 18,
  },
  ongoingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E94057",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ongoingText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 9,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginBottom: 3,
  },
  cardViews: {
    fontSize: 9,
    fontWeight: "700",
  },
  belowInfo: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  title: {
    fontWeight: "600",
    color: "#f0f0f0",
    fontSize: 13,
    marginBottom: 2,
  },
  author: {
    fontSize: 11,
    color: "#666",
    marginBottom: 1,
  },
  views: {
    fontSize: 10,
    color: "#555",
  },
});
