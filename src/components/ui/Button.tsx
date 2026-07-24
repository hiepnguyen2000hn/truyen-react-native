import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, className }: ButtonProps) {
  const baseClass = "flex-row items-center justify-center rounded-xl py-3 px-6";
  const variantClass = {
    primary: "bg-primary",
    outline: "border border-primary",
    ghost: "bg-transparent",
  }[variant];
  const textClass = {
    primary: "text-white font-semibold text-base",
    outline: "text-primary font-semibold text-base",
    ghost: "text-primary font-semibold text-base",
  }[variant];

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${disabled || loading ? "opacity-50" : ""} ${className ?? ""}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#E94057"} />
      ) : (
        <Text className={textClass}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
