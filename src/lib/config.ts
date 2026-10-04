import Constants from "expo-constants";

// In development the API runs on the same machine as the Expo dev server, so
// the phone can reach it at that machine's LAN address. EXPO_PUBLIC_API_URL
// overrides this for staging or production builds.
const devHost = Constants.expoConfig?.hostUri?.split(":")[0];

// An empty value counts as unset, so `EXPO_PUBLIC_API_URL= pnpm exec expo start`
// switches back to the local API without editing .env.
const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL =
  configured || (devHost ? `http://${devHost}:3010` : "http://localhost:3010");

/** Shop WhatsApp number — mirrors YelenV3/src/lib/whatsapp.ts. */
export const SHOP_WHATSAPP = "22392839788";
