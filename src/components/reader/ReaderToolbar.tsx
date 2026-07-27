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
  chapterIndex: number;
  chapterTotal: number;
}

export function ReaderToolbar({
  title, chapterTitle, visible, isDark, onBack, onSettings, chapterIndex, chapterTotal,
}: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const bg = isDark ? "#1f2937" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const subTextColor = isDark ? "#9ca3af" : "#6b7280";
  const iconColor = isDark ? "#e0e0e0" : "#333333";
  const trackColor = isDark ? "#374151" : "#f0f0f0";
  const progress = chapterTotal > 1 ? chapterIndex / (chapterTotal - 1) : 1;

  return (
    <View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        backgroundColor: bg,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2, elevation: 3,
      }}
    >
      {/* Main row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 10 }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: textColor }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: subTextColor, marginTop: 1 }} numberOfLines={1}>
            {chapterTitle}
          </Text>
          <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
            Chương {chapterIndex + 1} / {chapterTotal}
          </Text>
        </View>
        <TouchableOpacity onPress={onSettings} style={{ marginLeft: 12 }}>
          <Ionicons name="settings-outline" size={22} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Chapter progress bar */}
      <View style={{ height: 2, backgroundColor: trackColor, marginHorizontal: -16 }}>
        <View
          style={{
            height: "100%",
            width: `${Math.round(progress * 100)}%` as `${number}%`,
            backgroundColor: "#E94057",
          }}
        />
      </View>
    </View>
  );
}
