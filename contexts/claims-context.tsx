import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type Claim = {
  id: string; // item id
  title: string;
  code?: string;
  deskLabel?: string;
  studentId: string;
  ownership: string;
  proofName: string | null;
  claimedAt: number;
  status: "Under review";
};

type ClaimInput = Pick<Claim, "id" | "title" | "code" | "deskLabel">;
type ClaimDetails = Pick<Claim, "studentId" | "ownership" | "proofName">;

type ClaimsContextValue = {
  claims: Claim[];
  addClaim: (item: ClaimInput, details: ClaimDetails) => void;
  cancelClaim: (itemId: string) => void;
  hasClaimed: (itemId: string) => boolean;
  clearClaims: () => void;
};

const ClaimsContext = createContext<ClaimsContextValue | null>(null);

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>([]);

  const addClaim = useCallback((item: ClaimInput, details: ClaimDetails) => {
    setClaims((prev) => {
      if (prev.some((c) => c.id === item.id)) return prev; // no duplicates
      return [{ ...item, ...details, claimedAt: Date.now(), status: "Under review" }, ...prev];
    });
  }, []);

  const cancelClaim = useCallback((itemId: string) => {
    setClaims((prev) => prev.filter((c) => c.id !== itemId));
  }, []);

  const clearClaims = useCallback(() => setClaims([]), []);

  const hasClaimed = useCallback((itemId: string) => claims.some((c) => c.id === itemId), [claims]);

  const value = useMemo(() => ({ claims, addClaim, cancelClaim, hasClaimed, clearClaims }), [claims, addClaim, cancelClaim, hasClaimed, clearClaims]);

  return <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>;
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error("useClaims must be used inside <ClaimsProvider>");
  return ctx;
}
