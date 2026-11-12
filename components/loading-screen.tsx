import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = { message?: string };

export default function LoadingScreen({ message = "Loading..." }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="school" size={26} color="#fff" />
      </View>
      <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 22 }} />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Please wait a moment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  message: { marginTop: 16, fontSize: 15, fontWeight: "700", color: "#111" },
  hint: { marginTop: 4, fontSize: 11, color: "#94a3b8" },
});
