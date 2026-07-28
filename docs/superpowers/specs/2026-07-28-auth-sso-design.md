# Auth SSO Design — Google + Facebook + Email/Password

**Date:** 2026-07-28  
**Status:** Approved

## Overview

Thay thế mock auth hiện tại bằng Supabase Auth thật, hỗ trợ 3 phương thức đăng nhập: Email/Password, Google OAuth, Facebook OAuth. Giữ Expo managed workflow (không prebuild), dùng Web-based OAuth flow qua `expo-web-browser`.

## Scope

- **In:** Email/Password login + register, Google SSO, Facebook SSO, session persistence, error handling
- **Out:** TikTok SSO, native SDK dialogs (Google/Facebook), phone number auth

## Architecture

```
app/(auth)/login.tsx
    ↓ gọi
src/services/authService.ts      ← NEW
    ↓
src/lib/supabase.ts              ← NEW: Supabase client
    ↓
Supabase Auth (cloud)
    ↓ session callback
src/stores/authStore.ts          ← UPDATE: dùng onAuthStateChange
    ↑
app/_layout.tsx                  ← UPDATE: deep link handler + restoreSession
```

## New Files

### `src/lib/supabase.ts`
- Khởi tạo `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { storage: AsyncStorage } })`
- Export `supabase` singleton

### `src/services/authService.ts`
Xuất 4 hàm:
- `signInWithEmail(email, password)` → `supabase.auth.signInWithPassword()`
- `signUpWithEmail(email, password)` → `supabase.auth.signUp()`
- `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: makeRedirectUri() })`
- `signInWithFacebook()` → `supabase.auth.signInWithOAuth({ provider: 'facebook', redirectTo: makeRedirectUri() })`
- `signOut()` → `supabase.auth.signOut()`

## Updated Files

### `src/stores/authStore.ts`
- Bỏ `login(user, token)` nhận tham số thủ công
- Thêm `initialize()`: subscribe `supabase.auth.onAuthStateChange` → cập nhật `user`, `isLoggedIn`
- `logout()` gọi `authService.signOut()`

### `app/_layout.tsx`
- Gọi `useAuthStore().initialize()` một lần khi mount
- Dùng `expo-linking` lắng nghe deep link `truyen://auth/callback`
- Parse `#access_token` và `#refresh_token` từ URL fragment, gọi `supabase.auth.setSession()`

### `app/(auth)/login.tsx`
- Thay `login()` mock bằng `authService.signInWithEmail()`
- Thêm 2 nút: "Tiếp tục với Google" và "Tiếp tục với Facebook"
- Nút Google: nền trắng, border xám, icon Google SVG inline
- Nút Facebook: nền #1877F2, text trắng, icon Facebook

### `app/(auth)/register.tsx`
- Thay mock bằng `authService.signUpWithEmail()`
- Hiển thị thông báo "Kiểm tra email để xác nhận tài khoản"

### `app.json`
- Thêm `scheme: "truyen"` để OAuth deep link hoạt động

## OAuth Flow

1. User bấm nút Google/Facebook
2. `authService.signInWithGoogle()` lấy URL từ Supabase, mở `WebBrowser.openAuthSessionAsync(url, redirectUri)`
3. User auth xong trên web → browser redirect về `truyen://auth/callback#access_token=...`
4. `_layout.tsx` parse token từ URL fragment
5. `supabase.auth.setSession({ access_token, refresh_token })` → `onAuthStateChange` emit SIGNED_IN
6. authStore cập nhật user → router redirect sang `/(tabs)`

## Dependencies to Install

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-web-browser expo-auth-session expo-linking
```

## Error Handling

| Scenario | Message |
|----------|---------|
| Sai email/password | "Email hoặc mật khẩu không đúng" |
| Email chưa xác nhận | "Vui lòng xác nhận email trước khi đăng nhập" |
| Network error | "Lỗi kết nối, vui lòng thử lại" |
| User đóng OAuth browser | Silent (không làm gì) |
| OAuth provider lỗi | Alert "Đăng nhập thất bại, thử lại" |

## External Setup Required (ngoài code)

1. **Supabase Dashboard:** Bật Google provider + Facebook provider, điền Client ID/Secret
2. **Google Cloud Console:** Tạo OAuth 2.0 credentials, thêm Redirect URI từ Supabase
3. **Facebook Developer:** Tạo App, lấy App ID + App Secret, thêm Redirect URI từ Supabase
4. **Supabase Redirect URLs:** Thêm `truyen://auth/callback` vào allowed redirect URLs
