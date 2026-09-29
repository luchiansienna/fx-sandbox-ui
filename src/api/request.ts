export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${response.status}).`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
