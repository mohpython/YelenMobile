import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { T } from "@/lib/theme";

export default function RootLayout() {
  // Tapping "Votre commande est confirmée" opens the order list.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      router.push(typeof url === "string" ? (url as "/commandes") : "/commandes");
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#fff" },
            headerTitleStyle: { color: T.text, fontWeight: "700" },
            headerTintColor: T.brand,
            contentStyle: { backgroundColor: T.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="produit/[id]" options={{ title: "Produit" }} />
          <Stack.Screen name="commande" options={{ title: "Finaliser ma commande" }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
