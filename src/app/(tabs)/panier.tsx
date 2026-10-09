import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Empty } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { T } from "@/lib/theme";
import { formatFCFA, formatShipping } from "@/lib/types";

// Bamako delivery is free; a regional fee is added at checkout once the
// customer picks their city.
const BAMAKO_SHIPPING = 0;

export default function CartScreen() {
  const { items, total, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <Empty
        emoji="🛒"
        title="Votre panier est vide"
        text="Parcourez la boutique et ajoutez vos produits préférés."
        action={
          <Button title="Aller à la boutique" onPress={() => router.replace("/")} style={{ marginTop: 12 }} />
        }
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {items.map((item) => (
        <Card key={item.product.id} style={styles.row}>
          <Image source={{ uri: item.product.image }} style={styles.thumb} contentFit="cover" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text numberOfLines={2} style={styles.name}>
              {item.product.name}
            </Text>
            <Text style={styles.price}>{formatFCFA(item.product.price)}</Text>
            <View style={styles.qtyRow}>
              <Pressable
                onPress={() => setQty(item.product.id, item.qty - 1)}
                style={styles.qtyButton}
              >
                <Ionicons name="remove" size={16} color={T.text} />
              </Pressable>
              <Text style={styles.qty}>{item.qty}</Text>
              <Pressable
                onPress={() => setQty(item.product.id, item.qty + 1)}
                style={styles.qtyButton}
              >
                <Ionicons name="add" size={16} color={T.text} />
              </Pressable>
              <Pressable onPress={() => remove(item.product.id)} style={{ marginLeft: "auto" }}>
                <Ionicons name="trash-outline" size={18} color={T.danger} />
              </Pressable>
            </View>
          </View>
        </Card>
      ))}

      <Card style={{ gap: 10 }}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>{formatFCFA(total)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Livraison</Text>
          <Text style={[styles.totalValue, { color: T.green }]}>
            {formatShipping(BAMAKO_SHIPPING)}
          </Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatFCFA(total + BAMAKO_SHIPPING)}</Text>
        </View>
        <Button title="Commander" onPress={() => router.push("/commande")} style={{ paddingVertical: 18 }} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: T.pad, gap: T.gap, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#f1f5f9" },
  name: { fontSize: 14, fontWeight: "600", color: T.text },
  price: { fontSize: 14, fontWeight: "700", color: T.brand },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.line,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: { fontSize: 14, fontWeight: "700", color: T.text, minWidth: 18, textAlign: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, color: T.muted },
  totalValue: { fontSize: 14, fontWeight: "600", color: T.text },
  grandTotal: { borderTopWidth: 1, borderTopColor: T.line, paddingTop: 10 },
  grandLabel: { fontSize: 16, fontWeight: "700", color: T.text },
  grandValue: { fontSize: 18, fontWeight: "800", color: T.brand },
});
