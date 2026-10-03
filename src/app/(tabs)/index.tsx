import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Empty, Input, Loading } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { T } from "@/lib/theme";
import { formatFCFA, type Category, type Product } from "@/lib/types";

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api<Product[]>("/products"),
        api<Category[]>("/categories"),
      ]);
      setProducts(p);
      setCategories(c);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible.");
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() only sets state after awaiting the fetch
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  // Stock and prices come from the server; filtering stays on the device so
  // typing feels instant on a slow connection.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  }, [products, category, search]);

  if (products === null) return <Loading />;

  return (
    <FlatList
      data={visible}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: T.gap }}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={{ gap: T.gap, paddingBottom: T.gap }}>
          <View style={styles.banner}>
            <Ionicons name="bicycle" size={20} color="#fff" />
            <Text style={styles.bannerText}>Livraison gratuite partout à Bamako</Text>
          </View>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un produit…"
            returnKeyType="search"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[{ id: "all", name: "Tout", icon: "🛍️" }, ...categories].map((c) => {
                const active = category === (c.id === "all" ? "all" : c.name);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategory(c.id === "all" ? "all" : c.name)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && { color: "#fff" }]}>
                      {c.icon} {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <Empty emoji="🔍" title="Aucun produit" text="Essayez un autre mot ou une autre catégorie." />
      }
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}

function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;

  return (
    <Pressable
      onPress={() => router.push(`/produit/${product.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={150} />
      <View style={{ padding: 10, gap: 4 }}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatFCFA(product.price)}</Text>
        {soldOut ? (
          <Text style={styles.soldOut}>Rupture de stock</Text>
        ) : (
          <Pressable onPress={() => add(product)} style={styles.addButton}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addText}>Ajouter</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: T.pad, gap: T.gap, paddingBottom: 32 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: T.brand,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  chip: {
    borderWidth: 1,
    borderColor: T.line,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: T.text, borderColor: T.text },
  chipText: { fontSize: 13, color: T.muted, fontWeight: "600" },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.line,
    overflow: "hidden",
    marginBottom: T.gap,
  },
  image: { width: "100%", height: 140, backgroundColor: "#f1f5f9" },
  name: { fontSize: 13, fontWeight: "600", color: T.text, minHeight: 34 },
  price: { fontSize: 15, fontWeight: "800", color: T.brand },
  soldOut: { fontSize: 12, color: T.danger, fontWeight: "600", paddingVertical: 8 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: T.brand,
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 2,
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  error: { color: T.danger, fontSize: 13 },
});
