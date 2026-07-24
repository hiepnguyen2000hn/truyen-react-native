import { View, Text } from "react-native";
import { Genre } from "../../types/story";

export function Badge({ genre }: { genre: Genre }) {
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: genre.color + "20" }}>
      <Text className="text-xs font-medium" style={{ color: genre.color }}>{genre.name}</Text>
    </View>
  );
}
