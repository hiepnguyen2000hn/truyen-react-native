import { useRef, memo } from "react";
import { TouchableOpacity, View, Text, Animated, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Story } from "../../types/story";
import { formatViewCount } from "../../utils/format";

interface Props {
  story: Story;
  onPress: () => void;
}

function StoryCardHorizontalComponent({ story, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }),
      Animated.spring(translateX, {
        toValue: 4,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
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
          { transform: [{ scale }, { translateX }] },
        ]}
      >
        {/* Left accent */}
        <View style={styles.leftAccent} />

        <Image
          source={{ uri: story.coverUrl }}
          style={styles.thumb}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        />

        <View style={styles.info}>
          <View>
            <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
            <Text style={styles.author}>{story.author}</Text>

            <View style={styles.tags}>
              {story.genres.slice(0, 2).map((g) => (
                <View key={g.id} style={[styles.tag, { borderColor: g.color + "55", backgroundColor: g.color + "18" }]}>
                  <Text style={[styles.tagText, { color: g.color }]}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={11} color="#f59e0b" />
              <Text style={styles.metaStar}>{story.rating}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="eye-outline" size={11} color="#555" />
              <Text style={styles.metaViews}>{formatViewCount(story.viewCount)}</Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newText}>Ch.{story.totalChapters} mới</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export const StoryCardHorizontal = memo(StoryCardHorizontalComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#131313",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    overflow: "hidden",
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#E94057",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  thumb: {
    width: 68,
    height: 96,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    marginLeft: 4,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  title: {
    color: "#f0f0f0",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  author: {
    color: "#666",
    fontSize: 11,
    marginTop: 3,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 7,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaStar: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: "600",
  },
  metaViews: {
    color: "#555",
    fontSize: 10,
  },
  newBadge: {
    marginLeft: "auto",
    backgroundColor: "rgba(233,64,87,0.15)",
    borderWidth: 1,
    borderColor: "rgba(233,64,87,0.25)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newText: {
    color: "#E94057",
    fontSize: 9,
    fontWeight: "700",
  },
});
