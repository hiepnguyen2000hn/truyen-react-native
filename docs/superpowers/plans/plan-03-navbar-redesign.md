# Plan 03: Bottom Navbar Redesign

> **Mục tiêu:** Thay thế default Expo Router Tab bar bằng custom bottom navbar đẹp hơn theo design — có label, active indicator, và shadow. 4 tab: Trang Chủ, Khám Phá, Tủ Sách, Cá Nhân.

**Tech Stack:** Expo Router v4, NativeWind v4, React Native Reanimated (đã cài)

**Design spec:**
- Background: `#ffffff` (light) / `#111827` (dark)
- Active tab: icon + label đổi màu `#E94057`, có dot indicator bên dưới icon
- Inactive: icon + label màu `#9ca3af`
- Height: 64px + safe area bottom
- Shadow: `elevation: 8` / `shadowOpacity: 0.12`
- Tab items: Home (home), Khám Phá (compass), Tủ Sách (bookmark), Cá Nhân (person)

---

## File Map

| Action | Path |
|--------|------|
| **Create** | `src/components/ui/BottomTabBar.tsx` — custom tab bar component |
| **Modify** | `app/(tabs)/_layout.tsx` — dùng custom tabBar |

---

## Task 1: Tạo BottomTabBar component

**Files:**
- Create: `src/components/ui/BottomTabBar.tsx`

- [ ] **Step 1: Tạo custom tab bar**

`src/components/ui/BottomTabBar.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "index", label: "Trang Chủ", icon: "home", iconOutline: "home-outline" },
  { name: "discover", label: "Khám Phá", icon: "compass", iconOutline: "compass-outline" },
  { name: "bookshelf", label: "Tủ Sách", icon: "bookmark", iconOutline: "bookmark-outline" },
  { name: "profile", label: "Cá Nhân", icon: "person", iconOutline: "person-outline" },
] as const;

const PRIMARY = "#E94057";
const INACTIVE = "#9ca3af";

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[index];
        const isActive = state.index === index;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {/* Dot indicator */}
            <View style={[styles.dot, isActive && styles.dotActive]} />

            {/* Icon */}
            <Ionicons
              name={(isActive ? tab.icon : tab.iconOutline) as keyof typeof Ionicons.glyphMap}
              size={24}
              color={isActive ? PRIMARY : INACTIVE}
            />

            {/* Label */}
            <Text style={[styles.label, { color: isActive ? PRIMARY : INACTIVE }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginBottom: 2,
  },
  dotActive: {
    backgroundColor: PRIMARY,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
```

- [ ] **Step 2: Commit**
```bash
git add src/components/ui/BottomTabBar.tsx
git commit -m "feat: custom BottomTabBar component with dot indicator"
```

---

## Task 2: Wire vào Tab Layout

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Dùng custom tab bar**

`app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from "expo-router";
import { BottomTabBar } from "../../src/components/ui/BottomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Trang Chủ" }} />
      <Tabs.Screen name="discover" options={{ title: "Khám Phá" }} />
      <Tabs.Screen name="bookshelf" options={{ title: "Tủ Sách" }} />
      <Tabs.Screen name="profile" options={{ title: "Cá Nhân" }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: wire custom BottomTabBar into tab layout"
```

---

## Task 3 (Optional): Badge cho Tủ Sách

Nếu muốn hiện số badge (số truyện đã lưu) trên tab Tủ Sách:

**Files:**
- Modify: `src/components/ui/BottomTabBar.tsx`

- [ ] **Step 1: Thêm badge count**

Trong `BottomTabBar`, dùng `useBookshelfStore` để lấy `bookmarks.length`:
```tsx
import { useBookshelfStore } from "../../stores/bookshelfStore";

// Trong component:
const bookmarkCount = useBookshelfStore((s) => s.bookmarks.length);

// Trong render tab index 2 (Tủ Sách):
{index === 2 && bookmarkCount > 0 && (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{bookmarkCount > 99 ? "99+" : bookmarkCount}</Text>
  </View>
)}
```

Thêm styles:
```ts
badge: {
  position: "absolute",
  top: 0,
  right: "50%",
  marginRight: -22,
  backgroundColor: PRIMARY,
  borderRadius: 8,
  minWidth: 16,
  height: 16,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 4,
},
badgeText: {
  color: "#fff",
  fontSize: 9,
  fontWeight: "700",
},
```

- [ ] **Step 2: Commit**
```bash
git add src/components/ui/BottomTabBar.tsx
git commit -m "feat: add bookmark count badge to bookshelf tab"
```

---

## Manual Test Checklist

1. App khởi động → bottom bar hiện với 4 tab, style mới (không phải default Expo)
2. Tap từng tab → active tab có icon đặc (filled), label đỏ, dot đỏ bên trên
3. Inactive tab có icon outline, label xám
4. Safe area padding đúng trên iPhone (không bị che bởi home indicator)
5. Android: shadow hiện đúng (elevation)
6. Bookmark 1 truyện → số badge xuất hiện trên icon Tủ Sách
