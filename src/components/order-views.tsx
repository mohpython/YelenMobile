import { StyleSheet, Text, View } from "react-native";
import { ORDER_STATUS, ORDER_STEPS, type AccountOrder, type OrderStatus } from "@/lib/order-status";
import { T } from "@/lib/theme";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Progress through pending → delivered, with the date each step was reached. */
export function Tracker({ order }: { order: AccountOrder }) {
  const reachedAt = new Map<OrderStatus, string>();
  for (const e of order.events) reachedAt.set(e.status, e.at);

  if (order.status === "cancelled") {
    const at = reachedAt.get("cancelled");
    return (
      <View style={styles.cancelled}>
        <Text style={styles.cancelledTitle}>Commande annulée</Text>
        <Text style={styles.cancelledText}>
          {at ? `Le ${dateTime(at)}. ` : ""}Écrivez-nous sur WhatsApp pour toute question.
        </Text>
      </View>
    );
  }

  const current = ORDER_STEPS.indexOf(order.status);

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.hint}>{ORDER_STATUS[order.status].hint}</Text>
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current;
        const at = done ? reachedAt.get(step) : undefined;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done ? { backgroundColor: T.green } : { backgroundColor: "#e2e8f0" },
                  i === current && styles.dotCurrent,
                ]}
              >
                <Text style={[styles.dotText, done && { color: "#fff" }]}>
                  {done ? "✓" : i + 1}
                </Text>
              </View>
              {i < ORDER_STEPS.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: i < current ? T.green : "#e2e8f0" },
                  ]}
                />
              )}
            </View>
            <View style={{ paddingBottom: 6 }}>
              <Text style={[styles.stepLabel, !done && { color: T.faint }]}>
                {ORDER_STATUS[step].label}
              </Text>
              {at ? <Text style={styles.stepDate}>{dateTime(at)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 13, color: T.muted },
  step: { flexDirection: "row", gap: 12 },
  rail: { alignItems: "center", width: 26 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dotCurrent: { borderWidth: 4, borderColor: "#d1fae5" },
  dotText: { fontSize: 12, fontWeight: "700", color: T.faint },
  connector: { width: 2, flex: 1, minHeight: 14 },
  stepLabel: { fontSize: 14, fontWeight: "600", color: T.text },
  stepDate: { fontSize: 12, color: T.muted },
  cancelled: { backgroundColor: "#fff1f2", borderRadius: 12, padding: 12, gap: 2 },
  cancelledTitle: { fontWeight: "700", color: "#be123c" },
  cancelledText: { fontSize: 13, color: "#9f1239" },
});
