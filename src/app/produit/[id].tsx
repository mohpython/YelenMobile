import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Empty, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { T } from "@/lib/theme";
import { formatFCFA, formatShipping, type DeliveryZone, type Product } from "@/lib/types";
import { openWhatsApp } from "@/lib/whatsapp";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    // The endpoint returns the product plus its approved reviews.
    api<Product & { reviews: unknown[] }>(`/products/${id}`)
      .then((p) => {
        setProduct(p);
        navigation.setOptions({ title: p.name });
      })
      .catch(() => setMissing(true));
    api<DeliveryZone[]>("/zones").then(setZones).catch(() => {});
  }, [id, navigation]);

  if (missing) {
    return <Empty emoji="📦" title="Produit introuvable" text="Ce produit n'est plus disponible." />;
  }
  if (!product) return <Loading />;

  const soldOut = product.stock <= 0;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={150} />

      <View style={{ gap: 6 }}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatFCFA(product.price)}</Text>
        <Text style={styles.stock}>
          {soldOut ? "Rupture de stock" : `En stock : ${product.stock} disponible(s)`}
        </Text>
      </View>

      <Card style={{ gap: 10 }}>
        <Text style={styles.sectionTitle}>Livraison</Text>
        {zones.map((z) => (
          <View key={z.id} style={styles.zoneRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.zoneName}>{z.name}</Text>
              <Text style={styles.zoneAreas} numberOfLines={1}>
                {z.areas.join(", ")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.zoneFee, z.fee <= 0 && { color: T.green }]}>
                {formatShipping(z.fee)}
              </Text>
              <Text style={styles.zoneDelay}>{z.delay}</Text>
            </View>
          </View>
        ))}
      </Card>

      <View style={{ gap: 10 }}>
        <Button
          title={soldOut ? "Produit indisponible" : "Ajouter au panier"}
          disabled={soldOut}
          onPress={() => {
            add(product);
            router.push("/panier");
          }}
        />
        <Button
          title="Commander sur WhatsApp"
          variant="whatsapp"
          onPress={() =>
            openWhatsApp(
              `Bonjour Yelen Service, je souhaite commander :\n\n- 1× ${product.name} — ${formatFCFA(product.price)}\n\nMerci de me confirmer la disponibilité.`
            )
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: T.pad, gap: T.pad, paddingBottom: 40 },
  image: { width: "100%", height: 260, borderRadius: T.radius, backgroundColor: "#f1f5f9" },
  category: { fontSize: 12, fontWeight: "700", color: T.brand, textTransform: "uppercase" },
  name: { fontSize: 20, fontWeight: "800", color: T.text },
  price: { fontSize: 24, fontWeight: "800", color: T.brand },
  stock: { fontSize: 13, color: T.muted },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: T.text },
  zoneRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  zoneName: { fontSize: 14, fontWeight: "600", color: T.text },
  zoneAreas: { fontSize: 12, color: T.faint },
  zoneFee: { fontSize: 14, fontWeight: "700", color: T.text },
  zoneDelay: { fontSize: 11, color: T.faint },
});
