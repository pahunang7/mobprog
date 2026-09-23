import { Ionicons } from "@expo/vector-icons";

export type ItemStatus = "pending" | "claimed";

export type CategoryKey = "electronics" | "bottles" | "campus";

export type RegistryItem = {
  id: string;
  title: string;
  status: ItemStatus;
  timeAgo: string;
  location: string;
  note?: string;
  category: CategoryKey;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

export const CATEGORIES: { key: CategoryKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "electronics", label: "Electronics", icon: "hardware-chip-outline" },
  { key: "bottles", label: "Bottles", icon: "water-outline" },
  { key: "campus", label: "Campus IDs", icon: "card-outline" },
];

export const LOCATIONS = ["ICT Bldg", "Engineering Complex"];

export const REGISTRY_ITEMS: RegistryItem[] = [
  {
    id: "1",
    title: "Hydro Flask 32oz Mustard Yellow",
    status: "pending",
    timeAgo: "20 mins ago",
    location: "Engineering Bldg 3rd Floor",
    category: "bottles",
    iconName: "water",
    iconColor: "#ca8a04",
    iconBg: "#fef9c3",
  },
  {
    id: "2",
    title: "Apple AirPods Pro (2nd Gen)",
    status: "pending",
    timeAgo: "2 hours ago",
    location: "USTP Main Library 2F",
    note: "Blue silicone case attached",
    category: "electronics",
    iconName: "headset",
    iconColor: "#475569",
    iconBg: "#e2e8f0",
  },
  {
    id: "3",
    title: "USTP Student ID & RFID Tag",
    status: "claimed",
    timeAgo: "Yesterday",
    location: "Gym Lobby",
    note: "Returned to owner at Security Desk",
    category: "campus",
    iconName: "card",
    iconColor: "#334155",
    iconBg: "#e2e8f0",
  },
  {
    id: "4",
    title: "TI-84 Plus Graphing Calculator",
    status: "pending",
    timeAgo: "Yesterday",
    location: "Science Lab Rm 402",
    note: "Dark gray slide cover included",
    category: "electronics",
    iconName: "calculator",
    iconColor: "#334155",
    iconBg: "#e2e8f0",
  },
];

export function categoryLabel(key: CategoryKey) {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
