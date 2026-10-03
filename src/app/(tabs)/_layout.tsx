import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Text, View, type ColorValue } from "react-native";
import { useCart } from "@/lib/cart";
import { T } from "@/lib/theme";

/** Small orange bubble with the number of items, over the cart tab icon. */
function CartIcon({ color, size }: { color: ColorValue; size: number }) {
  const { count } = useCart();
  return (
    <View>
      <Ionicons name="cart-outline" size={size} color={color} />
      {count > 0 && (
        <View
          style={{
            position: "absolute",
            right: -8,
            top: -4,
            minWidth: 17,
            paddingHorizontal: 4,
            height: 17,
            borderRadius: 9,
            backgroundColor: T.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: T.brand,
        tabBarInactiveTintColor: T.faint,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { color: T.text, fontWeight: "700" },
        sceneStyle: { backgroundColor: T.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Boutique",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="panier"
        options={{
          title: "Panier",
          tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="commandes"
        options={{
          title: "Mes commandes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: "Mon compte",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
