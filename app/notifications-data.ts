import { Ionicons } from "@expo/vector-icons";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Claim Approved",
    body: "Your claim for Apple AirPods Pro (2nd Gen) was verified by the Desk Admin.",
    timeAgo: "5 mins ago",
    read: false,
    iconName: "checkmark-circle",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
  },
  {
    id: "n2",
    title: "New Item Reported Nearby",
    body: "A Hydro Flask 32oz was just turned in at Engineering Bldg 3rd Floor.",
    timeAgo: "22 mins ago",
    read: false,
    iconName: "cube",
    iconColor: "#ca8a04",
    iconBg: "#fef9c3",
  },
  {
    id: "n3",
    title: "Reminder: Bring Your ID",
    body: "Claimed items must be picked up in person with your Student ID at the Security Desk.",
    timeAgo: "3 hours ago",
    read: true,
    iconName: "information-circle",
    iconColor: "#475569",
    iconBg: "#e2e8f0",
  },
  {
    id: "n4",
    title: "Case Closed",
    body: "USTP Student ID & RFID Tag was returned to its owner. Thanks for reporting it!",
    timeAgo: "Yesterday",
    read: true,
    iconName: "shield-checkmark",
    iconColor: "#334155",
    iconBg: "#e2e8f0",
  },
];
