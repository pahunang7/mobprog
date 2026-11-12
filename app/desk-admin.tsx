import { useAuth } from "@/contexts/auth-context";
import { Claim, useClaims } from "@/contexts/claims-context";
import { useReports } from "@/contexts/reports-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomNav from "./BottomNav";

type Tab = "reports" | "pending" | "pickup" | "found" | "archive";
type Confirm = { type: "approve" | "reject"; claim: Claim } | null;

type AdminNotification = {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

// Dummy notifications for the desk admin (replace with real data later)
const INITIAL_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "a1",
    title: "New claim submitted",
    body: "A student submitted a claim for Hydro Flask 32oz Mustard Yellow and is waiting for verification.",
    timeAgo: "5 mins ago",
    read: false,
    iconName: "document-text-outline",
    iconColor: "#f97316",
    iconBg: "#ffedd5",
  },
  {
    id: "a2",
    title: "Proof of ownership uploaded",
    body: "Ownership proof was attached to a pending claim. Review it before approving.",
    timeAgo: "32 mins ago",
    read: false,
    iconName: "image-outline",
    iconColor: "#1d4ed8",
    iconBg: "#dbeafe",
  },
  {
    id: "a3",
    title: "Item turned in at Station #04",
    body: "TI-84 Plus Graphing Calculator was handed in by campus security and logged as found.",
    timeAgo: "1 hour ago",
    read: false,
    iconName: "cube-outline",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
  },
  {
    id: "a4",
    title: "Duplicate claim detected",
    body: "Two students claimed the same item. Compare their ownership details before deciding.",
    timeAgo: "3 hours ago",
    read: true,
    iconName: "alert-circle-outline",
    iconColor: "#dc2626",
    iconBg: "#fee2e2",
  },
  {
    id: "a5",
    title: "Weekly report ready",
    body: "Lost and found activity for this week is ready: +12 lost, +18 found, 87% return rate.",
    timeAgo: "Yesterday",
    read: true,
    iconName: "stats-chart-outline",
    iconColor: "#475569",
    iconBg: "#e2e8f0",
  },
];

const claimKey = (c: Claim) => `${c.ownerId}:${c.id}`;
const ticketCode = (id: string) => `#LF-${9000 + Number(id || 0)}`;

// Same format as the student feed, e.g. "1 hour ago", "5 mins ago"
function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} ${mins === 1 ? "min" : "mins"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function titleCase(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DeskAdminScreen() {
  const { user } = useAuth();
  const { allClaims, reviewClaim, markCollected, isItemClosed, isItemReturned } = useClaims();
  const { allItems, pendingReports, reviewReport, resolveReport } = useReports();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [proofClaim, setProofClaim] = useState<Claim | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_ADMIN_NOTIFICATIONS);

  const officerName = user?.name ? titleCase(user.name) : "Desk Officer";
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Only approved reports (and the demo items) count as public items
  const publicItems = useMemo(() => allItems.filter((i) => (i.reportStatus ?? "approved") === "approved"), [allItems]);
  const lostCount = 142 + publicItems.filter((i) => i.kind === "lost").length;
  const foundCount = 189 + publicItems.filter((i) => i.kind === "found").length;

  const pending = useMemo(() => allClaims.filter((c) => c.status === "Under review"), [allClaims]);
  const pendingTotal = pending.length + pendingReports.length;
  // Approved by the desk, waiting for the student to come and collect the item
  const awaitingPickup = useMemo(() => allClaims.filter((c) => c.status === "Approved"), [allClaims]);
  // Finished claims: handed over (Collected) or Rejected
  const processed = useMemo(
    () => allClaims.filter((c) => c.status === "Collected" || c.status === "Rejected").sort((a, b) => (b.collectedAt ?? b.reviewedAt ?? 0) - (a.collectedAt ?? a.reviewedAt ?? 0)),
    [allClaims],
  );
  const returnedCount = 124 + allClaims.filter((c) => c.status === "Collected").length;

  const q = search.trim().toLowerCase();
  const matches = (c: Claim) =>
    !q || c.title.toLowerCase().includes(q) || ticketCode(c.id).toLowerCase().includes(q) || c.studentId.toLowerCase().includes(q) || c.claimantName.toLowerCase().includes(q);
  const shownPending = pending.filter(matches);
  const shownPickup = awaitingPickup.filter(matches);
  const shownProcessed = processed.filter(matches);
  const shownFound = publicItems.filter((i) => !q || i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
  const shownReports = pendingReports.filter((r) => !q || r.itemName.toLowerCase().includes(q) || r.reporterName.toLowerCase().includes(q) || r.location.toLowerCase().includes(q));

  const sourceOf = (id: string) => allItems.find((i) => i.id === id);

  const runConfirm = () => {
    if (!confirm) return;
    reviewClaim(confirm.claim, confirm.type === "approve" ? "Approved" : "Rejected", officerName);
    setConfirm(null);
  };

  const toggleNotifPanel = () => {
    setNotifVisible((v) => {
      const next = !v;
      // Mark everything read once the panel is opened
      if (next) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      return next;
    });
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
          <Pressable style={styles.iconButton} onPress={toggleNotifPanel} hitSlop={8}>
            <Ionicons name="notifications-outline" size={20} color="#111" />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </Pressable>
          <Pressable onPress={() => router.push("/profile" as never)} hitSlop={8}>
            <Ionicons name="person-circle-outline" size={24} color="#111" />
          </Pressable>
        </View>
      </View>

      {/* Notification dropdown */}
      <Modal visible={notifVisible} transparent animationType="fade" onRequestClose={() => setNotifVisible(false)}>
        <Pressable style={styles.notifBackdrop} onPress={() => setNotifVisible(false)} />
        <View style={styles.notifPanel}>
          <View style={styles.notifPanelHeader}>
            <Text style={styles.notifPanelTitle}>Notifications</Text>
            <Pressable onPress={() => setNotifVisible(false)} hitSlop={10}>
              <Ionicons name="close" size={18} color="#888" />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {notifications.map((n) => (
              <View key={n.id} style={styles.notifRow}>
                <View style={[styles.notifIconCircle, { backgroundColor: n.iconBg }]}>
                  <Ionicons name={n.iconName} size={16} color={n.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody}>{n.body}</Text>
                  <Text style={styles.notifTime}>{n.timeAgo}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

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
            <Text style={styles.statValue}>{lostCount}</Text>
            <Text style={styles.statDeltaUp}>+12 wk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>FOUND</Text>
            <Text style={styles.statValue}>{foundCount}</Text>
            <Text style={styles.statDeltaUp}>+18 wk</Text>
          </View>
          <View style={[styles.statCard, pendingTotal > 0 && styles.statCardHot]}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>{pendingTotal}</Text>
            <Text style={styles.statDeltaAction}>Action</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RETURNED</Text>
            <Text style={styles.statValue}>{returnedCount}</Text>
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
          <Pressable style={[styles.tabButton, tab === "pickup" && styles.tabButtonActive]} onPress={() => setTab("pickup")}>
            <Text style={tab === "pickup" ? styles.tabButtonTextActive : styles.tabButtonText}>Pickup</Text>
            {awaitingPickup.length > 0 && (
              <View style={styles.tabDot}>
                <Text style={styles.tabDotText}>{awaitingPickup.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "reports" && styles.tabButtonActive]} onPress={() => setTab("reports")}>
            <Text style={tab === "reports" ? styles.tabButtonTextActive : styles.tabButtonText}>Reports</Text>
            {pendingReports.length > 0 && (
              <View style={styles.tabDot}>
                <Text style={styles.tabDotText}>{pendingReports.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "found" && styles.tabButtonActive]} onPress={() => setTab("found")}>
            <Text style={tab === "found" ? styles.tabButtonTextActive : styles.tabButtonText}>Items ({publicItems.length})</Text>
          </Pressable>
          <Pressable style={[styles.tabButton, tab === "archive" && styles.tabButtonActive]} onPress={() => setTab("archive")}>
            <Text style={tab === "archive" ? styles.tabButtonTextActive : styles.tabButtonText}>Archive ({processed.length})</Text>
          </Pressable>
        </ScrollView>

        {/* ---- Reports awaiting approval ---- */}
        {tab === "reports" && (
          <>
            <View style={styles.queueHeaderRow}>
              <Text style={styles.queueTitle}>Report Approval Queue</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{shownReports.length} pending</Text>
              </View>
            </View>

            {shownReports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-done-circle-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyTitle}>{q ? "No reports match your search" : "No reports to review"}</Text>
                <Text style={styles.emptyText}>{q ? "Try a different item, location or name." : "New lost and found reports from students will appear here for approval."}</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {shownReports.map((r) => (
                  <View key={r.id} style={styles.queueCard}>
                    {r.photoUri ? <Image source={{ uri: r.photoUri }} style={styles.reportPhoto} /> : null}
                    <View style={styles.queueCodeRow}>
                      <Text style={styles.queueCode}>{ticketCode(r.id)}</Text>
                      <View style={[styles.statusPill, { backgroundColor: r.kind === "lost" ? "#fee2e2" : "#fef3c7" }]}>
                        <Text style={[styles.statusPillText, { color: r.kind === "lost" ? "#b91c1c" : "#b45309" }]}>{r.kind === "lost" ? "LOST REPORT" : "FOUND REPORT"}</Text>
                      </View>
                      {!r.photoUri && (
                        <View style={[styles.statusPill, { backgroundColor: "#f1f5f9" }]}>
                          <Text style={[styles.statusPillText, { color: "#64748b" }]}>No photo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.queueItemTitle}>{r.itemName}</Text>
                    <Text style={styles.queueMeta}>{r.category}</Text>
                    <Text style={styles.queueMeta}>
                      {r.location} • {r.dateTime}
                    </Text>
                    <Text style={styles.queueMeta}>
                      Reported by {titleCase(r.reporterName)} • {r.contact} • {timeAgo(r.createdAt)}
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable style={styles.rejectButton} onPress={() => reviewReport(r.id, "rejected", officerName)}>
                        <Ionicons name="close" size={13} color="#dc2626" />
                        <Text style={styles.rejectText}>Reject</Text>
                      </Pressable>
                      <Pressable style={styles.approveButton} onPress={() => reviewReport(r.id, "approved", officerName)}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                        <Text style={styles.approveText}>Approve & Publish</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

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
                          {src?.photoUri ? (
                            <Image source={{ uri: src.photoUri }} style={{ width: 46, height: 46, borderRadius: 10 }} />
                          ) : (
                            <Ionicons name={src?.iconName ?? "cube-outline"} size={20} color={src?.iconColor ?? "#475569"} />
                          )}
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

        {/* ---- Awaiting pickup ---- */}
        {tab === "pickup" && (
          <>
            <View style={styles.queueHeaderRow}>
              <Text style={styles.queueTitle}>Awaiting Pickup</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{shownPickup.length} waiting</Text>
              </View>
            </View>

            {shownPickup.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-done-circle-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyTitle}>{q ? "No pickups match your search" : "Nothing waiting for pickup"}</Text>
                <Text style={styles.emptyText}>{q ? "Try a different ticket, ID or item name." : "Approved claims appear here until the student collects the item."}</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {shownPickup.map((c) => {
                  const src = sourceOf(c.id);
                  return (
                    <View key={claimKey(c)} style={styles.queueCard}>
                      <View style={styles.queueCardTop}>
                        <View style={[styles.queueThumb, { backgroundColor: src?.iconBg ?? "#e2e8f0" }]}>
                          {src?.photoUri ? (
                            <Image source={{ uri: src.photoUri }} style={{ width: 46, height: 46, borderRadius: 10 }} />
                          ) : (
                            <Ionicons name={src?.iconName ?? "cube-outline"} size={20} color={src?.iconColor ?? "#475569"} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.queueCodeRow}>
                            <Text style={styles.queueCode}>{ticketCode(c.id)}</Text>
                            <View style={[styles.statusPill, { backgroundColor: "#dcfce7" }]}>
                              <Text style={[styles.statusPillText, { color: "#15803d" }]}>Approved</Text>
                            </View>
                          </View>
                          <Text style={styles.queueItemTitle}>{c.title}</Text>
                          <Text style={styles.queueMeta}>
                            Claimant: {titleCase(c.claimantName)} (ID: {c.studentId})
                          </Text>
                          <Text style={styles.queueMeta}>
                            Approved by {c.reviewedBy ?? "Desk"} • {c.reviewedAt ? timeAgo(c.reviewedAt) : ""}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionRow}>
                        <Pressable style={styles.approveButton} onPress={() => markCollected(c)}>
                          <Ionicons name="checkmark-done" size={13} color="#fff" />
                          <Text style={styles.approveText}>Mark as collected</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ---- Items ---- */}
        {tab === "found" && (
          <View style={{ gap: 10 }}>
            {shownFound.length === 0 ? (
              <Text style={styles.emptyText}>No items match your search.</Text>
            ) : (
              shownFound.map((i) => {
                const open = allClaims.filter((c) => c.id === i.id && c.status === "Under review").length;
                const returned = i.status === "claimed" || isItemReturned(i.id);
                const isLost = i.kind === "lost";
                const awaiting = !isLost && !returned && isItemClosed(i.id);
                const pillBg = returned ? "#e0e7ff" : awaiting ? "#e0f2fe" : isLost ? "#fee2e2" : open ? "#ffedd5" : "#dcfce7";
                const pillFg = returned ? "#4338ca" : awaiting ? "#0369a1" : isLost ? "#b91c1c" : open ? "#c2410c" : "#15803d";
                const pillText = returned ? (isLost ? "Resolved" : "Returned") : awaiting ? "Awaiting pickup" : isLost ? "Missing" : open ? `${open} claim${open > 1 ? "s" : ""}` : "Available";
                return (
                  <View key={i.id} style={styles.simpleCard}>
                    <View style={[styles.queueThumb, { backgroundColor: i.iconBg }]}>
                      {i.photoUri ? <Image source={{ uri: i.photoUri }} style={{ width: 46, height: 46, borderRadius: 10 }} /> : <Ionicons name={i.iconName} size={20} color={i.iconColor} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.queueCode}>{ticketCode(i.id)}</Text>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>
                        {i.title}
                      </Text>
                      <Text style={styles.queueMeta}>
                        {i.location} • {i.timeAgo}
                      </Text>
                      {i.reporterName ? <Text style={styles.queueMeta}>Reported by {titleCase(i.reporterName)}</Text> : null}
                      {i.reporterId && !returned && !awaiting ? (
                        <Pressable style={styles.resolveBtn} onPress={() => resolveReport(i.id)}>
                          <Text style={styles.resolveText}>Mark resolved</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
                      <Text style={[styles.statusPillText, { color: pillFg }]}>{pillText}</Text>
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
                <Text style={styles.emptyText}>Returned and rejected claims are kept here.</Text>
              </View>
            ) : (
              shownProcessed.map((c) => {
                const ok = c.status === "Collected";
                return (
                  <View key={claimKey(c)} style={styles.simpleCard}>
                    <View style={[styles.queueThumb, { backgroundColor: ok ? "#e0e7ff" : "#fee2e2" }]}>
                      <Ionicons name={ok ? "checkmark-circle" : "close-circle"} size={22} color={ok ? "#4338ca" : "#dc2626"} />
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
                        {ok
                          ? `Approved by ${c.reviewedBy ?? "Desk"} • handed over ${c.collectedAt ? timeAgo(c.collectedAt) : ""}`
                          : `Rejected by ${c.reviewedBy ?? "Desk"} • ${c.reviewedAt ? timeAgo(c.reviewedAt) : ""}`}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: ok ? "#e0e7ff" : "#fee2e2" }]}>
                      <Text style={[styles.statusPillText, { color: ok ? "#4338ca" : "#b91c1c" }]}>{ok ? "Returned" : "Rejected"}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
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
                    ? `Confirm ${titleCase(confirm.claim.claimantName)} as the verified owner of "${confirm.claim.title}". Any other pending claims on this item will be rejected. The item stays reserved until you mark it as collected in the Pickup tab.`
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

  notifBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,15,25,0.35)" },
  notifPanel: {
    position: "absolute",
    top: 58,
    right: 14,
    width: 300,
    maxWidth: "88%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  notifPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  notifPanelTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  notifRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f6f6",
  },
  notifIconCircle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  notifTitle: { fontSize: 12, fontWeight: "700", color: "#111" },
  notifBody: { fontSize: 11, color: "#666", marginTop: 1, lineHeight: 15 },
  notifTime: { fontSize: 10, color: "#aaa", marginTop: 3 },

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
  reportPhoto: { width: "100%", height: 160, borderRadius: 10, backgroundColor: "#f1f5f9" },
  resolveBtn: { alignSelf: "flex-start", marginTop: 6, borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  resolveText: { fontSize: 10, fontWeight: "700", color: "#15803d" },

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
