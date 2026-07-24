import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await login({ id: "u1", email, displayName: email.split("@")[0] }, "mock-token-123");
    setLoading(false);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl">📚</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Đọc Truyện</Text>
            <Text className="text-gray-500 mt-1">Đăng nhập để tiếp tục</Text>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button label="Đăng nhập" onPress={handleLogin} loading={loading} className="mt-2" />

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-100" />
            <Text className="mx-4 text-gray-400 text-sm">hoặc</Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <Button
            label="Tiếp tục không đăng nhập"
            onPress={() => router.replace("/(tabs)")}
            variant="outline"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-primary font-semibold">Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
