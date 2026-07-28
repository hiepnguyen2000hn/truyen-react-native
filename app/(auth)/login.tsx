import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { signInWithEmail, signInWithGoogle, signInWithFacebook } from "../../src/services/authService";

function getErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  if (msg.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng";
  if (msg.includes("email not confirmed")) return "Vui lòng xác nhận email trước khi đăng nhập";
  if (msg.includes("network") || msg.includes("fetch")) return "Lỗi kết nối, vui lòng thử lại";
  return "Đăng nhập thất bại, thử lại";
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setSocialLoading("google");
    try {
      const authenticated = await signInWithGoogle();
      if (authenticated) router.replace("/(tabs)");
    } catch {
      Alert.alert("Lỗi", "Đăng nhập Google thất bại, thử lại");
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleFacebook() {
    setSocialLoading("facebook");
    try {
      const authenticated = await signInWithFacebook();
      if (authenticated) router.replace("/(tabs)");
    } catch {
      Alert.alert("Lỗi", "Đăng nhập Facebook thất bại, thử lại");
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

          {/* Google */}
          <TouchableOpacity
            className="flex-row items-center justify-center border border-gray-200 rounded-xl py-3 px-6 mb-3 bg-white"
            onPress={handleGoogle}
            disabled={!!socialLoading}
            activeOpacity={0.8}
          >
            {socialLoading === "google" ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Text style={{ color: "#4285F4" }} className="font-bold text-base mr-2">G</Text>
                <Text className="text-gray-700 font-semibold text-base">Tiếp tục với Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Facebook */}
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-xl py-3 px-6 mb-3"
            style={{ backgroundColor: "#1877F2" }}
            onPress={handleFacebook}
            disabled={!!socialLoading}
            activeOpacity={0.8}
          >
            {socialLoading === "facebook" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white font-bold text-base mr-2">f</Text>
                <Text className="text-white font-semibold text-base">Tiếp tục với Facebook</Text>
              </>
            )}
          </TouchableOpacity>

          <Button
            label="Tiếp tục không đăng nhập"
            onPress={() => router.replace("/(tabs)")}
            variant="outline"
            className="mt-1"
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
