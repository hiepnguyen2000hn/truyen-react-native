# Plan 02: Firebase Push Notifications

> **Mục tiêu:** Tích hợp Firebase Cloud Messaging (FCM) để gửi push notification khi có chương mới. Setup token registration, foreground/background handler, và notification deep link vào reader.

**Tech Stack:** Expo SDK 57, `expo-notifications`, `@react-native-firebase/app`, `@react-native-firebase/messaging`

**Lưu ý:** Expo SDK 57 dùng New Architecture. Firebase cần config native — nếu dùng Expo Go thì dùng `expo-notifications` standalone (không cần Firebase SDK). Plan này dùng `expo-notifications` + FCM server key (không cần full Firebase SDK, tương thích Expo Go).

---

## File Map

| Action | Path |
|--------|------|
| **Install** | `expo-notifications`, `expo-device` |
| **Create** | `src/services/notificationService.ts` |
| **Create** | `src/hooks/useNotifications.ts` |
| **Modify** | `app/_layout.tsx` — register + listener |
| **Modify** | `app.json` — notification config |

---

## Task 1: Cài packages và cấu hình app.json

**Files:**
- Modify: `package.json` (via npx expo install)
- Modify: `app.json`

- [ ] **Step 1: Install expo-notifications và expo-device**

```bash
npx expo install expo-notifications expo-device
```

- [ ] **Step 2: Cập nhật app.json — thêm notification config**

Trong `app.json`, bên trong `"expo": { ... }`, thêm:
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#E94057",
          "sounds": [],
          "androidMode": "default",
          "androidCollapsedTitle": "Đọc Truyện",
          "iosDisplayInForeground": true
        }
      ]
    ],
    "android": {
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#E94057" },
      "googleServicesFile": "./google-services.json",
      "package": "com.truyen.reader"
    },
    "ios": {
      "bundleIdentifier": "com.truyen.reader",
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

**Lưu ý:** `google-services.json` và `GoogleService-Info.plist` cần lấy từ Firebase Console → Project Settings → Your apps. Tạo placeholder file nếu chưa có để TypeScript không lỗi.

- [ ] **Step 3: Commit config**
```bash
git add app.json package.json package-lock.json
git commit -m "feat: install expo-notifications, add firebase notification config"
```

---

## Task 2: Tạo NotificationService

**Files:**
- Create: `src/services/notificationService.ts`

- [ ] **Step 1: Tạo notification service**

`src/services/notificationService.ts`:
```ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Cấu hình cách notification hiển thị khi app đang mở
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

  // Lấy Expo Push Token (dùng được ngay, không cần Firebase setup phức tạp)
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "your-expo-project-id", // lấy từ app.json > expo.extra.eas.projectId
    });
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

// Test helper: fire a mock "new chapter" notification after 3 seconds
export async function testNewChapterNotification(storyTitle: string, chapterTitle: string, storyId: string, chapterId: string) {
  await scheduleLocalNotification(
    `📖 ${storyTitle}`,
    `Chương mới: ${chapterTitle}`,
    { type: "new_chapter", storyId, chapterId, storyTitle, chapterTitle },
    3
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/services/notificationService.ts
git commit -m "feat: notification service with Expo Push Token registration"
```

---

## Task 3: Tạo useNotifications hook

**Files:**
- Create: `src/hooks/useNotifications.ts`

- [ ] **Step 1: Tạo hook**

`src/hooks/useNotifications.ts`:
```ts
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { registerForPushNotifications, NotificationData } from "../services/notificationService";

export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Đăng ký nhận notification
    registerForPushNotifications().then(setPushToken);

    // Lắng nghe notification khi app đang mở (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    // Lắng nghe khi user tap vào notification (cả foreground + background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        if (data?.type === "new_chapter" && data.storyId && data.chapterId) {
          // Deep link vào reader screen
          router.push(`/reader/${data.storyId}/${data.chapterId}`);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { pushToken };
}
```

- [ ] **Step 2: Commit**
```bash
git add src/hooks/useNotifications.ts
git commit -m "feat: useNotifications hook with deep link routing on tap"
```

---

## Task 4: Wire vào root layout + test button

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/(tabs)/profile.tsx` — thêm nút test notification

- [ ] **Step 1: Dùng hook trong root layout**

`app/_layout.tsx` — thêm:
```tsx
import { useNotifications } from "../src/hooks/useNotifications";

export default function RootLayout() {
  // ... existing stores ...
  useNotifications(); // đăng ký listeners

  return ( ... );
}
```

- [ ] **Step 2: Thêm nút "Test Notification" trong Profile screen**

`app/(tabs)/profile.tsx` — thêm vào phần Settings rows:
```tsx
import { testNewChapterNotification } from "../../src/services/notificationService";
import { MOCK_STORIES } from "../../src/data/mockStories";
import { getMockChapters } from "../../src/data/mockChapters";

// Trong render, thêm SettingRow:
<SettingRow
  icon="notifications-outline"
  label="Test Notification (3 giây)"
  onPress={async () => {
    const story = MOCK_STORIES[0];
    const chapters = getMockChapters(story.id);
    await testNewChapterNotification(story.title, chapters[1].title, story.id, chapters[1].id);
    Alert.alert("OK", "Notification sẽ xuất hiện sau 3 giây. Minimize app để test!");
  }}
/>
```

- [ ] **Step 3: Handle notification từ killed state**

`app/_layout.tsx` — thêm check khi app khởi động:
```tsx
useEffect(() => {
  // Kiểm tra xem app có được mở từ notification không
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data as NotificationData;
      if (data?.type === "new_chapter" && data.storyId && data.chapterId) {
        router.push(`/reader/${data.storyId}/${data.chapterId}`);
      }
    }
  });
}, []);
```

- [ ] **Step 4: Android notification channel**

Cho Android, thêm vào `app/_layout.tsx` (chạy một lần):
```tsx
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

useEffect(() => {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("new-chapters", {
      name: "Chương mới",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E94057",
    });
  }
}, []);
```

- [ ] **Step 5: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**
```bash
git add app/_layout.tsx app/(tabs)/profile.tsx
git commit -m "feat: wire push notifications into root layout, add test button in profile"
```

---

## Manual Test Checklist

1. Chạy app trên thiết bị thật (simulator không nhận push)
2. Tab Profile → tap "Test Notification (3 giây)"
3. Alert hiện → bấm OK → minimize app
4. Sau 3 giây: notification xuất hiện với icon và màu đỏ
5. Tap notification → app mở, navigate thẳng vào reader chương đúng
6. Thử với app đang mở: notification hiện dưới dạng banner trong app
7. Console log in ra push token — lưu lại để test FCM server-side sau
