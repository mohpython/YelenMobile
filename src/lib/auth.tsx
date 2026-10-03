import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { AccountCustomer } from "./order-status";

const TOKEN_KEY = "yelen.session";

interface AuthValue {
  customer: AccountCustomer | null;
  token: string | null;
  /** False until the stored token has been checked. */
  ready: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  register: (name: string, phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { name: string; address: string; city: string }) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<AccountCustomer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // A stored token survives app restarts; it is dropped if the server no
  // longer accepts it (expired, PIN changed, customer blocked).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!stored) return;
        const { customer } = await api<{ customer: AccountCustomer }>("/account/me", {
          token: stored,
        });
        if (!cancelled) {
          setToken(stored);
          setCustomer(customer);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const open = useCallback(async (res: { customer: AccountCustomer; token: string }) => {
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    setToken(res.token);
    setCustomer(res.customer);
  }, []);

  const login = useCallback(
    async (phone: string, pin: string) => {
      open(
        await api<{ customer: AccountCustomer; token: string }>("/account/login", {
          method: "POST",
          body: { phone, pin },
        })
      );
    },
    [open]
  );

  const register = useCallback(
    async (name: string, phone: string, pin: string) => {
      open(
        await api<{ customer: AccountCustomer; token: string }>("/account/register", {
          method: "POST",
          body: { name, phone, pin },
        })
      );
    },
    [open]
  );

  const logout = useCallback(async () => {
    await api("/account/logout", { method: "POST", token }).catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setCustomer(null);
  }, [token]);

  const updateProfile = useCallback(
    async (input: { name: string; address: string; city: string }) => {
      const { customer } = await api<{ customer: AccountCustomer }>("/account/me", {
        method: "PATCH",
        body: input,
        token,
      });
      setCustomer(customer);
    },
    [token]
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string) => {
      // The server revokes other sessions and returns a fresh token for this one.
      const res = await api<{ token?: string }>("/account/pin", {
        method: "POST",
        body: { currentPin, newPin },
        token,
      });
      if (res.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, res.token);
        setToken(res.token);
      }
    },
    [token]
  );

  const value = useMemo(
    () => ({ customer, token, ready, login, register, logout, updateProfile, changePin }),
    [customer, token, ready, login, register, logout, updateProfile, changePin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
