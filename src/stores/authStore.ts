import { create } from "zustand";
import { User } from "../types/auth";
import { storage } from "../utils/storage";

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: async (user, token) => {
    await storage.set("user", user);
    await storage.set("token", token);
    set({ user, token, isLoggedIn: true });
  },

  logout: async () => {
    await storage.remove("user");
    await storage.remove("token");
    set({ user: null, token: null, isLoggedIn: false });
  },

  restoreSession: async () => {
    const user = await storage.get<User>("user");
    const token = await storage.get<string>("token");
    if (user && token) {
      set({ user, token, isLoggedIn: true });
    }
  },
}));
