import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { T } from "@/lib/theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  busy,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "whatsapp";
  disabled?: boolean;
  busy?: boolean;
  style?: object;
}) {
  const palette = {
    primary: { bg: T.brand, fg: "#fff", border: T.brand },
    outline: { bg: "#fff", fg: T.text, border: T.line },
    whatsapp: { bg: T.whatsapp, fg: "#fff", border: T.whatsapp },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (disabled || busy) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {busy && <ActivityIndicator color={palette.fg} size="small" />}
      <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={T.faint}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

/** 4-digit PIN box: numeric, masked, wide letter spacing. */
export function PinInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      value={value}
      onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 4))}
      keyboardType="number-pad"
      secureTextEntry
      maxLength={4}
      placeholder="••••"
      style={styles.pin}
    />
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Empty({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={T.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: T.text },
  hint: { fontSize: 12, color: T.faint },
  input: {
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: T.text,
    backgroundColor: "#fff",
  },
  pin: { textAlign: "center", fontSize: 20, letterSpacing: 10 },
  error: { backgroundColor: "#fff1f2", borderRadius: 12, padding: 12 },
  errorText: { color: "#be123c", fontSize: 13 },
  card: {
    backgroundColor: T.card,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.line,
    padding: T.pad,
  },
  empty: { alignItems: "center", gap: 8, paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: T.text },
  emptyText: { fontSize: 14, color: T.muted, textAlign: "center" },
  loading: { paddingVertical: 48, alignItems: "center" },
});
