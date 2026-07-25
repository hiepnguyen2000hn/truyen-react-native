import { Stack, router } from "expo-router";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "../src/stores/authStore";
import { useReaderStore } from "../src/stores/readerStore";
import { useBookshelfStore } from "../src/stores/bookshelfStore";
import { useNotifications } from "../src/hooks/useNotifications";
import { NotificationData } from "../src/services/notificationService";
import "../global.css";

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const loadSettings = useReaderStore((s) => s.loadSettings);
  const loadData = useBookshelfStore((s) => s.loadData);

  useNotifications();

  useEffect(() => {
    Promise.all([restoreSession(), loadSettings(), loadData()]).catch(console.error);
  }, []);

  // Handle notification tap from killed state
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as NotificationData;
        if (data?.type === "new_chapter" && data.storyId && data.chapterId) {
          router.push(`/reader/${data.storyId}/${data.chapterId}`);
        }
      }
    });
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
