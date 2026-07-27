export const colors = {
  dark: {
    bg: "#0d0d0d",
    bgSecondary: "#161616",
    card: "#1a1a1a",
    cardBorder: "#2A2A2A",
    text: "#F0F0F0",
    textSub: "#888888",
    textMuted: "#555555",
    input: "#1e1e1e",
    filterChip: "#2a2a2a",
    filterChipText: "#CCCCCC",
    tabBar: "#161616",
    tabBarBorder: "#2A2A2A",
    modalBg: "#1a1a1a",
    divider: "#2A2A2A",
  },
  light: {
    bg: "#F5F5F5",
    bgSecondary: "#EBEBEB",
    card: "#FFFFFF",
    cardBorder: "#E5E7EB",
    text: "#111827",
    textSub: "#6B7280",
    textMuted: "#9CA3AF",
    input: "#FFFFFF",
    filterChip: "#F3F4F6",
    filterChipText: "#374151",
    tabBar: "#FFFFFF",
    tabBarBorder: "#E5E7EB",
    modalBg: "#FFFFFF",
    divider: "#F0F0F0",
  },
};

export type ColorScheme = "dark" | "light";

export function c(key: keyof typeof colors.dark, scheme?: ColorScheme | null): string {
  return colors[scheme === "dark" ? "dark" : "light"][key];
}
