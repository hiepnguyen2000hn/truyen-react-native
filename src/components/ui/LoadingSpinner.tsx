import { View, ActivityIndicator } from "react-native";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <View className={`flex-1 items-center justify-center ${className ?? ""}`}>
      <ActivityIndicator size="large" color="#E94057" />
    </View>
  );
}
