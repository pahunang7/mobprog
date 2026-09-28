import { useAuth } from "@/contexts/auth-context";
import { useClaims } from "@/contexts/claims-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function titleCase(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type RowProps = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean; valueColor?: string };

function InfoRow({ icon, label, value, last, valueColor }: RowProps) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color="#475569" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} selectable>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, updatePhoto } = useAuth();
  const { claims, clearClaims } = useClaims();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const name = user?.name ? titleCase(user.name) : "Trailblazer";
  const isStudent = user?.role !== "faculty";

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)" as never);
  };

  // ---- profile picture ----
  const saveResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    // store as a data URI so it survives restarts (picker cache files can be deleted)
    const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    updatePhoto(uri);
  };

  const pickFromLibrary = async () => {
    setPhotoSheet(false);
    setPhotoError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });
      saveResult(result);
    } catch {
      setPhotoError("Couldn't open your photos. Please try again.");
    }
  };

  const takePhoto = async () => {
    setPhotoSheet(false);
    setPhotoError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setPhotoError("Camera access is off. Allow it in your phone settings to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true });
      saveResult(result);
    } catch {
      setPhotoError("Couldn't open the camera. Please try again.");
    }
  };

  const removePhoto = () => {
    setPhotoSheet(false);
    setPhotoError(null);
    updatePhoto(null);
  };

  const handleLogout = () => {
    setConfirmVisible(false);
    clearClaims(); // don't leave one person's claims showing for the next login
    logout();
    router.replace("/login" as never);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <View style={styles.heroCard}>
          <Pressable style={styles.avatarWrap} onPress={() => setPhotoSheet(true)} accessibilityLabel="Change profile picture">
            <View style={styles.avatar}>{user?.photoUri ? <Image source={{ uri: user.photoUri }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{initialsFor(name)}</Text>}</View>
            <View style={styles.camBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </Pressable>
          {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
          <Text style={styles.heroName}>{name}</Text>
          <View style={styles.heroPills}>
            <View style={styles.rolePill}>
              <Ionicons name={isStudent ? "school-outline" : "shield-outline"} size={12} color="#cbd5e1" />
              <Text style={styles.rolePillText}>{isStudent ? "Student" : "Faculty"}</Text>
            </View>
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
              <Text style={styles.verifiedPillText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Account info */}
        <Text style={styles.sectionTitle}>Account information</Text>
        <View style={styles.card}>
          <InfoRow icon="person-outline" label="Full name" value={name} />
          <InfoRow icon={isStudent ? "briefcase-outline" : "mail-outline"} label={isStudent ? "Student ID" : "Institutional email"} value={user?.identifier ?? "—"} />
          <InfoRow icon="ribbon-outline" label="Account type" value={isStudent ? "Student" : "Faculty / Staff"} />
          <InfoRow icon="location-outline" label="Campus" value="USTP CDO Main Campus" />
          <InfoRow icon="shield-checkmark-outline" label="Status" value="Verified USTP account" valueColor="#15803d" last />
        </View>

        {/* Activity */}
        <Text style={styles.sectionTitle}>Activity</Text>
        <Pressable style={styles.card} onPress={() => router.navigate("/my-claims" as never)}>
          <View style={styles.activityRow}>
            <View style={[styles.infoIcon, { backgroundColor: "#ffedd5" }]}>
              <Ionicons name="shield-outline" size={16} color="#c2410c" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>My claims</Text>
              <Text style={styles.infoValue}>{claims.length === 0 ? "No active claims" : `${claims.length} claim${claims.length > 1 ? "s" : ""} under review`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </View>
        </Pressable>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={() => setConfirmVisible(true)}>
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footer}>USTP Lost & Found · CDO Main Campus</Text>
      </ScrollView>

      {/* Profile picture options */}
      <Modal visible={photoSheet} transparent animationType="fade" onRequestClose={() => setPhotoSheet(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoSheet(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Profile picture</Text>
            <Pressable style={styles.sheetRow} onPress={pickFromLibrary}>
              <Ionicons name="images-outline" size={18} color="#111" />
              <Text style={styles.sheetRowText}>{Platform.OS === "web" ? "Upload a photo" : "Choose from library"}</Text>
            </Pressable>
            {Platform.OS !== "web" && (
              <Pressable style={styles.sheetRow} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={18} color="#111" />
                <Text style={styles.sheetRowText}>Take a photo</Text>
              </Pressable>
            )}
            {user?.photoUri ? (
              <Pressable style={styles.sheetRow} onPress={removePhoto}>
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text style={[styles.sheetRowText, { color: "#dc2626" }]}>Remove photo</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.sheetCancel} onPress={() => setPhotoSheet(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Logout confirmation (custom dialog so it works on web too) */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Log out?</Text>
            <Text style={styles.dialogBody}>You'll need to sign in again to search, report, or claim items.</Text>
            <View style={styles.dialogActions}>
              <Pressable style={styles.stayBtn} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.stayText}>Stay signed in</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleLogout}>
                <Text style={styles.confirmText}>Log out</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { width: 20 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  content: { padding: 16, paddingBottom: 32 },

  heroCard: { alignItems: "center", backgroundColor: "#111827", borderRadius: 18, paddingVertical: 24, paddingHorizontal: 16, marginBottom: 20 },
  avatarWrap: { marginBottom: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: 84, height: 84 },
  camBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#111827",
  },
  changePhotoText: { color: "#fdba74", fontSize: 12, fontWeight: "600", marginBottom: 10 },
  photoError: { color: "#fca5a5", fontSize: 11, textAlign: "center", marginBottom: 8, paddingHorizontal: 12 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(15,15,25,0.55)", justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxWidth: 430, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  sheetTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 8 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  sheetRowText: { fontSize: 14, fontWeight: "600", color: "#111" },
  sheetCancel: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  sheetCancelText: { fontSize: 13, fontWeight: "700", color: "#888" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  heroName: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  heroPills: { flexDirection: "row", gap: 8, marginTop: 10 },
  rolePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  rolePillText: { color: "#cbd5e1", fontSize: 11, fontWeight: "600" },
  verifiedPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(34,197,94,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedPillText: { color: "#4ade80", fontSize: 11, fontWeight: "700" },

  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 8, marginLeft: 2 },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 20, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, color: "#94a3b8" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#111", marginTop: 1 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 13 },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
  footer: { textAlign: "center", fontSize: 10, color: "#94a3b8", marginTop: 20 },

  dialogBackdrop: { flex: 1, backgroundColor: "rgba(15,15,25,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 340, backgroundColor: "#fff", borderRadius: 16, padding: 18 },
  dialogTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  dialogBody: { fontSize: 12, color: "#666", marginTop: 6, lineHeight: 17 },
  dialogActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  stayBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#f1f5f9" },
  stayText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  confirmBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#dc2626" },
  confirmText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
