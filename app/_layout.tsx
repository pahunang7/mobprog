import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import "react-native-reanimated";

import AnimatedSplash from "@/components/animated-splash";
import LoadingScreen from "@/components/loading-screen";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ClaimsProvider } from "@/contexts/claims-context";
import { ReportsProvider } from "@/contexts/reports-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuth();
  const [showLoading, setShowLoading] = useState(false);
  const wasLoggedIn = useRef(false);

  // Show the loading screen briefly right after a successful login
  useEffect(() => {
    if (isLoggedIn && !wasLoggedIn.current) {
      wasLoggedIn.current = true;
      setShowLoading(true);
      const timer = setTimeout(() => setShowLoading(false), 1400);
      return () => clearTimeout(timer);
    }
    if (!isLoggedIn) {
      wasLoggedIn.current = false;
      setShowLoading(false);
    }
  }, [isLoggedIn]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {!isLoggedIn && <Redirect href="/login" />}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="my-claims" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="desk-admin" options={{ headerShown: false }} />
        <Stack.Screen
          name="report-item"
          options={{
            headerShown: false,
            presentation: "transparentModal",
            animation: "fade",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
      {showLoading && <LoadingScreen message="Signing you in..." />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <ClaimsProvider>
        <ReportsProvider>
          <RootLayoutNav />
          {showSplash && <AnimatedSplash onDone={() => setShowSplash(false)} />}
        </ReportsProvider>
      </ClaimsProvider>
    </AuthProvider>
  );
}
