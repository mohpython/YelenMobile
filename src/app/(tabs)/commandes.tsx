import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Tracker, StatusBadge, formatDate } from "@/components/order-views";
import { Button, Card, Empty, Loading } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AccountOrder } from "@/lib/order-status";
import { T } from "@/lib/theme";
import { formatFCFA } from "@/lib/types";
import { openWhatsApp } from "@/lib/whatsapp";

export default function OrdersScreen() {
  const { customer, token, ready } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }
    try {
      const { orders } = await api<{ orders: AccountOrder[] }>("/account/orders", { token });
      setOrders(orders);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible.");
      setOrders([]);
    }
  }, [token]);

  // Statuses change in the back-office, so reload every time the tab is opened.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!ready) return <Loading />;

  if (!customer) {
    return (
      <Empty
        emoji="📦"
        title="Suivez vos commandes"
        text="Connectez-vous avec votre numéro WhatsApp pour voir vos commandes et leur avancement."
        action={
          <Button title="Me connecter" onPress={() => router.push("/compte")} style={{ marginTop: 12 }} />
        }
      />
    );
  }

  if (orders === null) return <Loading />;

  if (orders.length === 0) {
    return (
      <Empty
        emoji="🛍️"
        title="Aucune commande"
        text="Vos commandes passées avec ce numéro apparaîtront ici."
        action={<Button title="Voir la boutique" onPress={() => router.replace("/")} style={{ marginTop: 12 }} />}
      />
    );
  }

  const expandedId = openId ?? orders[0]?.id;

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
        />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {orders.map((order) => {
        const open = expandedId === order.id;
        const count = order.items.reduce((s, i) => s + i.qty, 0);
        return (
          <Card key={order.id} style={{ gap: 12 }}>
            <Pressable
              onPress={() => setOpenId(open ? "" : order.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.reference}>#{order.reference}</Text>
                  <StatusBadge status={order.status} />
                </View>
                <Text style={styles.meta}>
                  {formatDate(order.createdAt)} · {count} article{count > 1 ? "s" : ""}
                </Text>
              </View>
              <Text style={styles.amount}>{formatFCFA(order.amount)}</Text>
            </Pressable>

            {open && (
              <View style={{ gap: 14, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 12 }}>
                <Tracker order={order} />

                {order.driver && (
                  <View style={styles.driver}>
                    <Text style={styles.driverText}>
                      Livreur : {order.driver.name} · {order.driver.phone}
                    </Text>
                  </View>
                )}

                <View style={{ gap: 6 }}>
                  {order.items.map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.qty} × {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>{formatFCFA(item.qty * item.price)}</Text>
                    </View>
                  ))}
                  <Text style={styles.address}>
                    📍 {order.address}
                    {order.city ? `, ${order.city}` : ""}
                  </Text>
                </View>

                <Button
                  title="Une question sur cette commande"
                  variant="outline"
                  onPress={() =>
                    openWhatsApp(
                      `Bonjour Yelen Service, je vous contacte au sujet de ma commande n° ${order.reference}.`
                    )
                  }
                />
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: T.pad, gap: T.gap, paddingBottom: 40 },
  reference: { fontSize: 15, fontWeight: "800", color: T.text },
  meta: { fontSize: 12, color: T.muted },
  amount: { fontSize: 15, fontWeight: "700", color: T.text },
  itemRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  itemName: { flex: 1, fontSize: 13, color: T.muted },
  itemPrice: { fontSize: 13, fontWeight: "600", color: T.text },
  address: { fontSize: 13, color: T.muted, marginTop: 4 },
  driver: { backgroundColor: "#fff7ed", borderRadius: 12, padding: 10 },
  driverText: { fontSize: 13, color: "#c2410c", fontWeight: "600" },
  error: { color: T.danger, fontSize: 13 },
});
