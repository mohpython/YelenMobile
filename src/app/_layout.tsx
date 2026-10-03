import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { T } from "@/lib/theme";

export default function RootLayout() {
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
