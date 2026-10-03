import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

// Notifications arrive while the app is open too — a customer watching the
// order screen should still see "commande confirmée" land.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android groups notifications per channel; ours matches the server's channelId. */
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("orders", {
    name: "Suivi des commandes",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#ff5000",
  });
}

/**
 * Asks for permission, then tells the server which device to notify.
 * Returns the Expo push token, or null when push is unavailable (simulator,
 * permission refused, no network) — never throws: push is a bonus, the order
 * history in the app is the source of truth.
 */
export async function registerForPush(sessionToken: string): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // simulators cannot receive push
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    const granted =
      existing.granted ||
      (existing.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
    if (!granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null; // not linked to an EAS project yet

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api("/account/push", {
      method: "POST",
      token: sessionToken,
      body: { token, platform: Platform.OS === "ios" ? "ios" : "android" },
    });
    return token;
  } catch {
    return null;
  }
}

/** Stops notifications for this device when the customer signs out. */
export async function unregisterPush(sessionToken: string, pushToken: string) {
  await api(`/account/push?token=${encodeURIComponent(pushToken)}`, {
    method: "DELETE",
    token: sessionToken,
  }).catch(() => {});
}
