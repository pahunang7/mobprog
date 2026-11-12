import { CategoryKey, REGISTRY_ITEMS, RegistryItem } from "@/app/registry-data";
import { useAuth } from "@/contexts/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ReportKind = "lost" | "found";
export type ReportStatus = "pending" | "approved" | "rejected";

export type Report = {
  id: string;
  kind: ReportKind;
  itemName: string;
  category: string;
  dateTime: string;
  location: string;
  contact: string;
  photoUri: string | null; // data URI of the uploaded photo
  ownerId: string; // login identifier of the reporter
  reporterName: string;
  createdAt: number;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  resolved: boolean;
};

type ReportInput = Pick<Report, "kind" | "itemName" | "category" | "dateTime" | "location" | "contact" | "photoUri">;

type ReportsContextValue = {
  reports: Report[];
  /** Reports waiting for an officer's decision (used by the Desk Admin "Reports" tab) */
  pendingReports: Report[];
  /** Demo items + approved reports + the logged-in user's own pending/rejected reports */
  allItems: RegistryItem[];
  addReport: (input: ReportInput) => void;
  reviewReport: (id: string, status: "approved" | "rejected", reviewer: string) => void;
  resolveReport: (id: string) => void;
  /** True if the logged-in user submitted this item */
  isMine: (item: RegistryItem) => boolean;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

const STORAGE_KEY = "ustp_reports";
const FIRST_REPORT_ID = 100; // demo items use 1-4; ids stay numeric so ticket codes like #LF-9100 work
const norm = (s?: string) => (s ?? "").trim().toLowerCase();

const CATEGORY_KEY: Record<string, CategoryKey> = {
  "Electronics & Gadgets": "electronics",
  "Bottles & Containers": "bottles",
  "Documents & Cards": "campus",
};

type Look = Pick<RegistryItem, "iconName" | "iconColor" | "iconBg">;
const LOOKS: Record<CategoryKey, Look> = {
  electronics: { iconName: "hardware-chip", iconColor: "#475569", iconBg: "#e2e8f0" },
  bottles: { iconName: "water", iconColor: "#ca8a04", iconBg: "#fef9c3" },
  campus: { iconName: "card", iconColor: "#334155", iconBg: "#e2e8f0" },
  other: { iconName: "cube", iconColor: "#475569", iconBg: "#e2e8f0" },
};
const LOST_LOOK: Look = { iconName: "search", iconColor: "#dc2626", iconBg: "#fee2e2" };

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} ${mins === 1 ? "min" : "mins"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

// Reports saved before approval existed were published immediately, so treat them as approved
const normalize = (list: Partial<Report>[]) => list.map((r) => ({ ...r, status: r.status ?? "approved", photoUri: r.photoUri ?? null })) as Report[];

function toItem(r: Report): RegistryItem {
  const category = CATEGORY_KEY[r.category] ?? "other";
  const look = r.kind === "lost" ? LOST_LOOK : LOOKS[category];
  return {
    id: r.id,
    title: r.itemName,
    status: r.resolved ? "claimed" : "pending",
    timeAgo: timeAgo(r.createdAt),
    location: r.location,
    note: `${r.kind === "lost" ? "Lost" : "Found"}: ${r.dateTime}`,
    category,
    ...look,
    kind: r.kind,
    reporterId: r.ownerId,
    reporterName: r.reporterName,
    photoUri: r.photoUri,
    reportStatus: r.status,
  };
}

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const me = norm(user?.identifier);
  const [reports, setReports] = useState<Report[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = normalize(JSON.parse(raw) as Partial<Report>[]);
          setReports((prev) => [...prev, ...saved.filter((s) => !prev.some((p) => p.id === s.id))]);
        }
      })
      .catch((err) => console.warn("Could not load reports", err))
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  // Web: when another browser tab saves reports, reload them here so every open screen stays in sync
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      try {
        setReports(normalize(JSON.parse(e.newValue) as Partial<Report>[]));
      } catch (err) {
        console.warn("Could not sync reports", err);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reports)).catch((err) => console.warn("Could not save reports (a photo may be too large)", err));
  }, [reports]);

  const addReport = useCallback(
    (input: ReportInput) => {
      if (!me) return;
      // Desk staff publish their own reports straight away; student reports wait for approval
      const isStaff = user?.role === "faculty";
      setReports((prev) => {
        const nextId = String(Math.max(FIRST_REPORT_ID - 1, ...prev.map((r) => Number(r.id))) + 1);
        const now = Date.now();
        const report: Report = {
          ...input,
          id: nextId,
          ownerId: me,
          reporterName: user?.name ?? "Student",
          createdAt: now,
          status: isStaff ? "approved" : "pending",
          ...(isStaff ? { reviewedBy: user?.name ?? "Desk", reviewedAt: now } : {}),
          resolved: false,
        };
        return [report, ...prev];
      });
    },
    [me, user?.name, user?.role],
  );

  const reviewReport = useCallback((id: string, status: "approved" | "rejected", reviewer: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status, reviewedBy: reviewer, reviewedAt: Date.now() } : r)));
  }, []);

  const resolveReport = useCallback((id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: true } : r)));
  }, []);

  const isMine = useCallback((item: RegistryItem) => !!me && norm(item.reporterId) === me, [me]);

  const pendingReports = useMemo(() => reports.filter((r) => r.status === "pending"), [reports]);

  const allItems = useMemo(() => {
    const visible = reports.filter((r) => r.status === "approved" || (!!me && r.ownerId === me));
    return [...visible.map(toItem), ...REGISTRY_ITEMS];
  }, [reports, me]);

  const value = useMemo(
    () => ({ reports, pendingReports, allItems, addReport, reviewReport, resolveReport, isMine }),
    [reports, pendingReports, allItems, addReport, reviewReport, resolveReport, isMine],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be used inside <ReportsProvider>");
  return ctx;
}
