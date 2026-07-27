import {
  View,
  Text,
  ScrollView,
  StatusBar,
  PanResponder,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { ReaderToolbar } from "../../../src/components/reader/ReaderToolbar";
import { ReaderSettings } from "../../../src/components/reader/ReaderSettings";
import { ReaderPlayerBar } from "../../../src/components/reader/ReaderPlayerBar";
import { ChapterSelectorModal } from "../../../src/components/reader/ChapterSelectorModal";
import { getMockChapters } from "../../../src/data/mockChapters";
import { useReaderStore } from "../../../src/stores/readerStore";
import { useBookshelfStore } from "../../../src/stores/bookshelfStore";
import { useStories } from "../../../src/hooks/useStories";
import { useChapter } from "../../../src/hooks/useChapter";
import { Chapter } from "../../../src/types/story";

const THEME_STYLES = {
  light: { bg: "#fdf6e3", text: "#2c2c2c", statusBar: "dark-content" as const },
  dark:  { bg: "#1a1a1a", text: "#e0e0e0", statusBar: "light-content" as const },
  sepia: { bg: "#f4ecd8", text: "#4a3728", statusBar: "dark-content" as const },
};

const SWIPE_THRESHOLD = 60;

const ParagraphText = memo(function ParagraphText({
  text, color, fontSize, lineHeight, isActive, dimmed,
}: {
  text: string; color: string; fontSize: number; lineHeight: number; isActive?: boolean; dimmed?: boolean;
}) {
  return (
    <View style={{ marginBottom: fontSize * 0.8, opacity: dimmed ? 0.38 : 1 }}>
      <Text
        style={{
          color: isActive ? "#E94057" : color,
          fontSize,
          lineHeight,
          fontWeight: isActive ? "600" : "400",
        }}
        selectable
      >
        {text}
      </Text>
    </View>
  );
});

export default function ReaderScreen() {
  const { storyId, chapterId: initialChapterId } = useLocalSearchParams<{
    storyId: string;
    chapterId: string;
  }>();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chapterSelectorVisible, setChapterSelectorVisible] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [swipeHint, setSwipeHint] = useState<"left" | "right" | null>(null);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const paragraphYRefs = useRef<Record<number, number>>({});

  const contentOpacity = useSharedValue(1);
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const { settings } = useReaderStore();
  const { addToHistory } = useBookshelfStore();
  const { stories } = useStories();
  const { chapter } = useChapter(storyId, currentChapterId);

  const story = stories.find((s) => s.id === storyId);
  const chapters = story ? getMockChapters(story.id) : [];
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);

  const paragraphs = useMemo(
    () => chapter?.content.split(/\n\n+/).filter((p) => p.trim().length > 0) ?? [],
    [chapter?.content]
  );

  const themeStyle = THEME_STYLES[settings.theme];

  useEffect(() => {
    if (story && chapter) {
      addToHistory(story.id, chapter.id, chapter.number);
    }
    setActiveParagraph(null);
    paragraphYRefs.current = {};
  }, [currentChapterId]);

  useEffect(() => {
    if (activeParagraph === null || activeParagraph === 0) return;
    const y = paragraphYRefs.current[activeParagraph];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
    }
  }, [activeParagraph]);

  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function applyChapterChange(index: number) {
    setCurrentChapterId(chapters[index].id);
    scrollToTop();
    router.setParams({ chapterId: chapters[index].id });
  }

  function goToChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;
    contentOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(applyChapterChange)(index);
      contentOpacity.value = withTiming(1, { duration: 200 });
    });
  }

  function handleChapterSelect(c: Chapter) {
    setChapterSelectorVisible(false);
    const idx = chapters.findIndex((ch) => ch.id === c.id);
    if (idx !== -1 && idx !== currentIndex) {
      goToChapter(idx);
    }
  }

  const handleParagraphChange = useCallback((index: number) => {
    setActiveParagraph(index);
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    if (!playing) setActiveParagraph(null);
  }, []);

  const currentIndexRef = useRef(currentIndex);
  const chaptersLengthRef = useRef(chapters.length);
  const goToChapterRef = useRef(goToChapter);
  currentIndexRef.current = currentIndex;
  chaptersLengthRef.current = chapters.length;
  goToChapterRef.current = goToChapter;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 20 && currentIndexRef.current > 0) {
          setSwipeHint("right");
        } else if (gestureState.dx < -20 && currentIndexRef.current < chaptersLengthRef.current - 1) {
          setSwipeHint("left");
        } else {
          setSwipeHint(null);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setSwipeHint(null);
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          goToChapterRef.current(currentIndexRef.current + 1);
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          goToChapterRef.current(currentIndexRef.current - 1);
        }
      },
      onPanResponderTerminate: () => setSwipeHint(null),
    })
  ).current;

  if (!story || !chapter) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Không tìm thấy chương</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeStyle.bg }}>
      <StatusBar barStyle={themeStyle.statusBar} backgroundColor={themeStyle.bg} />

      <ReaderToolbar
        title={story.title}
        chapterTitle={chapter.title}
        isDark={settings.theme === "dark"}
        onBack={() => router.back()}
        onSettings={() => setSettingsVisible(true)}
        chapterIndex={currentIndex}
        chapterTotal={chapters.length}
      />

      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Animated.View style={[{ flex: 1 }, contentStyle]}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 100,
              paddingBottom: 200,
            }}
            showsVerticalScrollIndicator={false}
          >
            <ParagraphText
              text={chapter.title}
              color={themeStyle.text}
              fontSize={settings.fontSizePx + 2}
              lineHeight={(settings.fontSizePx + 2) * 1.8}
            />
            {paragraphs.map((p, i) => (
              <View
                key={i}
                onLayout={(e) => {
                  paragraphYRefs.current[i] = e.nativeEvent.layout.y;
                }}
              >
                <ParagraphText
                  text={p}
                  color={themeStyle.text}
                  fontSize={settings.fontSizePx}
                  lineHeight={settings.fontSizePx * 1.8}
                  isActive={activeParagraph === i}
                  dimmed={activeParagraph !== null && activeParagraph !== i}
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {swipeHint === "right" && (
          <View
            style={{
              position: "absolute", left: 0, top: "50%", marginTop: -24,
              padding: 8, backgroundColor: "rgba(0,0,0,0.2)",
              borderTopRightRadius: 12, borderBottomRightRadius: 12,
            }}
          >
            <Text style={{ fontSize: 20, color: "#fff" }}>‹</Text>
          </View>
        )}
        {swipeHint === "left" && (
          <View
            style={{
              position: "absolute", right: 0, top: "50%", marginTop: -24,
              padding: 8, backgroundColor: "rgba(0,0,0,0.2)",
              borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
            }}
          >
            <Text style={{ fontSize: 20, color: "#fff" }}>›</Text>
          </View>
        )}
      </View>

      <ReaderPlayerBar
        storyTitle={story.title}
        chapterTitle={chapter.title}
        paragraphs={paragraphs}
        onPrevChapter={() => goToChapter(currentIndex - 1)}
        onNextChapter={() => goToChapter(currentIndex + 1)}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < chapters.length - 1}
        onChapterSelect={() => setChapterSelectorVisible(true)}
        onSettings={() => setSettingsVisible(true)}
        onParagraphChange={handleParagraphChange}
        onPlayStateChange={handlePlayStateChange}
      />

      <ReaderSettings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      <ChapterSelectorModal
        visible={chapterSelectorVisible}
        chapters={chapters}
        currentChapterId={currentChapterId}
        onSelect={handleChapterSelect}
        onClose={() => setChapterSelectorVisible(false)}
      />
    </View>
  );
}
