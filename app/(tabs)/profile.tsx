import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../src/components/ui/Button";
import { useAuthStore } from "../../src/stores/authStore";
import { useBookshelfStore } from "../../src/stores/bookshelfStore";

interface SettingRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  value?: string;
  showArrow?: boolean;
}

function SettingRow({ icon, label, onPress, value, showArrow = true }: SettingRowProps) {
  return (
    <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-50" onPress={onPress} activeOpacity={0.7}>
      <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-3">
        <Ionicons name={icon as any} size={16} color="#666" />
      </View>
      <Text className="flex-1 text-gray-800 text-base">{label}</Text>
      {value && <Text className="text-gray-400 text-sm mr-2">{value}</Text>}
      {showArrow && <Ionicons name="chevron-forward" size={16} color="#ccc" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const { bookmarks, history } = useBookshelfStore();

  async function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-4">
          <Text className="text-2xl font-bold text-gray-900">Cá Nhân</Text>
        </View>

        {/* User info card */}
        <View className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
          {isLoggedIn && user ? (
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center">
                <Text className="text-2xl font-bold text-primary">{user.displayName[0].toUpperCase()}</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-900">{user.displayName}</Text>
                <Text className="text-gray-500 text-sm">{user.email}</Text>
              </View>
            </View>
          ) : (
            <View className="items-center py-2">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="person" size={28} color="#aaa" />
              </View>
              <Text className="text-gray-500 mb-4">Đăng nhập để lưu tiến độ đọc</Text>
              <Button label="Đăng nhập" onPress={() => router.push("/(auth)/login")} />
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-gray-900 mb-3">Thống kê</Text>
          <View className="flex-row">
            {[
              { label: "Đã lưu", value: bookmarks.length, icon: "bookmark" },
              { label: "Đang đọc", value: history.length, icon: "book" },
              { label: "Tổng chương", value: history.length, icon: "list" },
            ].map((stat) => (
              <View key={stat.label} className="flex-1 items-center">
                <Ionicons name={stat.icon as any} size={20} color="#E94057" />
                <Text className="text-xl font-bold text-gray-900 mt-1">{stat.value}</Text>
                <Text className="text-xs text-gray-500">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View className="mx-4 bg-white rounded-2xl px-4 shadow-sm mb-4">
          <SettingRow icon="notifications-outline" label="Thông báo" onPress={() => {}} />
          <SettingRow icon="download-outline" label="Truyện đã tải" onPress={() => {}} />
          <SettingRow icon="shield-checkmark-outline" label="Chính sách bảo mật" onPress={() => {}} />
          <SettingRow icon="information-circle-outline" label="Phiên bản" onPress={() => {}} value="1.0.0" />
        </View>

        {isLoggedIn && (
          <View className="mx-4 mb-8">
            <Button label="Đăng xuất" onPress={handleLogout} variant="outline" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
