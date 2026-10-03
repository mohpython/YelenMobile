// Mirrors YelenV3/src/lib/phone.ts.

/** Digits-only number with country code, or null if it can't be a phone number. */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 8) d = `223${d}`;
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

/** "22392839788" → "+223 92 83 97 88". */
export function formatPhone(key: string): string {
  if (key.startsWith("223") && key.length === 11) {
    const local = key.slice(3).match(/.{2}/g)!.join(" ");
    return `+223 ${local}`;
  }
  return `+${key}`;
}
