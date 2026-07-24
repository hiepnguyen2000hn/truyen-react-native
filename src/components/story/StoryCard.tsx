import { TouchableOpacity, View, Text, Image } from "react-native";
import { Story } from "../../types/story";
import { formatViewCount } from "../../utils/format";

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export function StoryCard({ story, onPress }: StoryCardProps) {
  return (
    <TouchableOpacity className="flex-1 mb-4" onPress={onPress} activeOpacity={0.8}>
      <View className="relative">
        <Image
          source={{ uri: story.coverUrl }}
          className="w-full rounded-xl bg-gray-100"
          style={{ aspectRatio: 2 / 3 }}
          resizeMode="cover"
          onError={(e) => console.warn("Image load error", e.nativeEvent.error)}
        />
        {story.status === "ongoing" && (
          <View className="absolute top-2 left-2 bg-primary rounded px-1.5 py-0.5">
            <Text className="text-white text-xs font-bold">Đang ra</Text>
          </View>
        )}
      </View>
      <Text className="font-semibold text-gray-900 mt-2 text-sm" numberOfLines={2}>{story.title}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{story.author}</Text>
      <Text className="text-xs text-gray-400 mt-0.5">{formatViewCount(story.viewCount)} lượt đọc</Text>
    </TouchableOpacity>
  );
}
