import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  title: string;
  chapterTitle: string;
  visible: boolean;
  isDark: boolean;
  onBack: () => void;
  onSettings: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ReaderToolbar({
  title,
  chapterTitle,
  visible,
  isDark,
  onBack,
  onSettings,
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const bg = isDark ? "#1f2937" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const subTextColor = isDark ? "#9ca3af" : "#6b7280";
  const iconColor = isDark ? "#e0e0e0" : "#333333";

  return (
    <>
      {/* Top toolbar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: bg,
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }}
      >
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontWeight: "700", fontSize: 16, color: textColor }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{ fontSize: 12, color: subTextColor }}
            numberOfLines={1}
          >
            {chapterTitle}
          </Text>
        </View>
        <TouchableOpacity onPress={onSettings} style={{ marginLeft: 12 }}>
          <Ionicons name="settings-outline" size={22} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Bottom toolbar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: bg,
          paddingTop: 16,
          paddingBottom: 32,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            opacity: hasPrev ? 1 : 0.3,
          }}
          onPress={onPrevChapter}
          disabled={!hasPrev}
        >
          <Ionicons name="chevron-back" size={18} color={iconColor} />
          <Text style={{ fontSize: 14, color: textColor }}>Chương trước</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            opacity: hasNext ? 1 : 0.3,
          }}
          onPress={onNextChapter}
          disabled={!hasNext}
        >
          <Text style={{ fontSize: 14, color: textColor }}>Chương sau</Text>
          <Ionicons name="chevron-forward" size={18} color={iconColor} />
        </TouchableOpacity>
      </View>
    </>
  );
}
