export type ReaderTheme = "light" | "dark" | "sepia";
export type FontSize = "small" | "medium" | "large";

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  fontSizePx: number;
}
