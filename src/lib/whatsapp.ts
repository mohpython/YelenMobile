import { Linking } from "react-native";
import { SHOP_WHATSAPP } from "./config";
import { formatFCFA, formatShipping } from "./types";

/** Opens WhatsApp with a prefilled message to the shop. */
export function openWhatsApp(message: string) {
  const url = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch(() => {});
}

/** Mirrors the cart message built by the website, so the team reads one format. */
export function buildOrderMessage(opts: {
  reference: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  customer: { name: string; phone: string; address: string; city: string; notes?: string };
}): string {
  const { reference, items, subtotal, shipping, customer } = opts;
  const lines = [
    "Bonjour Yelen Service, je souhaite commander :",
    "",
    `Commande n° ${reference}`,
    "",
    ...items.map((i) => `- ${i.qty}× ${i.name} — ${formatFCFA(i.price * i.qty)}`),
    "",
    `Livraison: ${formatShipping(shipping)}`,
    `Total: ${formatFCFA(subtotal + shipping)}`,
    "",
    `Nom: ${customer.name}`,
    `Téléphone: ${customer.phone}`,
    `Adresse: ${customer.address}`,
    `Ville: ${customer.city}`,
  ];
  if (customer.notes) lines.push(`Notes: ${customer.notes}`);
  return lines.join("\n");
}
