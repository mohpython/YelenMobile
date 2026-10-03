import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Calls the storefront API. The session token goes in an Authorization header
 * because a native app has no cookie jar; `x-yelen-client` tells the server to
 * answer with a token instead of setting a cookie.
 */
export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-yelen-client": "mobile",
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(0, "Connexion impossible. Vérifiez votre connexion internet.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "Une erreur est survenue. Réessayez.");
  }
  return data as T;
}
