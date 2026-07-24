import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "../../types/story";

interface Props {
  visible: boolean;
  chapters: Chapter[];
  currentChapterId: string;
  onSelect: (chapter: Chapter) => void;
  onClose: () => void;
}

export function ChapterSelectorModal({ visible, chapters, currentChapterId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn chương</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={chapters}
            keyExtractor={(item) => item.id}
            initialScrollIndex={Math.max(0, currentIndex)}
            getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const isActive = item.id === currentChapterId;
              return (
                <TouchableOpacity
                  style={[styles.row, isActive && styles.rowActive]}
                  onPress={() => onSelect(item)}
                >
                  <Text
                    style={[styles.rowText, isActive && styles.rowTextActive]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {isActive && <Ionicons name="headset-outline" size={16} color="#E94057" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#333",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  row: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2a2a2a",
  },
  rowActive: { backgroundColor: "#2a1a1e" },
  rowText: { flex: 1, color: "#aaa", fontSize: 14, marginRight: 8 },
  rowTextActive: { color: "#E94057", fontWeight: "600" },
});
