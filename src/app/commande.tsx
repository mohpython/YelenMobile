import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorNote, Field, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatPhone } from "@/lib/phone";
import { T } from "@/lib/theme";
import { formatFCFA, formatShipping, type DeliveryZone } from "@/lib/types";
import { buildOrderMessage, openWhatsApp } from "@/lib/whatsapp";

interface CreatedOrder {
  id: string;
  reference: string;
  amount: number;
}

export default function CheckoutScreen() {
  const { items, total, clear } = useCart();
  const { customer, token } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    api<DeliveryZone[]>("/zones").then(setZones).catch(() => {});
  }, []);

  // Signed-in customers start from their saved details, once per account;
  // anything they already typed is kept.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (customer && prefilledFor !== customer.id) {
    setPrefilledFor(customer.id);
    setForm((f) => ({
      ...f,
      name: f.name || customer.name,
      phone: f.phone || formatPhone(customer.phone),
      address: f.address || customer.address,
      city: f.city || customer.city,
    }));
  }

  // Bamako d'abord (livraison gratuite), les régions ensuite avec leur tarif.
  const cityGroups = useMemo(() => {
    const paid = zones.filter((z) => z.fee > 0);
    return {
      bamako: [...new Set(zones.filter((z) => z.fee <= 0).flatMap((z) => z.areas))].sort(),
      regions: [...new Set(paid.flatMap((z) => z.areas))].sort(),
      regionFee: paid[0]?.fee ?? 0,
    };
  }, [zones]);

  // Un client déjà connu relit ses informations au lieu de les retaper.
  const knownCustomer =
    !editingInfo && !!customer && !!(form.name && form.phone && form.address && form.city);

  const shipping = useMemo(() => {
    if (!form.city) return 0;
    return zones.find((z) => z.areas.includes(form.city))?.fee ?? 0;
  }, [zones, form.city]);

  async function submit() {
    setError("");
    if (form.name.trim().length < 2) return setError("Veuillez saisir votre nom complet.");
    if (!/^[\d\s+()-]{8,}$/.test(form.phone.trim()))
      return setError("Numéro de téléphone invalide.");
    if (!form.address.trim()) return setError("Veuillez saisir votre adresse de livraison.");
    if (!form.city) return setError("Veuillez choisir votre ville.");

    setBusy(true);
    try {
      // The order is saved first; WhatsApp is only the notification channel.
      const order = await api<CreatedOrder>("/orders", {
        method: "POST",
        token,
        body: {
          customerName: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          notes: form.notes,
          channel: "whatsapp",
          items: items.map((i) => ({ productId: i.product.id, qty: i.qty })),
        },
      });

      openWhatsApp(
        buildOrderMessage({
          reference: order.reference,
          items: items.map((i) => ({ name: i.product.name, qty: i.qty, price: i.product.price })),
          subtotal: total,
          shipping,
          customer: form,
        })
      );
      clear();
      router.replace("/commandes");
      Alert.alert(
        "Commande enregistrée",
        `Référence ${order.reference}. Suivez son avancement dans « Mes commandes ».`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Commande non enregistrée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: 14 }}>
        <Text style={styles.title}>Où livrer ?</Text>

        {knownCustomer ? (
          <View style={styles.recap}>
            <Text style={styles.recapName}>{form.name}</Text>
            <Text style={styles.recapLine}>{form.phone}</Text>
            <Text style={styles.recapLine}>
              {form.address}, {form.city}
            </Text>
            <Pressable onPress={() => setEditingInfo(true)}>
              <Text style={styles.recapEdit}>Livrer ailleurs</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Field label="Votre nom">
              <Input
                value={form.name}
                onChangeText={(name) => setForm({ ...form, name })}
                placeholder="Ex. Aminata Sangaré"
              />
            </Field>

            <Field label="Votre numéro WhatsApp">
              <Input
                value={form.phone}
                onChangeText={(phone) => setForm({ ...form, phone })}
                placeholder="+223 92 83 97 88"
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Votre quartier ou ville">
              <Pressable onPress={() => setCityOpen(true)} style={styles.select}>
                <Text style={form.city ? styles.selectValue : styles.selectPlaceholder}>
                  {form.city || "Choisir dans la liste…"}
                </Text>
                <Text style={styles.selectChevron}>⌄</Text>
              </Pressable>
            </Field>

            <Field label="Où habitez-vous ?">
              <Input
                value={form.address}
                onChangeText={(address) => setForm({ ...form, address })}
                placeholder="Ex. Magnambougou, rue 12, porte 45"
              />
            </Field>
          </>
        )}

        {showNotes ? (
          <Field label="Précision pour le livreur">
            <Input
              value={form.notes}
              onChangeText={(notes) => setForm({ ...form, notes })}
              placeholder="Un repère près de chez vous, une heure qui vous arrange…"
              multiline
              style={{ minHeight: 70, textAlignVertical: "top" }}
            />
          </Field>
        ) : (
          <Pressable onPress={() => setShowNotes(true)}>
            <Text style={styles.recapEdit}>Ajouter une précision pour le livreur</Text>
          </Pressable>
        )}
      </Card>

      <Modal visible={cityOpen} animationType="slide" transparent onRequestClose={() => setCityOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setCityOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Où livrer ?</Text>
          <ScrollView>
            <Text style={styles.sheetGroup}>Bamako — livraison gratuite</Text>
            {cityGroups.bamako.map((c) => (
              <CityRow
                key={c}
                city={c}
                active={form.city === c}
                onSelect={() => {
                  setForm({ ...form, city: c });
                  setCityOpen(false);
                }}
              />
            ))}
            {cityGroups.regions.length > 0 && (
              <>
                <Text style={styles.sheetGroup}>
                  Régions — livraison {formatFCFA(cityGroups.regionFee)}
                </Text>
                {cityGroups.regions.map((c) => (
                  <CityRow
                    key={c}
                    city={c}
                    active={form.city === c}
                    onSelect={() => {
                      setForm({ ...form, city: c });
                      setCityOpen(false);
                    }}
                  />
                ))}
              </>
            )}
          </ScrollView>
          <Button title="Fermer" variant="outline" onPress={() => setCityOpen(false)} />
        </View>
      </Modal>

      <Card style={{ gap: 10 }}>
        <Text style={styles.title}>Récapitulatif</Text>
        {items.map((i) => (
          <View key={i.product.id} style={styles.row}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {i.qty} × {i.product.name}
            </Text>
            <Text style={styles.rowValue}>{formatFCFA(i.qty * i.product.price)}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Livraison</Text>
          <Text style={[styles.rowValue, shipping <= 0 && { color: T.green }]}>
            {formatShipping(shipping)}
          </Text>
        </View>
        <View style={[styles.row, styles.grand]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatFCFA(total + shipping)}</Text>
        </View>
      </Card>

      {error ? <ErrorNote message={error} /> : null}

      <Button
        title={busy ? "Enregistrement…" : "Commander"}
        busy={busy}
        onPress={submit}
        style={{ paddingVertical: 18 }}
      />
      <Text style={styles.footnote}>
        WhatsApp s&apos;ouvrira pour confirmer votre commande.
      </Text>
      {!customer && (
        <Text style={styles.footnote}>
          Créez un compte dans l&apos;onglet « Mon compte » pour suivre vos commandes.
        </Text>
      )}
    </ScrollView>
  );
}

function CityRow({
  city,
  active,
  onSelect,
}: {
  city: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable onPress={onSelect} style={styles.sheetRow}>
      <Text style={[styles.sheetRowText, active && { color: T.brand, fontWeight: "700" }]}>
        {city}
      </Text>
      {active && <Text style={{ color: T.brand, fontSize: 16 }}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { padding: T.pad, gap: T.gap, paddingBottom: 40 },
  title: { fontSize: 15, fontWeight: "700", color: T.text },
  cities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  city: {
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cityActive: { backgroundColor: T.brand, borderColor: T.brand },
  cityText: { fontSize: 13, color: T.muted, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: T.muted },
  rowValue: { fontSize: 14, fontWeight: "600", color: T.text },
  grand: { borderTopWidth: 1, borderTopColor: T.line, paddingTop: 10 },
  grandLabel: { fontSize: 16, fontWeight: "700", color: T.text },
  grandValue: { fontSize: 18, fontWeight: "800", color: T.brand },
  footnote: { fontSize: 12, color: T.muted, textAlign: "center" },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  selectValue: { fontSize: 15, color: T.text },
  selectPlaceholder: { fontSize: 15, color: T.faint },
  selectChevron: { fontSize: 18, color: T.muted, marginTop: -6 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: T.pad,
    gap: 8,
    maxHeight: "70%",
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: T.text },
  sheetGroup: {
    fontSize: 12,
    fontWeight: "700",
    color: T.muted,
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.line,
  },
  sheetRowText: { fontSize: 16, color: T.text },
  recap: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, gap: 4 },
  recapName: { fontSize: 16, fontWeight: "700", color: T.text },
  recapLine: { fontSize: 14, color: T.muted },
  recapEdit: { fontSize: 14, fontWeight: "700", color: T.brand, marginTop: 6 },
});
