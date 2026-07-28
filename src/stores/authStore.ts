import { create } from "zustand";
import { User } from "../types/auth";
import { supabase } from "../lib/supabase";
import { signOut } from "../services/authService";

interface AuthStore {
  user: User | null;
  isLoggedIn: boolean;
  initialize: () => () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,

  initialize: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        set({
          user: {
            id: u.id,
            email: u.email ?? "",
            displayName:
              u.user_metadata?.display_name ??
              u.user_metadata?.full_name ??
              u.email?.split("@")[0] ??
              "Người dùng",
            avatarUrl: u.user_metadata?.avatar_url,
          },
          isLoggedIn: true,
        });
      } else {
        set({ user: null, isLoggedIn: false });
      }
    });
    return () => subscription.unsubscribe();
  },

  logout: async () => {
    await signOut();
  },
}));
