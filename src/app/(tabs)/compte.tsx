import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorNote, Field, Input, Loading, PinInput } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { T } from "@/lib/theme";
import type { DeliveryZone } from "@/lib/types";

export default function AccountScreen() {
  const { customer, ready } = useAuth();
  if (!ready) return <Loading />;
  return customer ? <Profile /> : <AuthForm />;
}

/* ---------------- Sign in / sign up ---------------- */

function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError("");
    setPin("");
    setPinConfirm("");
  }

  async function submit() {
    setError("");
    if (mode === "register") {
      if (name.trim().length < 2) return setError("Veuillez saisir votre nom.");
      if (pin !== pinConfirm) return setError("Les deux codes ne correspondent pas.");
    }
    if (!/^\d{4}$/.test(pin)) return setError("Le code doit contenir 4 chiffres.");

    setBusy(true);
    try {
      if (mode === "register") await register(name, phone, pin);
      else await login(phone, pin);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
      if (err instanceof ApiError && err.status === 409) switchMode("login");
      if (err instanceof ApiError && err.status === 404) switchMode("register");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: "center", gap: 6, paddingVertical: 8 }}>
        <Text style={{ fontSize: 40 }}>👤</Text>
        <Text style={styles.title}>Mon compte</Text>
        <Text style={styles.subtitle}>
          Suivez vos commandes et retrouvez votre historique d&apos;achats.
        </Text>
      </View>

      <Card style={{ gap: 14 }}>
        <View style={styles.switch}>
          {(["login", "register"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => switchMode(m)}
              style={[styles.switchItem, mode === m && styles.switchItemActive]}
            >
              <Text style={[styles.switchText, mode === m && { color: T.text }]}>
                {m === "login" ? "Se connecter" : "Créer un compte"}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "register" && (
          <Field label="Nom complet">
            <Input value={name} onChangeText={setName} placeholder="Ex. Aminata Sangaré" />
          </Field>
        )}

        <Field label="Numéro WhatsApp">
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="+223 92 83 97 88"
            keyboardType="phone-pad"
          />
        </Field>

        <Field
          label={mode === "register" ? "Choisissez un code à 4 chiffres" : "Code à 4 chiffres"}
          hint={mode === "register" ? "Ce code vous sera demandé à chaque connexion." : undefined}
        >
          <PinInput value={pin} onChange={setPin} />
        </Field>

        {mode === "register" && (
          <Field label="Confirmez le code">
            <PinInput value={pinConfirm} onChange={setPinConfirm} />
          </Field>
        )}

        {error ? <ErrorNote message={error} /> : null}

        <Button
          title={mode === "login" ? "Se connecter" : "Créer mon compte"}
          busy={busy}
          onPress={submit}
        />
        {mode === "login" && (
          <Text style={styles.footnote}>
            Code oublié ? Écrivez-nous sur WhatsApp, nous le réinitialiserons.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

/* ---------------- Signed in ---------------- */

function Profile() {
  const { customer, logout, updateProfile, changePin } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [form, setForm] = useState({
    name: customer!.name,
    address: customer!.address,
    city: customer!.city,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [pins, setPins] = useState({ current: "", next: "", confirm: "" });
  const [savingPin, setSavingPin] = useState(false);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    api<DeliveryZone[]>("/zones").then(setZones).catch(() => {});
  }, []);

  const cities = useMemo(() => [...new Set(zones.flatMap((z) => z.areas))].sort(), [zones]);

  async function saveProfile() {
    setProfileError("");
    setSavingProfile(true);
    try {
      await updateProfile(form);
      Alert.alert("Profil enregistré");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePin() {
    setPinError("");
    if (!/^\d{4}$/.test(pins.next)) return setPinError("Le nouveau code doit contenir 4 chiffres.");
    if (pins.next !== pins.confirm) return setPinError("Les deux nouveaux codes ne correspondent pas.");
    setSavingPin(true);
    try {
      await changePin(pins.current, pins.next);
      setPins({ current: "", next: "", confirm: "" });
      Alert.alert("Code modifié", "Vos autres appareils ont été déconnectés.");
    } catch (err) {
      setPinError(err instanceof ApiError ? err.message : "Modification impossible.");
    } finally {
      setSavingPin(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer!.name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{customer!.name}</Text>
          <Text style={styles.subtitle}>{formatPhone(customer!.phone)}</Text>
        </View>
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={styles.sectionTitle}>Mes informations</Text>
        <Field label="Nom complet">
          <Input value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        </Field>
        <Field label="Ville">
          <View style={styles.cities}>
            {cities.map((c) => {
              const active = form.city === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setForm({ ...form, city: c })}
                  style={[styles.city, active && styles.cityActive]}
                >
                  <Text style={[styles.cityText, active && { color: "#fff" }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Field label="Adresse par défaut" hint="Pré-remplie lors de vos prochaines commandes.">
          <Input
            value={form.address}
            onChangeText={(address) => setForm({ ...form, address })}
            placeholder="Ex. Magnambougou, rue 12, porte 45"
          />
        </Field>
        {profileError ? <ErrorNote message={profileError} /> : null}
        <Button title="Enregistrer" busy={savingProfile} onPress={saveProfile} />
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={styles.sectionTitle}>Code de connexion</Text>
        <Field label="Code actuel">
          <PinInput value={pins.current} onChange={(current) => setPins({ ...pins, current })} />
        </Field>
        <Field label="Nouveau code">
          <PinInput value={pins.next} onChange={(next) => setPins({ ...pins, next })} />
        </Field>
        <Field label="Confirmation">
          <PinInput value={pins.confirm} onChange={(confirm) => setPins({ ...pins, confirm })} />
        </Field>
        {pinError ? <ErrorNote message={pinError} /> : null}
        <Button title="Changer le code" variant="outline" busy={savingPin} onPress={savePin} />
      </Card>

      <Button title="Se déconnecter" variant="outline" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: T.pad, gap: T.gap, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "800", color: T.text },
  subtitle: { fontSize: 13, color: T.muted, textAlign: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: T.text },
  switch: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 12, padding: 4 },
  switchItem: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9 },
  switchItemActive: { backgroundColor: "#fff" },
  switchText: { fontSize: 13, fontWeight: "700", color: T.muted },
  footnote: { fontSize: 12, color: T.faint, textAlign: "center" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  name: { fontSize: 17, fontWeight: "800", color: T.text },
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
});
