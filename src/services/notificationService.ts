import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: "new_chapter";
  storyId: string;
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications only work on physical devices");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("new-chapters", {
      name: "Chương mới",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E94057",
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log("Expo Push Token:", token.data);
    return token.data;
  } catch (e) {
    console.error("Failed to get push token:", e);
    return null;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: NotificationData,
  delaySeconds = 0
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as unknown as Record<string, unknown>,
      sound: true,
    },
    trigger: delaySeconds > 0
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
      : null,
  });
}

export async function testNewChapterNotification(
  storyTitle: string,
  chapterTitle: string,
  storyId: string,
  chapterId: string
): Promise<void> {
  await scheduleLocalNotification(
    `📖 ${storyTitle}`,
    `Chương mới: ${chapterTitle}`,
    { type: "new_chapter", storyId, chapterId, storyTitle, chapterTitle },
    3
  );
}
