import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type QueueStatus = "awaiting" | "proof_uploaded" | "overdue";

type QueueItem = {
  id: string;
  code: string;
  status: QueueStatus;
  title: string;
  claimant: string;
  claimantId: string;
  location: string;
  timeAgo: string;
  proofCount: number;
  iconName: keyof typeof Ionicons.glyphMap;
  overdueNote?: string;
};

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: "1",
    code: "#LF-9021",
    status: "awaiting",
    title: "MacBook Air M1 Space Gray",
    claimant: "Mark Anthony",
    claimantId: "2020-10492",
    location: "ICT Bldg Rm 204",
    timeAgo: "2h ago",
    proofCount: 2,
    iconName: "laptop-outline",
  },
  {
    id: "2",
    code: "#LF-9024",
    status: "proof_uploaded",
    title: "Hydro Flask 32oz Yellow",
    claimant: "Sarah Lee",
    claimantId: "2022-30114",
    location: "Gymnasium Bleachers",
    timeAgo: "4h ago",
    proofCount: 1,
    iconName: "water-outline",
  },
  {
    id: "3",
    code: "#LF-9018",
    status: "overdue",
    title: "Casio fx-991EX Calculator",
    claimant: "",
    claimantId: "",
    location: "Engineering Complex Rm 108",
    timeAgo: "",
    proofCount: 0,
    iconName: "calculator-outline",
    overdueNote: "Custody Transfer Ready • No claim",
  },
];

const STATUS_META: Record<QueueStatus, { label: string; bg: string; fg: string }> = {
  awaiting: { label: "Awaiting Verification", bg: "#fef3c7", fg: "#b45309" },
  proof_uploaded: { label: "Proof Uploaded", bg: "#dbeafe", fg: "#1d4ed8" },
  overdue: { label: "Overdue > 30d", bg: "#fee2e2", fg: "#b91c1c" },
};

type Tab = "pending" | "found" | "archive";

export default function DeskAdminScreen() {
  const [tab, setTab] = useState<Tab>("pending");
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [search, setSearch] = useState("");

  const pendingCount = useMemo(() => queue.filter((q) => q.status !== "overdue").length, [queue]);

  const handleApprove = (item: QueueItem) => {
    Alert.alert("Approve claim?", `Confirm ${item.claimant || "this claim"} as the verified owner of "${item.title}".`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () => {
          console.log("Approved", item.code);
          setQueue((prev) => prev.filter((q) => q.id !== item.id));
        },
      },
    ]);
  };

  const handleReject = (item: QueueItem) => {
    Alert.alert("Reject claim?", `This will remove the claim on "${item.title}" and notify the claimant.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          console.log("Rejected", item.code);
          setQueue((prev) => prev.filter((q) => q.id !== item.id));
        },
      },
    ]);
  };

  const handleArchive = (item: QueueItem) => {
    console.log("Archived", item.code);
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
  };

  const filteredQueue = queue.filter((q) => !search.trim() || q.title.toLowerCase().includes(search.toLowerCase()) || q.code.toLowerCase().includes(search.toLowerCase()));

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
            <View style={styles.notifDot} />
          </View>
          <Ionicons name="person-circle-outline" size={24} color="#111" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Officer card */}
        <View style={styles.officerCard}>
          <View style={styles.officerAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.officerName}>Officer R. Mendoza</Text>
            <Text style={styles.officerRole}>USTP Campus Security & Custody Desk</Text>
          </View>
          <View style={styles.supervisorPill}>
            <Text style={styles.supervisorPillText}>SUPERVISOR</Text>
          </View>
          <View style={styles.stationPill}>
            <Text style={styles.stationPillText}>Station #04</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={17} color="#888" style={{ marginRight: 8 }} />
          <TextInput style={styles.searchInput} placeholder="Search ticket, ID number, or item..." placeholderTextColor="#999" value={search} onChangeText={setSearch} />
          <Ionicons name="options-outline" size={17} color="#111" />
        </View>

        {/* Stats grid */}
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
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>{pendingCount}</Text>
            <Text style={styles.statDeltaAction}>Action</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RETURNED</Text>
            <Text style={styles.statValue}>124</Text>
            <Text style={styles.statDeltaRate}>87% rate</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <Pressable style={[styles.tabButton, tab === "pending" && styles.tabButtonActive]} onPress={() => setTab("pending")}>
            <Text style={tab === "pending" ? styles.tabButtonTextActive : styles.tabButtonText}>Pending Claims</Text>
            {pendingCount > 0 && (
              <View style={styles.tabDot}>
                <Text style={styles.tabDotText}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "found" && styles.tabButtonActive]} onPress={() => setTab("found")}>
            <Text style={tab === "found" ? styles.tabButtonTextActive : styles.tabButtonText}>Found Items (38)</Text>
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "archive" && styles.tabButtonActive]} onPress={() => setTab("archive")}>
            <Text style={tab === "archive" ? styles.tabButtonTextActive : styles.tabButtonText}>Archive (15)</Text>
          </Pressable>
        </View>

        {tab === "pending" ? (
          <>
            <View style={styles.queueHeaderRow}>
              <Text style={styles.queueTitle}>Custody Verification Queue</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{filteredQueue.filter((q) => q.status !== "overdue").length} pending</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {filteredQueue.length === 0 ? (
                <Text style={styles.emptyText}>Queue is clear — nice work.</Text>
              ) : (
                filteredQueue.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <View key={item.id} style={styles.queueCard}>
                      <View style={styles.queueCardTop}>
                        <View style={styles.queueThumb}>
                          <Ionicons name={item.iconName} size={20} color="#475569" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.queueCodeRow}>
                            <Text style={styles.queueCode}>{item.code}</Text>
                            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                              <Text style={[styles.statusPillText, { color: meta.fg }]}>{meta.label}</Text>
                            </View>
                          </View>
                          <Text style={styles.queueItemTitle}>{item.title}</Text>
                          {item.status !== "overdue" ? (
                            <Text style={styles.queueMeta}>
                              Claimant: {item.claimant} (ID: {item.claimantId})
                            </Text>
                          ) : null}
                          <Text style={styles.queueMeta}>
                            {item.location}
                            {item.timeAgo ? ` • ${item.timeAgo}` : ""}
                          </Text>
                          {item.overdueNote ? <Text style={styles.overdueNote}>{item.overdueNote}</Text> : null}
                        </View>
                      </View>

                      {item.status === "overdue" ? (
                        <View style={styles.actionRow}>
                          <Text style={styles.transferText}>Transfer to archive vault</Text>
                          <Pressable style={styles.archiveButton} onPress={() => handleArchive(item)}>
                            <Ionicons name="archive-outline" size={13} color="#333" />
                            <Text style={styles.archiveButtonText}>Archive Item</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.actionRow}>
                          <Pressable style={styles.viewProofButton}>
                            <Ionicons name="eye-outline" size={13} color="#333" />
                            <Text style={styles.viewProofText}>View Proof ({item.proofCount})</Text>
                          </Pressable>
                          <Pressable style={styles.rejectButton} onPress={() => handleReject(item)}>
                            <Ionicons name="close" size={13} color="#dc2626" />
                            <Text style={styles.rejectText}>Reject</Text>
                          </Pressable>
                          <Pressable style={styles.approveButton} onPress={() => handleApprove(item)}>
                            <Ionicons name="checkmark" size={13} color="#fff" />
                            <Text style={styles.approveText}>Approve</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <View style={styles.placeholderBox}>
            <Ionicons name={tab === "found" ? "cube-outline" : "archive-outline"} size={26} color="#94a3b8" />
            <Text style={styles.placeholderText}>{tab === "found" ? "Found items catalog goes here." : "Archived cases go here."}</Text>
          </View>
        )}

        <View style={styles.sessionRow}>
          <View style={styles.sessionDot} />
          <Text style={styles.sessionText}>Session #04-Secured</Text>
          <Pressable style={{ marginLeft: "auto" }} onPress={() => router.replace("/login" as never)}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingTop: 50,
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
  stationPill: { backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
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
  statCard: { flexBasis: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 2 },
  statLabel: { fontSize: 9, fontWeight: "700", color: "#999", letterSpacing: 0.4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111" },
  statDeltaUp: { fontSize: 10, color: "#16a34a" },
  statDeltaAction: { fontSize: 10, color: "#dc2626", fontWeight: "700" },
  statDeltaRate: { fontSize: 10, color: "#888" },

  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
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
  queueCardTop: { flexDirection: "row", gap: 10 },
  queueThumb: { width: 46, height: 46, borderRadius: 10, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  queueCodeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  queueCode: { fontSize: 11, fontWeight: "700", color: "#f97316" },
  statusPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  statusPillText: { fontSize: 9, fontWeight: "700" },
  queueItemTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  queueMeta: { fontSize: 10.5, color: "#888", marginTop: 1 },
  overdueNote: { fontSize: 10.5, color: "#b91c1c", marginTop: 3, fontWeight: "600" },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewProofButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  viewProofText: { fontSize: 11, color: "#333", fontWeight: "600" },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  rejectText: { fontSize: 11, color: "#dc2626", fontWeight: "600" },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: "auto",
  },
  approveText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  transferText: { fontSize: 10.5, color: "#94a3b8", flex: 1 },
  archiveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  archiveButtonText: { fontSize: 11, color: "#333", fontWeight: "600" },

  emptyText: { fontSize: 12, color: "#999", textAlign: "center", paddingVertical: 20 },
  placeholderBox: { alignItems: "center", gap: 8, paddingVertical: 40 },
  placeholderText: { fontSize: 12, color: "#94a3b8" },

  sessionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, marginBottom: 10 },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16a34a" },
  sessionText: { fontSize: 11, color: "#888" },
  logoutText: { fontSize: 11, color: "#dc2626", fontWeight: "700" },
});
