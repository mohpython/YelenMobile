import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./types";

const CART_KEY = "yelen.cart";

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // The cart holds a snapshot of each product so it renders offline; prices are
  // always re-read server-side when the order is placed.
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, loaded]);

  const add = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (!existing) return [...prev, { product, qty }];
      return prev.map((i) =>
        i.product.id === product.id
          ? { ...i, qty: Math.min(i.qty + qty, Math.max(1, product.stock)) }
          : i
      );
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, qty: Math.max(1, Math.min(qty, Math.max(1, i.product.stock))) }
          : i
      )
    );
  }, []);

  const remove = useCallback(
    (productId: string) => setItems((prev) => prev.filter((i) => i.product.id !== productId)),
    []
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      total: items.reduce((s, i) => s + i.qty * i.product.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
