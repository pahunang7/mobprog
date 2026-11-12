import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";

type Props = {
  onDone: () => void;
  /** How long the splash stays on screen, in ms */
  duration?: number;
};

export default function AnimatedSplash({ onDone, duration = 2600 }: Props) {
  const native = Platform.OS !== "web";
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: native }), Animated.spring(logoScale, { toValue: 1, friction: 5, useNativeDriver: native })]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: native }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: duration - 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width can't use the native driver
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: native }).start(() => onDone());
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.View style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Ionicons name="school" size={44} color="#fff" />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
        <Text style={styles.title}>USTP Lost & Found</Text>
        <Text style={styles.subtitle}>CDO MAIN CAMPUS</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <Text style={styles.footerText}>Identity & Access Management</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#f97316", fontSize: 11, fontWeight: "700", letterSpacing: 2, marginTop: 4 },
  footer: { position: "absolute", bottom: 56, width: "60%", alignItems: "center", gap: 10 },
  track: { width: "100%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  fill: { height: 4, borderRadius: 2, backgroundColor: "#f97316" },
  footerText: { color: "#94a3b8", fontSize: 10, letterSpacing: 0.5 },
});
