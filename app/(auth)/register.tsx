import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await login({ id: "u1", email, displayName: name }, "mock-token-123");
    setLoading(false);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-primary text-base">← Quay lại</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản</Text>
          <Text className="text-gray-500 mb-8">Đăng ký để lưu lịch sử đọc truyện</Text>

          <Input label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Tên của bạn" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="Tối thiểu 6 ký tự" secureTextEntry />
          <Input label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Nhập lại mật khẩu" secureTextEntry />

          <Button label="Đăng ký" onPress={handleRegister} loading={loading} className="mt-2" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
