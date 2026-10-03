// Order statuses as the customer sees them. Mirrors
// YelenV3/src/lib/order-status.ts, with colours as hex for React Native.
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

/** The happy path, in order — drives the progress tracker. */
export const ORDER_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; hint: string; bg: string; fg: string }
> = {
  pending: {
    label: "En attente",
    hint: "Commande reçue, notre équipe va la confirmer.",
    bg: "#fffbeb",
    fg: "#b45309",
  },
  confirmed: {
    label: "Confirmée",
    hint: "Votre commande est confirmée.",
    bg: "#f0f9ff",
    fg: "#0369a1",
  },
  preparing: {
    label: "En préparation",
    hint: "Nous préparons votre colis.",
    bg: "#f0fdfa",
    fg: "#0f766e",
  },
  shipped: {
    label: "En cours de livraison",
    hint: "Votre colis est en route.",
    bg: "#fff7ed",
    fg: "#c2410c",
  },
  delivered: {
    label: "Livrée",
    hint: "Commande livrée. Merci pour votre confiance !",
    bg: "#ecfdf5",
    fg: "#047857",
  },
  cancelled: {
    label: "Annulée",
    hint: "Cette commande a été annulée.",
    bg: "#fff1f2",
    fg: "#be123c",
  },
};

export interface AccountOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  amount: number;
  createdAt: string;
  address: string;
  city: string;
  items: {
    productId: string | null;
    name: string;
    qty: number;
    price: number;
    image: string | null;
  }[];
  events: { status: OrderStatus; at: string }[];
  driver: { name: string; phone: string } | null;
}

export interface AccountCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  createdAt: string;
}
