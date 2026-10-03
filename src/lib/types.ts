// Mirrors YelenV3/src/lib/types.ts — same shapes as the storefront API returns.

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  products: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  image: string;
  emoji: string;
  sales: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  areas: string[];
  fee: number;
  delay: string;
}

export function formatFCFA(amount: number): string {
  // Intl with fr-FR is unreliable on older Android builds, so group by hand.
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} FCFA`;
}

/** Delivery is free across Bamako: show the word, not "0 FCFA". */
export function formatShipping(fee: number): string {
  return fee <= 0 ? "Gratuite" : formatFCFA(fee);
}
