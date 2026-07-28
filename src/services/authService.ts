import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: "doctruyen",
  path: "auth/callback",
});

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
  if (result.type === "success") {
    await handleOAuthCallback(result.url);
  }
}

export async function signInWithFacebook(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
  if (result.type === "success") {
    await handleOAuthCallback(result.url);
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

async function handleOAuthCallback(url: string): Promise<void> {
  // PKCE flow: code in query params
  const codeMatch = url.match(/[?&]code=([^&]+)/);
  if (codeMatch) {
    await supabase.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
    return;
  }
  // Implicit flow fallback: tokens in hash fragment
  const hashMatch = url.match(/#(.+)/);
  if (!hashMatch) return;
  const params = new URLSearchParams(hashMatch[1]);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token) {
    await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? "" });
  }
}
