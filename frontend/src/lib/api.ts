const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function apiClient(
  path: string,
  options: RequestInit & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message ?? "Request failed");
  }

  return res.json();
}