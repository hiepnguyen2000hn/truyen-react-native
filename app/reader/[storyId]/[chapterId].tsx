import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { ReaderToolbar } from "../../../src/components/reader/ReaderToolbar";
import { ReaderSettings } from "../../../src/components/reader/ReaderSettings";
import { MOCK_STORIES } from "../../../src/data/mockStories";
import { getMockChapters } from "../../../src/data/mockChapters";
import { useReaderStore } from "../../../src/stores/readerStore";
import { useBookshelfStore } from "../../../src/stores/bookshelfStore";

const THEME_STYLES = {
  light: {
    bg: "#fdf6e3",
    text: "#2c2c2c",
    statusBar: "dark-content" as const,
  },
  dark: {
    bg: "#1a1a1a",
    text: "#e0e0e0",
    statusBar: "light-content" as const,
  },
  sepia: {
    bg: "#f4ecd8",
    text: "#4a3728",
    statusBar: "dark-content" as const,
  },
};

export default function ReaderScreen() {
  const { storyId, chapterId } = useLocalSearchParams<{
    storyId: string;
    chapterId: string;
  }>();
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings } = useReaderStore();
  const { addToHistory } = useBookshelfStore();

  const story = MOCK_STORIES.find((s) => s.id === storyId);
  const chapters = story ? getMockChapters(story.id) : [];
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const chapter = chapters[currentIndex];

  const themeStyle = THEME_STYLES[settings.theme];

  useEffect(() => {
    if (story && chapter) {
      addToHistory(story.id, chapter.id, chapter.number);
    }
    autoHideToolbar();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [chapterId]);

  function autoHideToolbar() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
  }

  function toggleToolbar() {
    const next = !toolbarVisible;
    setToolbarVisible(next);
    if (next) autoHideToolbar();
  }

  function goToChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;
    router.replace(`/reader/${storyId}/${chapters[index].id}`);
  }

  if (!story || !chapter) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Không tìm thấy chương</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeStyle.bg }}>
      <StatusBar
        barStyle={themeStyle.statusBar}
        backgroundColor={themeStyle.bg}
      />

      <ReaderToolbar
        title={story.title}
        chapterTitle={chapter.title}
        visible={toolbarVisible}
        isDark={settings.theme === "dark"}
        onBack={() => router.back()}
        onSettings={() => {
          setSettingsVisible(true);
          setToolbarVisible(false);
        }}
        onPrevChapter={() => goToChapter(currentIndex - 1)}
        onNextChapter={() => goToChapter(currentIndex + 1)}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < chapters.length - 1}
      />

      <TouchableWithoutFeedback onPress={toggleToolbar}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 100,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              color: themeStyle.text,
              fontSize: settings.fontSizePx,
              lineHeight: settings.fontSizePx * 1.8,
            }}
            selectable
          >
            {chapter.title}
            {"\n\n"}
            {chapter.content}
          </Text>

          {currentIndex < chapters.length - 1 && (
            <View
              style={{
                marginTop: 48,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => goToChapter(currentIndex + 1)}
                style={{
                  backgroundColor: "#E94057",
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 24,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Đọc chương tiếp →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      <ReaderSettings
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}
