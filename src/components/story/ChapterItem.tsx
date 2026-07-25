import { memo } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "../../types/story";
import { formatDate, formatWordCount } from "../../utils/format";

interface Props {
  chapter: Chapter;
  onPress: () => void;
  isRead?: boolean;
}

function ChapterItemComponent({ chapter, onPress, isRead }: Props) {
  return (
    <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-50" onPress={onPress} activeOpacity={0.7}>
      <View className="flex-1">
        <Text className={`text-sm font-medium ${isRead ? "text-gray-400" : "text-gray-800"}`} numberOfLines={1}>
          {chapter.title}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">{formatWordCount(chapter.wordCount)} · {formatDate(chapter.publishedAt)}</Text>
      </View>
      {isRead && <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 8 }} />}
      <Ionicons name="chevron-forward" size={16} color="#ddd" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export const ChapterItem = memo(ChapterItemComponent);
