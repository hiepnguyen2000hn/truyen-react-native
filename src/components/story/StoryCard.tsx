import { useEffect, useRef } from "react";
import { TouchableOpacity, View, Text, Image, Animated, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Story } from "../../types/story";
import { formatViewCount } from "../../utils/format";

const CARD_WIDTH = (Dimensions.get("window").width - 32 - 16 - 12) / 2;
const GLOW_COLORS = ["#E94057", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16"];

interface StoryCardProps {
  story: Story;
  onPress: () => void;
  rank?: number;
}

export function StoryCard({ story, onPress, rank }: StoryCardProps) {
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
            defaultSource={require("../../../assets/placeholder.png")}
            style={styles.image}
            resizeMode="cover"
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

          {/* Rank badge */}
          {rank && (
            <View style={[styles.rankBadge, { backgroundColor: glowColor + "cc" }]}>
              <Text style={styles.rankText}>{rank}</Text>
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
  rankBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  rankText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
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
