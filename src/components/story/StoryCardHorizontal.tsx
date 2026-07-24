import { TouchableOpacity, View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Story } from "../../types/story";
import { Badge } from "../ui/Badge";
import { formatViewCount, formatDate } from "../../utils/format";

interface Props {
  story: Story;
  onPress: () => void;
}

export function StoryCardHorizontal({ story, onPress }: Props) {
  return (
    <TouchableOpacity className="flex-row bg-white rounded-2xl p-3 mb-3 shadow-sm" onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{ uri: story.coverUrl }}
        defaultSource={require("../../assets/placeholder.png")}
        onError={(e) => console.warn("Image load error", e.nativeEvent.error)}
        className="rounded-xl bg-gray-100"
        style={{ width: 80, height: 112 }}
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="font-bold text-gray-900 text-base" numberOfLines={2}>{story.title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{story.author}</Text>
        <View className="flex-row flex-wrap gap-1 mt-2">
          {story.genres.slice(0, 2).map((g) => <Badge key={g.id} genre={g} />)}
        </View>
        <View className="flex-row items-center mt-2 gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text className="text-xs text-gray-600">{story.rating}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="eye" size={12} color="#999" />
            <Text className="text-xs text-gray-500">{formatViewCount(story.viewCount)}</Text>
          </View>
        </View>
        <Text className="text-xs text-gray-400 mt-1">{story.totalChapters} chương · {formatDate(story.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}
