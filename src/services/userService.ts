import { apiClient } from "../lib/apiClient";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface ReaderSettings {
  theme: "light" | "dark" | "sepia";
  fontSize: "small" | "medium" | "large";
  fontSizePx: number;
}

export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdateReaderSettingsDto {
  theme?: "light" | "dark" | "sepia";
  fontSize?: "small" | "medium" | "large";
  fontSizePx?: number;
}

export const userService = {
  getProfile(): Promise<UserProfile> {
    return apiClient.get("/api/v1/me");
  },

  updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    return apiClient.patch("/api/v1/me", data);
  },

  getReaderSettings(): Promise<ReaderSettings> {
    return apiClient.get("/api/v1/me/reader-settings");
  },

  updateReaderSettings(data: UpdateReaderSettingsDto): Promise<ReaderSettings> {
    return apiClient.patch("/api/v1/me/reader-settings", data);
  },

  registerPushToken(token: string, platform: "ios" | "android"): Promise<void> {
    return apiClient.post("/api/v1/me/push-token", { token, platform });
  },
};
