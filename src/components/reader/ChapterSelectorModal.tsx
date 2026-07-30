import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRef, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "../../types/story";

interface Props {
  visible: boolean;
  chapters: Chapter[];
  currentChapterNumber: number;
  onSelect: (chapter: Chapter) => void;
  onClose: () => void;
}

export function ChapterSelectorModal({
  visible,
  chapters,
  currentChapterNumber,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [search, setSearch] = useState("");
  const currentIndex = chapters.findIndex((c) => c.number === currentChapterNumber);

  const filteredChapters = search
    ? chapters.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          String(c.number).includes(search)
      )
    : chapters;

  useEffect(() => {
    if (visible && currentIndex >= 0 && !search) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: currentIndex,
          animated: false,
          viewPosition: 0.3,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, currentIndex, search]);

  function handleClose() {
    setSearch("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Chọn chương ({chapters.length})
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={14} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm chương..."
              placeholderTextColor="#555"
              value={search}
              onChangeText={setSearch}
              keyboardType="default"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#555" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            ref={listRef}
            data={filteredChapters}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: 56,
              offset: 56 * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.index * 56,
                animated: false,
              });
            }}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const isActive = item.number === currentChapterNumber;
              return (
                <TouchableOpacity
                  style={[styles.row, isActive && styles.rowActive]}
                  onPress={() => {
                    setSearch("");
                    onSelect(item);
                  }}
                >
                  <Text
                    style={[styles.rowText, isActive && styles.rowTextActive]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="headset-outline"
                      size={16}
                      color="#E94057"
                    />
                  )}
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
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#252525",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  rowActive: { backgroundColor: "#2a1a1e" },
  rowText: { flex: 1, color: "#aaa", fontSize: 14, marginRight: 8 },
  rowTextActive: { color: "#E94057", fontWeight: "600" },
});
