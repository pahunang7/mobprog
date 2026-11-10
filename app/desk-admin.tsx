import { useAuth } from "@/contexts/auth-context";
import { Claim, useClaims } from "@/contexts/claims-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomNav from "./BottomNav";
import { REGISTRY_ITEMS } from "./registry-data";

type Tab = "pending" | "found" | "archive";
type Confirm = { type: "approve" | "reject"; claim: Claim } | null;

const claimKey = (c: Claim) => `${c.ownerId}:${c.id}`;
const ticketCode = (id: string) => `#LF-${9000 + Number(id || 0)}`;

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function titleCase(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DeskAdminScreen() {
  const { user, logout } = useAuth();
  const { allClaims, reviewClaim } = useClaims();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [proofClaim, setProofClaim] = useState<Claim | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const officerName = user?.name ? titleCase(user.name) : "Desk Officer";

  const pending = useMemo(() => allClaims.filter((c) => c.status === "Under review"), [allClaims]);
  const processed = useMemo(() => allClaims.filter((c) => c.status !== "Under review").sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0)), [allClaims]);

  const q = search.trim().toLowerCase();
  const matches = (c: Claim) =>
    !q || c.title.toLowerCase().includes(q) || ticketCode(c.id).toLowerCase().includes(q) || c.studentId.toLowerCase().includes(q) || c.claimantName.toLowerCase().includes(q);
  const shownPending = pending.filter(matches);
  const shownProcessed = processed.filter(matches);
  const shownFound = REGISTRY_ITEMS.filter((i) => !q || i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));

  const sourceOf = (id: string) => REGISTRY_ITEMS.find((i) => i.id === id);

  const runConfirm = () => {
    if (!confirm) return;
    reviewClaim(confirm.claim, confirm.type === "approve" ? "Approved" : "Rejected", officerName);
    setConfirm(null);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login" as never);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>USTP Lost & Found</Text>
            <Text style={styles.headerSubtitle}>DESK ADMIN CONSOLE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#111" />
            {pending.length > 0 && <View style={styles.notifDot} />}
          </View>
          <Pressable onPress={() => router.push("/profile" as never)} hitSlop={8}>
            <Ionicons name="person-circle-outline" size={24} color="#111" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Officer card */}
        <View style={styles.officerCard}>
          <View style={styles.officerAvatar}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Text style={styles.officerName}>Officer {officerName}</Text>
            <Text style={styles.officerRole}>USTP Campus Security & Custody Desk</Text>
          </View>
          <View style={styles.supervisorPill}>
            <Text style={styles.supervisorPillText}>SUPERVISOR</Text>
          </View>
          <View style={styles.stationPill}>
            <View style={styles.stationDot} />
            <Text style={styles.stationPillText}>Station #04</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={17} color="#888" style={{ marginRight: 8 }} />
          <TextInput style={styles.searchInput} placeholder="Search ticket, ID number, or item..." placeholderTextColor="#999" value={search} onChangeText={setSearch} />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color="#bbb" />
            </Pressable>
          ) : (
            <Ionicons name="options-outline" size={17} color="#111" />
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LOST</Text>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statDeltaUp}>+12 wk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>FOUND</Text>
            <Text style={styles.statValue}>189</Text>
            <Text style={styles.statDeltaUp}>+18 wk</Text>
          </View>
          <View style={[styles.statCard, pending.length > 0 && styles.statCardHot]}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>{pending.length}</Text>
            <Text style={styles.statDeltaAction}>Action</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RETURNED</Text>
            <Text style={styles.statValue}>124</Text>
            <Text style={styles.statDeltaRate}>87% rate</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={{ flexGrow: 0 }}>
          <Pressable style={[styles.tabButton, tab === "pending" && styles.tabButtonActive]} onPress={() => setTab("pending")}>
            <Text style={tab === "pending" ? styles.tabButtonTextActive : styles.tabButtonText}>Pending Claims</Text>
            {pending.length > 0 && (
              <View style={styles.tabDot}>
                <Text style={styles.tabDotText}>{pending.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "found" && styles.tabButtonActive]} onPress={() => setTab("found")}>
            <Text style={tab === "found" ? styles.tabButtonTextActive : styles.tabButtonText}>Found Items ({REGISTRY_ITEMS.length})</Text>
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "archive" && styles.tabButtonActive]} onPress={() => setTab("archive")}>
            <Text style={tab === "archive" ? styles.tabButtonTextActive : styles.tabButtonText}>Archive ({processed.length})</Text>
          </Pressable>
        </ScrollView>

        {/* ---- Pending claims ---- */}
        {tab === "pending" && (
          <>
            <View style={styles.queueHeaderRow}>
              <Text style={styles.queueTitle}>Custody Verification Queue</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{shownPending.length} pending</Text>
              </View>
            </View>

            {shownPending.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-done-circle-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyTitle}>{q ? "No claims match your search" : "Queue is clear"}</Text>
                <Text style={styles.emptyText}>{q ? "Try a different ticket, ID or item name." : "Claims submitted by students will appear here for verification."}</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {shownPending.map((c) => {
                  const src = sourceOf(c.id);
                  const hasProof = !!c.proofName;
                  return (
                    <View key={claimKey(c)} style={styles.queueCard}>
                      <View style={styles.queueCardTop}>
                        <View style={[styles.queueThumb, { backgroundColor: src?.iconBg ?? "#e2e8f0" }]}>
                          <Ionicons name={src?.iconName ?? "cube-outline"} size={20} color={src?.iconColor ?? "#475569"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.queueCodeRow}>
                            <Text style={styles.queueCode}>{ticketCode(c.id)}</Text>
                            <View style={[styles.statusPill, { backgroundColor: hasProof ? "#dbeafe" : "#fef3c7" }]}>
                              <Text style={[styles.statusPillText, { color: hasProof ? "#1d4ed8" : "#b45309" }]}>{hasProof ? "Proof Uploaded" : "Awaiting Verification"}</Text>
                            </View>
                          </View>
                          <Text style={styles.queueItemTitle}>{c.title}</Text>
                          <Text style={styles.queueMeta}>
                            Claimant: {titleCase(c.claimantName)} (ID: {c.studentId})
                          </Text>
                          <Text style={styles.queueMeta}>
                            {src?.location ?? "Security Desk"} • {timeAgo(c.claimedAt)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionRow}>
                        <Pressable style={styles.viewProofButton} onPress={() => setProofClaim(c)}>
                          <Ionicons name="eye-outline" size={13} color="#333" />
                          <Text style={styles.viewProofText}>View Proof ({hasProof ? 1 : 0})</Text>
                        </Pressable>
                        <Pressable style={styles.rejectButton} onPress={() => setConfirm({ type: "reject", claim: c })}>
                          <Ionicons name="close" size={13} color="#dc2626" />
                          <Text style={styles.rejectText}>Reject</Text>
                        </Pressable>
                        <Pressable style={styles.approveButton} onPress={() => setConfirm({ type: "approve", claim: c })}>
                          <Ionicons name="checkmark" size={13} color="#fff" />
                          <Text style={styles.approveText}>Approve</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ---- Found items ---- */}
        {tab === "found" && (
          <View style={{ gap: 10 }}>
            {shownFound.length === 0 ? (
              <Text style={styles.emptyText}>No items match your search.</Text>
            ) : (
              shownFound.map((i) => {
                const open = allClaims.filter((c) => c.id === i.id && c.status === "Under review").length;
                return (
                  <View key={i.id} style={styles.simpleCard}>
                    <View style={[styles.queueThumb, { backgroundColor: i.iconBg }]}>
                      <Ionicons name={i.iconName} size={20} color={i.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.queueCode}>{ticketCode(i.id)}</Text>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>
                        {i.title}
                      </Text>
                      <Text style={styles.queueMeta}>
                        {i.location} • {i.timeAgo}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: i.status === "claimed" ? "#e0e7ff" : open ? "#ffedd5" : "#fef3c7" }]}>
                      <Text style={[styles.statusPillText, { color: i.status === "claimed" ? "#4338ca" : open ? "#c2410c" : "#b45309" }]}>
                        {i.status === "claimed" ? "Returned" : open ? `${open} claim${open > 1 ? "s" : ""}` : "Unclaimed"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ---- Archive ---- */}
        {tab === "archive" && (
          <View style={{ gap: 10 }}>
            {shownProcessed.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="archive-outline" size={28} color="#94a3b8" />
                <Text style={styles.emptyTitle}>Nothing archived yet</Text>
                <Text style={styles.emptyText}>Approved and rejected claims are kept here.</Text>
              </View>
            ) : (
              shownProcessed.map((c) => {
                const ok = c.status === "Approved";
                return (
                  <View key={claimKey(c)} style={styles.simpleCard}>
                    <View style={[styles.queueThumb, { backgroundColor: ok ? "#dcfce7" : "#fee2e2" }]}>
                      <Ionicons name={ok ? "checkmark-circle" : "close-circle"} size={22} color={ok ? "#16a34a" : "#dc2626"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.queueCode}>{ticketCode(c.id)}</Text>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>
                        {c.title}
                      </Text>
                      <Text style={styles.queueMeta}>
                        {titleCase(c.claimantName)} (ID: {c.studentId})
                      </Text>
                      <Text style={styles.queueMeta}>
                        {c.status} by {c.reviewedBy ?? "Desk"} • {c.reviewedAt ? timeAgo(c.reviewedAt) : ""}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: ok ? "#dcfce7" : "#fee2e2" }]}>
                      <Text style={[styles.statusPillText, { color: ok ? "#15803d" : "#b91c1c" }]}>{c.status}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Session row */}
        <View style={styles.sessionRow}>
          <View style={styles.sessionDot} />
          <Text style={styles.sessionText}>Session #04-Secured</Text>
          <Pressable style={styles.logoutLink} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={14} color="#dc2626" />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomNav active="desk" />

      {/* Proof viewer */}
      <Modal visible={!!proofClaim} transparent animationType="fade" onRequestClose={() => setProofClaim(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            {proofClaim && (
              <>
                <View style={styles.dialogHeader}>
                  <Text style={styles.dialogTitle}>Ownership proof</Text>
                  <Pressable onPress={() => setProofClaim(null)} hitSlop={10}>
                    <Ionicons name="close" size={18} color="#888" />
                  </Pressable>
                </View>
                <Text style={styles.proofItem}>{proofClaim.title}</Text>
                <Text style={styles.proofLabel}>Claimant</Text>
                <Text style={styles.proofValue}>
                  {titleCase(proofClaim.claimantName)} (ID: {proofClaim.studentId})
                </Text>
                <Text style={styles.proofLabel}>Ownership details & distinct marks</Text>
                <Text style={styles.proofValue}>{proofClaim.ownership}</Text>
                <Text style={styles.proofLabel}>Uploaded file</Text>
                <View style={styles.filePill}>
                  <Ionicons name="document-text-outline" size={15} color="#dc2626" />
                  <Text style={styles.filePillText}>{proofClaim.proofName ?? "No file uploaded"}</Text>
                </View>
                <Text style={styles.proofNote}>Image preview isn't available yet - the upload is a placeholder until file storage is connected.</Text>
                <Pressable style={styles.closeBtn} onPress={() => setProofClaim(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Approve / reject confirmation (custom dialog so it works on web too) */}
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            {confirm && (
              <>
                <Text style={styles.dialogTitle}>{confirm.type === "approve" ? "Approve claim?" : "Reject claim?"}</Text>
                <Text style={styles.dialogBody}>
                  {confirm.type === "approve"
                    ? `Confirm ${titleCase(confirm.claim.claimantName)} as the verified owner of "${confirm.claim.title}". Any other pending claims on this item will be rejected.`
                    : `This rejects ${titleCase(confirm.claim.claimantName)}'s claim on "${confirm.claim.title}". The student will see it as Rejected.`}
                </Text>
                <View style={styles.dialogActions}>
                  <Pressable style={styles.keepBtn} onPress={() => setConfirm(null)}>
                    <Text style={styles.keepText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.confirmBtn, { backgroundColor: confirm.type === "approve" ? "#16a34a" : "#dc2626" }]} onPress={runConfirm}>
                    <Text style={styles.confirmText}>{confirm.type === "approve" ? "Approve" : "Reject"}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f5f7" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoCircle: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  headerSubtitle: { fontSize: 9, color: "#f97316", fontWeight: "700", letterSpacing: 0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconButton: { position: "relative" },
  notifDot: { position: "absolute", top: -1, right: -1, width: 7, height: 7, borderRadius: 4, backgroundColor: "#f97316" },

  scrollContent: { padding: 16, paddingBottom: 24 },

  officerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  officerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center" },
  officerName: { fontSize: 14, fontWeight: "700", color: "#111" },
  officerRole: { fontSize: 10.5, color: "#888" },
  supervisorPill: { backgroundColor: "#fef3c7", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  supervisorPillText: { fontSize: 9, fontWeight: "700", color: "#a16207" },
  stationPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  stationDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#16a34a" },
  stationPillText: { fontSize: 9, fontWeight: "700", color: "#15803d" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#111" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { flexBasis: "47%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 2, borderWidth: 1, borderColor: "transparent" },
  statCardHot: { borderColor: "#fdba74" },
  statLabel: { fontSize: 9, fontWeight: "700", color: "#999", letterSpacing: 0.4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111" },
  statDeltaUp: { fontSize: 10, color: "#16a34a" },
  statDeltaAction: { fontSize: 10, color: "#dc2626", fontWeight: "700" },
  statDeltaRate: { fontSize: 10, color: "#888" },

  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tabButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  tabButtonActive: { backgroundColor: "#111" },
  tabButtonText: { fontSize: 11, fontWeight: "600", color: "#333" },
  tabButtonTextActive: { fontSize: 11, fontWeight: "700", color: "#fff" },
  tabDot: { backgroundColor: "#f97316", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  tabDotText: { fontSize: 9, color: "#fff", fontWeight: "700" },

  queueHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  queueTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  pendingBadge: { backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  pendingBadgeText: { fontSize: 10, fontWeight: "700", color: "#a16207" },

  queueCard: { backgroundColor: "#fff", borderRadius: 14, padding: 12, gap: 10 },
  simpleCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, padding: 12 },
  queueCardTop: { flexDirection: "row", gap: 10 },
  queueThumb: { width: 46, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  queueCodeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" },
  queueCode: { fontSize: 11, fontWeight: "700", color: "#f97316" },
  statusPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  statusPillText: { fontSize: 9, fontWeight: "700" },
  queueItemTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  queueMeta: { fontSize: 10.5, color: "#888", marginTop: 1 },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewProofButton: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  viewProofText: { fontSize: 11, color: "#333", fontWeight: "600" },
  rejectButton: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  rejectText: { fontSize: 11, color: "#dc2626", fontWeight: "600" },
  approveButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#16a34a", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginLeft: "auto" },
  approveText: { fontSize: 11, color: "#fff", fontWeight: "700" },

  emptyBox: { alignItems: "center", gap: 6, paddingVertical: 36, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#334155" },
  emptyText: { fontSize: 12, color: "#94a3b8", textAlign: "center" },

  sessionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 24, marginBottom: 10, backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16a34a" },
  sessionText: { fontSize: 11, color: "#888" },
  logoutLink: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4 },
  logoutText: { fontSize: 11, color: "#dc2626", fontWeight: "700" },

  dialogBackdrop: { flex: 1, backgroundColor: "rgba(15,15,25,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 360, backgroundColor: "#fff", borderRadius: 16, padding: 18 },
  dialogHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  dialogTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  dialogBody: { fontSize: 12, color: "#666", marginTop: 6, lineHeight: 17 },
  dialogActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  keepBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#f1f5f9" },
  keepText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  confirmBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  confirmText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  proofItem: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 8 },
  proofLabel: { fontSize: 10, fontWeight: "700", color: "#94a3b8", marginTop: 8 },
  proofValue: { fontSize: 12, color: "#111", marginTop: 2, lineHeight: 17 },
  filePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4 },
  filePillText: { fontSize: 11, color: "#333" },
  proofNote: { fontSize: 10, color: "#94a3b8", marginTop: 8, lineHeight: 14 },
  closeBtn: { marginTop: 14, borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#111" },
  closeBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
