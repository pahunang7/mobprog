import { useClaims } from "@/contexts/claims-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNav from "./BottomNav";
import { REGISTRY_ITEMS } from "./registry-data";

export default function MyClaimsScreen() {
  const { claims, cancelClaim } = useClaims();

  // Alert.alert with buttons doesn't work on web, so we use our own confirm dialog
  const [pending, setPending] = useState<{ id: string; title: string } | null>(null);

  const confirmCancel = (id: string, title: string) => setPending({ id, title });

  const handleConfirm = () => {
    if (pending) cancelClaim(pending.id); // removes the claim -> item goes back to "Claim Now" in the feed
    setPending(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Claims</Text>
        <Text style={styles.headerSubtitle}>Bring your student ID to the Security Desk to collect approved items.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {claims.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No claims yet</Text>
            <Text style={styles.emptyText}>Tap “Claim Now” on an item in the feed and it will show up here.</Text>
            <Pressable style={styles.browseBtn} onPress={() => router.navigate("/(tabs)" as never)}>
              <Text style={styles.browseText}>Browse the feed</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {claims.map((c) => {
              const source = REGISTRY_ITEMS.find((i) => i.id === c.id);
              return (
                <View key={c.id} style={styles.card}>
                  <View style={[styles.thumb, { backgroundColor: source?.iconBg ?? "#e2e8f0" }]}>
                    <Ionicons name={source?.iconName ?? "cube-outline"} size={22} color={source?.iconColor ?? "#475569"} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.metaRow}>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusText}>{c.status}</Text>
                      </View>
                      <Text style={styles.time}>{new Date(c.claimedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</Text>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    {source ? (
                      <View style={styles.locRow}>
                        <Ionicons name="location-outline" size={11} color="#999" />
                        <Text style={styles.locText} numberOfLines={1}>
                          {source.location}
                        </Text>
                      </View>
                    ) : null}
                    {c.deskLabel ? <Text style={styles.desk}>Verify at: {c.deskLabel}</Text> : null}
                  </View>
                  <Pressable style={styles.cancelBtn} onPress={() => confirmCancel(c.id, c.title)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav active="claims" />

      <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => setPending(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Cancel this claim?</Text>
            <Text style={styles.dialogBody}>{pending ? `Your claim for "${pending.title}" will be withdrawn and the item goes back to the feed.` : ""}</Text>
            <View style={styles.dialogActions}>
              <Pressable style={styles.keepBtn} onPress={() => setPending(null)}>
                <Text style={styles.keepText}>Keep claim</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Yes, cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f5f7" },
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerSubtitle: { fontSize: 11, color: "#888", marginTop: 2 },
  content: { padding: 16, paddingBottom: 24 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, padding: 10, borderWidth: 1, borderColor: "#f0f0f0" },
  thumb: { width: 52, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusPill: { backgroundColor: "#ffedd5", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1 },
  statusText: { fontSize: 9, fontWeight: "700", color: "#c2410c" },
  time: { fontSize: 10, color: "#999" },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locText: { fontSize: 10, color: "#888", flexShrink: 1 },
  desk: { fontSize: 10, color: "#aaa", fontStyle: "italic" },
  cancelBtn: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  cancelText: { fontSize: 11, fontWeight: "700", color: "#dc2626" },
  empty: { alignItems: "center", gap: 6, paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginTop: 6 },
  emptyText: { fontSize: 12, color: "#888", textAlign: "center" },
  browseBtn: { backgroundColor: "#f97316", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 14 },
  browseText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  dialogBackdrop: { flex: 1, backgroundColor: "rgba(15,15,25,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 340, backgroundColor: "#fff", borderRadius: 16, padding: 18 },
  dialogTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  dialogBody: { fontSize: 12, color: "#666", marginTop: 6, lineHeight: 17 },
  dialogActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  keepBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#f1f5f9" },
  keepText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  confirmBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#dc2626" },
  confirmText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
