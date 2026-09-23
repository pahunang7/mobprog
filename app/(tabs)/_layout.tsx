import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Hide the built-in tab bar — screens like Home render their own
        // custom bottom nav (Feed / Report / My Claims), so this default
        // Home/Explore bar would just duplicate it.
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
    </Tabs>
  );
}
