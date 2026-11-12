import { useAuth } from "@/contexts/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ClaimStatus = "Under review" | "Approved" | "Collected" | "Rejected";

export type Claim = {
  id: string; // registry item id
  title: string;
  code?: string;
  deskLabel?: string;
  ownerId: string; // login identifier of the student who made the claim
  claimantName: string;
  studentId: string; // ID / email typed on the verification form
  ownership: string;
  proofName: string | null;
  claimedAt: number;
  status: ClaimStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  collectedAt?: number;
};

type ClaimInput = Pick<Claim, "id" | "title" | "code" | "deskLabel">;
type ClaimDetails = Pick<Claim, "studentId" | "ownership" | "proofName">;

type ClaimsContextValue = {
  /** The logged-in student's own claims */
  claims: Claim[];
  /** Every claim on this device (used by the Desk Admin console) */
  allClaims: Claim[];
  addClaim: (item: ClaimInput, details: ClaimDetails) => void;
  /** Student withdraws their own claim */
  cancelClaim: (itemId: string) => void;
  /** The logged-in student's active (not rejected) claim for an item */
  getClaim: (itemId: string) => Claim | undefined;
  hasClaimed: (itemId: string) => boolean;
  /** True once ANY claim on this item has been approved (nobody else can claim it) */
  isItemClosed: (itemId: string) => boolean;
  /** True once the approved claimant has physically collected the item */
  isItemReturned: (itemId: string) => boolean;
  /** Desk admin approves / rejects a claim */
  reviewClaim: (claim: Claim, status: "Approved" | "Rejected", reviewer: string) => void;
  /** Desk admin confirms the approved claimant collected the item */
  markCollected: (claim: Claim) => void;
};

const ClaimsContext = createContext<ClaimsContextValue | null>(null);

const STORAGE_KEY = "ustp_claims";
const norm = (s?: string) => (s ?? "").trim().toLowerCase();

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const me = norm(user?.identifier);
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const loaded = useRef(false);

  // Load saved claims once, so they survive refreshes and are visible to the desk after a student logs out
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Claim[];
          setAllClaims((prev) => [...prev, ...saved.filter((s) => !prev.some((p) => p.id === s.id && p.ownerId === s.ownerId))]);
        }
      })
      .catch((err) => console.warn("Could not load claims", err))
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  // Web: when another browser tab saves claims, reload them here so every open screen stays in sync
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      try {
        setAllClaims(JSON.parse(e.newValue) as Claim[]);
      } catch (err) {
        console.warn("Could not sync claims", err);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allClaims)).catch((err) => console.warn("Could not save claims", err));
  }, [allClaims]);

  const claims = useMemo(() => allClaims.filter((c) => c.ownerId === me), [allClaims, me]);

  const addClaim = useCallback(
    (item: ClaimInput, details: ClaimDetails) => {
      if (!me) return;
      setAllClaims((prev) => {
        if (prev.some((c) => c.id === item.id && (c.status === "Approved" || c.status === "Collected"))) return prev; // item already released to someone
        if (prev.some((c) => c.id === item.id && c.ownerId === me && c.status !== "Rejected")) return prev; // no duplicates
        const cleaned = prev.filter((c) => !(c.id === item.id && c.ownerId === me)); // replace an old rejected claim
        const next: Claim = {
          ...item,
          ...details,
          ownerId: me,
          claimantName: user?.name ?? "Student",
          claimedAt: Date.now(),
          status: "Under review",
        };
        return [next, ...cleaned];
      });
    },
    [me, user?.name],
  );

  const cancelClaim = useCallback(
    (itemId: string) => {
      setAllClaims((prev) => prev.filter((c) => !(c.id === itemId && c.ownerId === me && c.status === "Under review")));
    },
    [me],
  );

  const getClaim = useCallback((itemId: string) => claims.find((c) => c.id === itemId && c.status !== "Rejected"), [claims]);
  const hasClaimed = useCallback((itemId: string) => !!getClaim(itemId), [getClaim]);

  const isItemClosed = useCallback((itemId: string) => allClaims.some((c) => c.id === itemId && (c.status === "Approved" || c.status === "Collected")), [allClaims]);
  const isItemReturned = useCallback((itemId: string) => allClaims.some((c) => c.id === itemId && c.status === "Collected"), [allClaims]);

  const reviewClaim = useCallback((claim: Claim, status: "Approved" | "Rejected", reviewer: string) => {
    const now = Date.now();
    setAllClaims((prev) =>
      prev.map((c) => {
        const same = c.id === claim.id && c.ownerId === claim.ownerId;
        if (same) return { ...c, status, reviewedAt: now, reviewedBy: reviewer };
        // approving one claim closes any other pending claim on the same item
        if (status === "Approved" && c.id === claim.id && c.status === "Under review") return { ...c, status: "Rejected", reviewedAt: now, reviewedBy: reviewer };
        return c;
      }),
    );
  }, []);

  const markCollected = useCallback((claim: Claim) => {
    const now = Date.now();
    setAllClaims((prev) => prev.map((c) => (c.id === claim.id && c.ownerId === claim.ownerId && c.status === "Approved" ? { ...c, status: "Collected", collectedAt: now } : c)));
  }, []);

  const value = useMemo(
    () => ({ claims, allClaims, addClaim, cancelClaim, getClaim, hasClaimed, isItemClosed, isItemReturned, reviewClaim, markCollected }),
    [claims, allClaims, addClaim, cancelClaim, getClaim, hasClaimed, isItemClosed, isItemReturned, reviewClaim, markCollected],
  );

  return <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>;
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error("useClaims must be used inside <ClaimsProvider>");
  return ctx;
}
