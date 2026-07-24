import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useReaderStore } from "../src/stores/readerStore";
import { useBookshelfStore } from "../src/stores/bookshelfStore";
import "../global.css";

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const loadSettings = useReaderStore((s) => s.loadSettings);
  const loadData = useBookshelfStore((s) => s.loadData);

  useEffect(() => {
    Promise.all([restoreSession(), loadSettings(), loadData()]);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="story/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reader/[storyId]/[chapterId]" options={{ headerShown: false }} />
    </Stack>
  );
}
