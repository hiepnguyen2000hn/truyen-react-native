import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useReaderStore } from "../../stores/readerStore";
import { ReaderTheme, FontSize } from "../../types/reader";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const THEMES: { key: ReaderTheme; label: string; bg: string; text: string }[] =
  [
    { key: "light", label: "Sáng", bg: "#fdf6e3", text: "#2c2c2c" },
    { key: "dark", label: "Tối", bg: "#1a1a1a", text: "#e0e0e0" },
    { key: "sepia", label: "Sepia", bg: "#f4ecd8", text: "#4a3728" },
  ];

const FONT_SIZES: { key: FontSize; label: string; px: number }[] = [
  { key: "small", label: "Nhỏ", px: 15 },
  { key: "medium", label: "Vừa", px: 17 },
  { key: "large", label: "Lớn", px: 20 },
];

export function ReaderSettings({ visible, onClose }: Props) {
  const { settings, setTheme, setFontSize } = useReaderStore();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
          onPress={() => {}}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Cài đặt đọc
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#4b5563",
              marginBottom: 12,
            }}
          >
            Màu nền
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: t.bg,
                  borderWidth: 2,
                  borderColor:
                    settings.theme === t.key ? "#E94057" : "transparent",
                }}
                onPress={() => setTheme(t.key)}
              >
                <Text style={{ color: t.text, fontWeight: "600" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#4b5563",
              marginBottom: 12,
            }}
          >
            Cỡ chữ
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {FONT_SIZES.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor:
                    settings.fontSize === f.key ? "#E94057" : "#e5e7eb",
                  backgroundColor:
                    settings.fontSize === f.key ? "#fef2f2" : "transparent",
                }}
                onPress={() => setFontSize(f.key)}
              >
                <Text
                  style={{
                    fontSize: f.px,
                    color:
                      settings.fontSize === f.key ? "#E94057" : "#6b7280",
                    fontWeight: "600",
                  }}
                >
                  A
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color:
                      settings.fontSize === f.key ? "#E94057" : "#6b7280",
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
