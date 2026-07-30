import { supabase } from "./supabase";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://truyen-api.your-domain.com";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader();
  const url = `${BASE_URL}${path}`;

  console.log(`[API] ${options.method ?? "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
  });

  console.log(`[API] ${response.status} ${url}`);

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    console.error(`[API] Error body:`, body);
    throw new ApiError(
      `HTTP ${response.status}: ${path}`,
      response.status,
      body
    );
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json();
  console.log(`[API] Response:`, JSON.stringify(data).slice(0, 300));
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
