import { useAuth } from "@/contexts/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomNav from "../BottomNav";
import ClaimVerificationModal, { ClaimItem } from "../ClaimVerificationModal";
import { INITIAL_NOTIFICATIONS, NotificationItem } from "../notifications-data";
import { CATEGORIES, CategoryKey, LOCATIONS, REGISTRY_ITEMS, RegistryItem } from "../registry-data";

// Turns a full name into initials for the avatar circle, e.g. "Juan Dela Cruz" -> "JD"
function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | CategoryKey>("all");
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [claimItem, setClaimItem] = useState<ClaimItem | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const activeCount = REGISTRY_ITEMS.filter((i) => i.status === "pending").length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayName = user?.name ?? "Trailblazer";
  const firstName = displayName.split(" ")[0];
  const avatarInitials = initialsFor(displayName);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REGISTRY_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || (item.note ?? "").toLowerCase().includes(q);
    });
  }, [search, activeCategory]);

  const openClaimModal = (item: RegistryItem) => {
    setClaimItem({ id: item.id, title: item.title });
    setClaimModalVisible(true);
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
            <Text style={styles.headerSubtitle}>CDO MAIN CAMPUS</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton} onPress={toggleNotifPanel} hitSlop={8}>
            <Ionicons name="notifications-outline" size={20} color="#111" />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </Pressable>
          <Pressable style={styles.iconButton}>
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
        {/* Greeting card */}
        <View style={styles.greetingCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <View style={styles.greetingTextWrap}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingTitle}>Hello, {firstName}!</Text>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.greetingSubtitle}>Ready to search or report missing campus items.</Text>
          </View>
          <View style={styles.qrBadge}>
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionCard, styles.actionCardLost]} onPress={() => router.push({ pathname: "/report-item", params: { mode: "lost" } } as never)}>
            <Ionicons name="search" size={16} color="#dc2626" />
            <Text style={styles.actionCardLabelLost}>MISSING ITEM?</Text>
            <Text style={styles.actionCardCta}>+ Report Lost</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, styles.actionCardFound]} onPress={() => router.push({ pathname: "/report-item", params: { mode: "found" } } as never)}>
            <Ionicons name="add-circle" size={16} color="#a16207" />
            <Text style={styles.actionCardLabelFound}>PICKED IT UP?</Text>
            <Text style={styles.actionCardCta}>+ Report Found</Text>
          </Pressable>
        </View>

        {/* Feed header */}
        <View style={styles.feedHeaderRow}>
          <View>
            <Text style={styles.feedTitle}>Campus Registry Feed</Text>
            <Text style={styles.feedSubtitle}>Live catalog of reported & turned-in belongings</Text>
          </View>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{activeCount} Active</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput style={styles.searchInput} placeholder="Search ID, Hydro Flask, AirPods, calculator" placeholderTextColor="#999" value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </Pressable>
          )}
        </View>

        {/* Category chips — filter the list below in place */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: 8 }}>
          <Pressable style={[styles.chip, activeCategory === "all" && styles.chipActive]} onPress={() => setActiveCategory("all")}>
            <Ionicons name="apps-outline" size={14} color={activeCategory === "all" ? "#fff" : "#333"} />
            <Text style={[styles.chipText, activeCategory === "all" && styles.chipTextActive]}>All Items</Text>
          </Pressable>
          {CATEGORIES.map((cat) => {
            const active = cat.key === activeCategory;
            return (
              <Pressable key={cat.key} style={[styles.chip, active && styles.chipActive]} onPress={() => setActiveCategory(cat.key)}>
                <Ionicons name={cat.icon} size={14} color={active ? "#fff" : "#333"} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Location filter */}
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>LOCATION:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LOCATIONS.map((loc) => (
              <View key={loc} style={styles.locationPill}>
                <Ionicons name="location-outline" size={12} color="#555" />
                <Text style={styles.locationPillText}>{loc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Registry items */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={28} color="#ccc" />
            <Text style={styles.emptyStateText}>{search ? `No items match "${search}"` : "No items in this category right now."}</Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 4 }}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.itemThumb, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.iconName} size={22} color={item.iconColor} />
                  {item.status === "claimed" && (
                    <View style={styles.claimedBadgeOverlay}>
                      <Ionicons name="checkmark" size={11} color="#fff" />
                    </View>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <View style={styles.itemStatusRow}>
                    <View style={[styles.statusPill, item.status === "claimed" ? styles.statusPillClaimed : styles.statusPillPending]}>
                      <Text style={[styles.statusPillText, item.status === "claimed" ? styles.statusPillTextClaimed : styles.statusPillTextPending]}>
                        {item.status === "claimed" ? "Claimed" : "Pending"}
                      </Text>
                    </View>
                    <Ionicons name="time-outline" size={11} color="#999" />
                    <Text style={styles.itemTime}>{item.timeAgo}</Text>
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.itemLocationRow}>
                    <Ionicons name="location-outline" size={11} color="#999" />
                    <Text style={styles.itemLocationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                </View>

                {item.status === "claimed" ? (
                  <View style={styles.caseClosedButton}>
                    <Text style={styles.caseClosedButtonText}>Case Closed</Text>
                  </View>
                ) : (
                  <Pressable style={styles.claimButton} onPress={() => openClaimModal(item)}>
                    <Ionicons name="checkmark-circle-outline" size={13} color="#fff" />
                    <Text style={styles.claimButtonText}>Claim Now</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer notice */}
        <View style={styles.footerNotice}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#334155" />
          <Text style={styles.footerNoticeTitle}>USTP STUDENT AFFAIRS & SECURITY SERVICES</Text>
          <Text style={styles.footerNoticeText}>All claimed items require physical validation and student ID presentation at the Ground Floor Admin Security Desk.</Text>
        </View>
      </ScrollView>

      <BottomNav active="feed" />

      <ClaimVerificationModal
        visible={claimModalVisible}
        item={claimItem}
        onClose={() => setClaimModalVisible(false)}
        onSubmitted={(itemId) => {
          console.log("Claim submitted for", itemId);
          // TODO: update the item's status to "claimed" in your real data source here
        }}
      />
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
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  headerSubtitle: { fontSize: 9, color: "#888", letterSpacing: 0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { position: "relative" },
  notifDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#f97316",
  },

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
  notifIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: { fontSize: 12, fontWeight: "700", color: "#111" },
  notifBody: { fontSize: 11, color: "#666", marginTop: 1, lineHeight: 15 },
  notifTime: { fontSize: 10, color: "#aaa", marginTop: 3 },

  scrollContent: { padding: 16, paddingBottom: 24 },

  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  greetingTextWrap: { flex: 1 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  greetingTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  verifiedPill: { backgroundColor: "rgba(34,197,94,0.2)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  verifiedPillText: { color: "#4ade80", fontSize: 10, fontWeight: "700" },
  greetingSubtitle: { color: "#cbd5e1", fontSize: 11 },
  qrBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  actionCardLost: { backgroundColor: "#fef2f2" },
  actionCardFound: { backgroundColor: "#fefce8" },
  actionCardLabelLost: { fontSize: 10, fontWeight: "700", color: "#dc2626", marginTop: 2 },
  actionCardLabelFound: { fontSize: 10, fontWeight: "700", color: "#a16207", marginTop: 2 },
  actionCardCta: { fontSize: 13, fontWeight: "700", color: "#111" },

  feedHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  feedTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  feedSubtitle: { fontSize: 11, color: "#888", marginTop: 2 },
  activePill: { backgroundColor: "#dbeafe", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activePillText: { fontSize: 11, fontWeight: "700", color: "#1d4ed8" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#111" },

  chipRow: { marginBottom: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#333" },
  chipTextActive: { color: "#fff" },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  locationLabel: { fontSize: 10, fontWeight: "700", color: "#999", letterSpacing: 0.5 },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  locationPillText: { fontSize: 11, color: "#555" },

  emptyState: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyStateText: { fontSize: 12, color: "#999" },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  claimedBadgeOverlay: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  itemInfo: { flex: 1, gap: 2 },
  itemStatusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 1 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, marginRight: 4 },
  statusPillPending: { backgroundColor: "#fef3c7" },
  statusPillClaimed: { backgroundColor: "#e0e7ff" },
  statusPillText: { fontSize: 9, fontWeight: "700" },
  statusPillTextPending: { color: "#b45309" },
  statusPillTextClaimed: { color: "#4338ca" },
  itemTime: { fontSize: 10, color: "#999" },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  itemLocationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  itemLocationText: { fontSize: 10, color: "#888" },
  itemNote: { fontSize: 10, color: "#aaa", fontStyle: "italic" },

  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  claimButtonText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  caseClosedButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  caseClosedButtonText: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },

  footerNotice: { alignItems: "center", gap: 4, marginTop: 22, paddingHorizontal: 10 },
  footerNoticeTitle: { fontSize: 10, fontWeight: "700", color: "#334155", letterSpacing: 0.3, marginTop: 4, textAlign: "center" },
  footerNoticeText: { fontSize: 10, color: "#94a3b8", textAlign: "center", lineHeight: 14 },
});
