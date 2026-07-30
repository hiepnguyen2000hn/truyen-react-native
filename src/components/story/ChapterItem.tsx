import { memo } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Chapter } from "../../types/story";
import { formatDate, formatWordCount } from "../../utils/format";
import { c } from "../../theme";

interface Props {
  chapter: Chapter;
  onPress: () => void;
  isRead?: boolean;
}

function ChapterItemComponent({ chapter, onPress, isRead }: Props) {
  const { colorScheme } = useColorScheme();

  return (
    <TouchableOpacity
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c("divider", colorScheme) }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "500", color: isRead ? c("textMuted", colorScheme) : c("text", colorScheme) }}
          numberOfLines={1}
        >
          {chapter.title}
        </Text>
        <Text style={{ fontSize: 11, color: c("textMuted", colorScheme), marginTop: 2 }}>
          {chapter.wordCount != null ? formatWordCount(chapter.wordCount) + " · " : ""}{formatDate(chapter.publishedAt)}
        </Text>
      </View>
      {isRead && <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 8 }} />}
      <Ionicons name="chevron-forward" size={16} color={c("textMuted", colorScheme)} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export const ChapterItem = memo(ChapterItemComponent);
