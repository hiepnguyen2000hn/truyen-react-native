import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  storyTitle: string;
  chapterTitle: string;
  paragraphs: string[];
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onChapterSelect: () => void;
  onSettings: () => void;
  onParagraphChange?: (index: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export function ReaderPlayerBar({
  storyTitle,
  chapterTitle,
  paragraphs,
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
  onChapterSelect,
  onSettings,
  onParagraphChange,
  onPlayStateChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [volumeVisible, setVolumeVisible] = useState(false);

  const indexRef = useRef(0);
  const playingRef = useRef(false);
  const volumeRef = useRef(0.8);
  const progressTrackWidthRef = useRef(0);
  const TRACK_HEIGHT = 90;

  useEffect(() => {
    indexRef.current = paragraphIndex;
  }, [paragraphIndex]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Dừng audio khi out khỏi màn chapter
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  // Reset khi đổi chương
  useEffect(() => {
    playingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
    setParagraphIndex(0);
    indexRef.current = 0;
    onPlayStateChange?.(false);
  }, [paragraphs]);

  function speakAt(index: number) {
    if (index < 0 || index >= paragraphs.length) return;
    Speech.stop();
    Speech.speak(paragraphs[index], {
      language: "vi-VN",
      volume: volumeRef.current,
      onDone: () => {
        if (!playingRef.current) return;
        const next = indexRef.current + 1;
        if (next < paragraphs.length) {
          setParagraphIndex(next);
          indexRef.current = next;
          onParagraphChange?.(next);
          speakAt(next);
        } else {
          setIsPlaying(false);
          playingRef.current = false;
          onPlayStateChange?.(false);
        }
      },
    });
  }

  function handlePlayPause() {
    if (isPlaying) {
      playingRef.current = false;
      Speech.stop();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      playingRef.current = true;
      setIsPlaying(true);
      onPlayStateChange?.(true);
      onParagraphChange?.(paragraphIndex);
      speakAt(paragraphIndex);
    }
  }


  function seekTo(index: number) {
    const clamped = Math.max(0, Math.min(paragraphs.length - 1, index));
    setParagraphIndex(clamped);
    indexRef.current = clamped;
    onParagraphChange?.(clamped);
    if (playingRef.current) {
      Speech.stop();
      speakAt(clamped);
    }
  }

  function handleProgressTouch(e: GestureResponderEvent) {
    const width = progressTrackWidthRef.current;
    if (!width || paragraphs.length <= 1) return;
    const x = Math.max(0, Math.min(width, e.nativeEvent.locationX));
    const newIndex = Math.round((x / width) * (paragraphs.length - 1));
    seekTo(newIndex);
  }

  function handlePrevChapter() {
    playingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
    onPlayStateChange?.(false);
    onPrevChapter();
  }

  function handleNextChapter() {
    playingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
    onPlayStateChange?.(false);
    onNextChapter();
  }

  function handleVolumeTouch(e: GestureResponderEvent) {
    const y = Math.max(0, Math.min(TRACK_HEIGHT, e.nativeEvent.locationY));
    const newVol = parseFloat((1 - y / TRACK_HEIGHT).toFixed(2));
    setVolume(newVol);
    volumeRef.current = newVol;
    if (isPlaying) {
      playingRef.current = false;
      Speech.stop();
      playingRef.current = true;
      speakAt(indexRef.current);
    }
  }

  const progress = paragraphs.length > 1 ? paragraphIndex / (paragraphs.length - 1) : 0;
  const volPct = Math.round(volume * 100);
  const volIcon: keyof typeof Ionicons.glyphMap =
    volume === 0 ? "volume-mute" : volume < 0.4 ? "volume-low" : "volume-high";

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.meta}>
        <Text style={styles.storyTitle} numberOfLines={1}>{storyTitle}</Text>
        <TouchableOpacity style={styles.chapterRow} onPress={onChapterSelect} activeOpacity={0.7}>
          <Text style={styles.chapterTitle} numberOfLines={1}>{chapterTitle}</Text>
          <Ionicons name="chevron-up" size={14} color="#888" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <View
        style={styles.progressTouchArea}
        onLayout={(e) => { progressTrackWidthRef.current = e.nativeEvent.layout.width; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleProgressTouch}
        onResponderMove={handleProgressTouch}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
        </View>
        <View style={[styles.progressThumb, { left: `${Math.round(progress * 100)}%` as `${number}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        Đ.{paragraphIndex + 1} / {paragraphs.length || 1}
      </Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={onSettings}>
          <Ionicons name="settings-outline" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, !hasPrev && styles.ctrlDisabled]}
          onPress={handlePrevChapter}
          disabled={!hasPrev}
        >
          <Ionicons name="play-skip-back" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={26}
            color="#fff"
            style={isPlaying ? undefined : { marginLeft: 3 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, !hasNext && styles.ctrlDisabled]}
          onPress={handleNextChapter}
          disabled={!hasNext}
        >
          <Ionicons name="play-skip-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.volWrap}>
          {volumeVisible && (
            <View style={styles.volPopup}>
              <Ionicons name={volIcon} size={16} color="#fff" />
              <View
                style={styles.volTrack}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleVolumeTouch}
                onResponderMove={handleVolumeTouch}
              >
                <View style={[styles.volFill, { height: `${volPct}%` as `${number}%` }]} />
              </View>
              <Text style={styles.volPct}>{volPct}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => setVolumeVisible((v) => !v)}
          >
            <Ionicons name={volIcon} size={22} color={volumeVisible ? "#E94057" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#1a1a1a",
    paddingTop: 14, paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#333",
    zIndex: 10,
  },
  meta: { alignItems: "center", marginBottom: 10 },
  storyTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  chapterRow: { flexDirection: "row", alignItems: "center" },
  chapterTitle: { color: "#aaa", fontSize: 12 },
  progressTouchArea: {
    height: 20, justifyContent: "center",
    marginBottom: 2,
  },
  progressTrack: {
    height: 3, backgroundColor: "#444", borderRadius: 2, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
  progressThumb: {
    position: "absolute",
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#E94057",
    marginLeft: -6,
    top: 4,
  },
  progressLabel: { color: "#666", fontSize: 10, textAlign: "right", marginBottom: 14 },
  controls: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  ctrlBtn: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  ctrlDisabled: { opacity: 0.35 },
  playBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "#E94057",
    alignItems: "center", justifyContent: "center",
  },
  volWrap: { alignItems: "center" },
  volPopup: {
    position: "absolute", bottom: 52, right: -8,
    backgroundColor: "#222",
    borderWidth: 1, borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: "center", gap: 8,
    zIndex: 20,
  },
  volTrack: {
    width: 28, height: 90,
    backgroundColor: "#333",
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  volFill: { width: "100%", backgroundColor: "#E94057", borderRadius: 14 },
  volPct: { color: "#aaa", fontSize: 10 },
});
