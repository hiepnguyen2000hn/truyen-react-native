import { View, StyleSheet } from "react-native";
import { memo } from "react";

interface Props {
  theme: "light" | "dark" | "sepia";
}

// Rất mờ (2-5% alpha) để không ảnh hưởng độ tương phản của chữ
const MIST_COLOR = {
  light: "rgba(120,108,80,0.05)",
  dark: "rgba(255,255,255,0.045)",
  sepia: "rgba(74,55,40,0.06)",
};

function ReaderBackgroundComponent({ theme }: Props) {
  const color = MIST_COLOR[theme];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.wisp, styles.wispA, { backgroundColor: color }]} />
      <View style={[styles.wisp, styles.wispB, { backgroundColor: color }]} />
      <View style={[styles.wisp, styles.wispC, { backgroundColor: color }]} />
      <View style={[styles.wisp, styles.wispD, { backgroundColor: color }]} />
      <View style={[styles.wisp, styles.wispE, { backgroundColor: color }]} />
    </View>
  );
}

export const ReaderBackground = memo(ReaderBackgroundComponent);

const styles = StyleSheet.create({
  // Các dải mây thon dài, bo tròn hai đầu, xoay nhẹ — gợi vân mây tranh thủy mặc
  wisp: {
    position: "absolute",
    borderRadius: 999,
  },
  wispA: {
    width: 460, height: 130,
    top: -30, left: -160,
    transform: [{ rotate: "-12deg" }],
  },
  wispB: {
    width: 380, height: 100,
    top: 160, right: -140,
    transform: [{ rotate: "9deg" }],
  },
  wispC: {
    width: 520, height: 150,
    top: "42%", left: -200,
    transform: [{ rotate: "-6deg" }],
  },
  wispD: {
    width: 340, height: 90,
    bottom: 220, right: -120,
    transform: [{ rotate: "14deg" }],
  },
  wispE: {
    width: 480, height: 140,
    bottom: -40, left: -140,
    transform: [{ rotate: "8deg" }],
  },
});
