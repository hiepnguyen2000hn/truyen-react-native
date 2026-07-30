import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Button } from "../../src/components/ui/Button";
import { useAuthStore } from "../../src/stores/authStore";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";
import { useThemeStore } from "../../src/stores/themeStore";
import { testNewChapterNotification } from "../../src/services/notificationService";
import { c } from "../../src/theme";

interface SettingRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  value?: string;
  showArrow?: boolean;
  right?: React.ReactNode;
}

function SettingRow({ icon, label, onPress, value, showArrow = true, right }: SettingRowProps) {
  const { colorScheme } = useColorScheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: c("divider", colorScheme),
      }}
    >
      <View style={{
        width: 32,
        height: 32,
        backgroundColor: c("filterChip", colorScheme),
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}>
        <Ionicons name={icon as any} size={16} color={c("textSub", colorScheme)} />
      </View>
      <Text style={{ flex: 1, color: c("text", colorScheme), fontSize: 15 }}>{label}</Text>
      {value && <Text style={{ color: c("textMuted", colorScheme), fontSize: 13, marginRight: 8 }}>{value}</Text>}
      {right}
      {showArrow && !right && <Ionicons name="chevron-forward" size={16} color={c("textMuted", colorScheme)} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const { bookmarks, history } = useBookshelfStore();
  const { isDark, toggle } = useThemeStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c("bg", colorScheme) }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: c("text", colorScheme) }}>Cá Nhân</Text>
        </View>

        {/* User info card */}
        <View style={{
          marginHorizontal: 16,
          backgroundColor: c("card", colorScheme),
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c("cardBorder", colorScheme),
        }}>
          {isLoggedIn && user ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: "rgba(233,64,87,0.15)",
                borderRadius: 32,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Text style={{ fontSize: 26, fontWeight: "800", color: "#E94057" }}>
                  {user.displayName[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: c("text", colorScheme) }}>
                  {user.displayName}
                </Text>
                <Text style={{ color: c("textSub", colorScheme), fontSize: 13 }}>{user.email}</Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: c("filterChip", colorScheme),
                borderRadius: 32,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}>
                <Ionicons name="person" size={28} color={c("textMuted", colorScheme)} />
              </View>
              <Text style={{ color: c("textSub", colorScheme), marginBottom: 16 }}>
                Đăng nhập để lưu tiến độ đọc
              </Text>
              <Button label="Đăng nhập" onPress={() => router.push("/(auth)/login")} />
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={{
          marginHorizontal: 16,
          backgroundColor: c("card", colorScheme),
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c("cardBorder", colorScheme),
        }}>
          <Text style={{ fontWeight: "700", color: c("text", colorScheme), marginBottom: 12 }}>Thống kê</Text>
          <View style={{ flexDirection: "row" }}>
            {[
              { label: "Đã lưu", value: bookmarks.length, icon: "bookmark" },
              { label: "Đang đọc", value: history.length, icon: "book" },
              { label: "Tổng chương", value: history.reduce((sum, h) => sum + h.chapterNumber, 0), icon: "list" },
            ].map((stat) => (
              <View key={stat.label} style={{ flex: 1, alignItems: "center" }}>
                <Ionicons name={stat.icon as any} size={20} color="#E94057" />
                <Text style={{ fontSize: 20, fontWeight: "800", color: c("text", colorScheme), marginTop: 4 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 11, color: c("textSub", colorScheme) }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={{
          marginHorizontal: 16,
          backgroundColor: c("card", colorScheme),
          borderRadius: 16,
          paddingHorizontal: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c("cardBorder", colorScheme),
        }}>
          {/* Theme toggle */}
          <SettingRow
            icon={isDark ? "moon" : "sunny-outline"}
            label="Chế độ tối"
            onPress={toggle}
            showArrow={false}
            right={
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: "#d1d5db", true: "#E94057" }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="notifications-outline"
            label="Test Notification (3 giây)"
            onPress={async () => {
              await testNewChapterNotification("Truyện test", "Chương 1", "test-id", "chapter-1");
              Alert.alert("OK", "Notification sẽ xuất hiện sau 3 giây. Minimize app để test!");
            }}
          />
          <SettingRow icon="download-outline" label="Truyện đã tải" onPress={() => {}} />
          <SettingRow icon="shield-checkmark-outline" label="Chính sách bảo mật" onPress={() => {}} />
          <SettingRow
            icon="information-circle-outline"
            label="Phiên bản"
            onPress={() => {}}
            value="1.0.0"
            showArrow={false}
          />
        </View>

        {isLoggedIn && (
          <View style={{ marginHorizontal: 16 }}>
            <Button label="Đăng xuất" onPress={handleLogout} variant="outline" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
