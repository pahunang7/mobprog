import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type NavKey = "feed" | "report" | "claims";

export default function BottomNav({ active }: { active: NavKey }) {
  return (
    <View style={styles.bottomNav}>
      <Pressable style={styles.bottomNavItem} onPress={() => router.push("/(tabs)" as never)}>
        <Ionicons name={active === "feed" ? "document-text" : "document-text-outline"} size={20} color={active === "feed" ? "#f97316" : "#888"} />
        <Text style={active === "feed" ? styles.bottomNavLabelActive : styles.bottomNavLabel}>Feed</Text>
      </Pressable>

      <Pressable style={styles.bottomNavItem} onPress={() => router.push({ pathname: "/report-item", params: { mode: "lost" } } as never)}>
        <Ionicons name={active === "report" ? "add-circle" : "add-circle-outline"} size={20} color={active === "report" ? "#f97316" : "#888"} />
        <Text style={active === "report" ? styles.bottomNavLabelActive : styles.bottomNavLabel}>Report</Text>
      </Pressable>

      <View style={styles.bottomNavItem}>
        <Ionicons name={active === "claims" ? "shield" : "shield-outline"} size={20} color={active === "claims" ? "#f97316" : "#888"} />
        <Text style={active === "claims" ? styles.bottomNavLabelActive : styles.bottomNavLabel}>My Claims</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 10,
    paddingBottom: 18,
  },
  bottomNavItem: { flex: 1, alignItems: "center", gap: 3 },
  bottomNavLabel: { fontSize: 10, color: "#888" },
  bottomNavLabelActive: { fontSize: 10, color: "#f97316", fontWeight: "700" },
});
