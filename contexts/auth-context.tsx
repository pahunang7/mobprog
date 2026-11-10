import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

export type UserRole = "student" | "faculty";

export type AuthUser = {
  name: string;
  identifier: string; // Student ID or institutional email
  role: UserRole;
  photoUri?: string | null; // profile picture (saved on this device)
};

export type AuthResult = { ok: true } | { ok: false; field: "identifier" | "password"; error: string };

type AuthContextType = {
  isLoggedIn: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  /** Remember a display name against an identifier. Saved on the device (AsyncStorage). */
  registerUser: (identifier: string, name: string) => void;
  /** Look up a previously-registered name for an identifier, if any. */
  getRegisteredName: (identifier: string) => string | undefined;
  /** Set (or clear with null) the logged-in user's profile picture. Saved on this device. */
  updatePhoto: (uri: string | null) => void;
  /** Create an account (name + hashed password). Fails if the identifier is already registered. */
  registerAccount: (identifier: string, name: string, password: string, role: UserRole) => Promise<AuthResult>;
  /** Check that an account exists for this identifier/role and the password matches. */
  verifyCredentials: (identifier: string, password: string, role: UserRole) => Promise<AuthResult>;
  /** Change the password of an existing account. Fails if no account exists. */
  resetPassword: (identifier: string, newPassword: string, role: UserRole) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NAMES_KEY = "ustp_registered_names";
const PHOTOS_KEY = "ustp_profile_photos";
const ACCOUNTS_KEY = "ustp_accounts";
const keyFor = (identifier: string) => identifier.trim().toLowerCase();

type StoredAccount = { hash: string; role: UserRole };

// Salted with the identifier so two people with the same password get different hashes
const hashPassword = (identifier: string, password: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${keyFor(identifier)}:${password}`);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // identifier -> full name
  const registeredNames = useRef<Record<string, string>>({});
  // identifier -> profile picture (data URI / file URI)
  const photos = useRef<Record<string, string>>({});
  // identifier -> { password hash, role }
  const accounts = useRef<Record<string, StoredAccount>>({});
  // Resolves once everything above has been loaded from device storage
  const storageReady = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const loadNames = AsyncStorage.getItem(NAMES_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Record<string, string>;
        registeredNames.current = { ...saved, ...registeredNames.current };
      })
      .catch((err) => console.warn("Could not load registered names", err));

    const loadPhotos = AsyncStorage.getItem(PHOTOS_KEY)
      .then((raw) => {
        if (!raw) return;
        photos.current = { ...(JSON.parse(raw) as Record<string, string>), ...photos.current };
        setUser((prev) => (prev && !prev.photoUri ? { ...prev, photoUri: photos.current[keyFor(prev.identifier)] ?? null } : prev));
      })
      .catch((err) => console.warn("Could not load profile photos", err));

    const loadAccounts = AsyncStorage.getItem(ACCOUNTS_KEY)
      .then((raw) => {
        if (!raw) return;
        accounts.current = { ...(JSON.parse(raw) as Record<string, StoredAccount>), ...accounts.current };
      })
      .catch((err) => console.warn("Could not load accounts", err));

    storageReady.current = Promise.all([loadNames, loadPhotos, loadAccounts]).then(() => undefined);
  }, []);

  const registerUser = (identifier: string, name: string) => {
    if (!identifier) return;
    registeredNames.current[keyFor(identifier)] = name.trim();
    AsyncStorage.setItem(NAMES_KEY, JSON.stringify(registeredNames.current)).catch((err) => console.warn("Could not save registered names", err));
  };

  const getRegisteredName = (identifier: string) => {
    return registeredNames.current[keyFor(identifier)];
  };

  const updatePhoto = (uri: string | null) => {
    if (!user) return;
    const key = keyFor(user.identifier);
    if (uri) photos.current[key] = uri;
    else delete photos.current[key];
    AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos.current)).catch((err) => console.warn("Could not save profile photo", err));
    setUser((prev) => (prev ? { ...prev, photoUri: uri } : prev));
  };

  const saveAccounts = () => AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.current));

  const registerAccount = async (identifier: string, name: string, password: string, role: UserRole): Promise<AuthResult> => {
    await storageReady.current;
    const key = keyFor(identifier);
    if (accounts.current[key]) {
      return { ok: false, field: "identifier", error: "An account with this ID/email already exists. Please log in instead." };
    }
    try {
      accounts.current[key] = { hash: await hashPassword(identifier, password), role };
      await saveAccounts();
    } catch (err) {
      console.warn("Could not save account", err);
      delete accounts.current[key];
      return { ok: false, field: "identifier", error: "Couldn't create the account. Please try again." };
    }
    registerUser(identifier, name);
    return { ok: true };
  };

  const verifyCredentials = async (identifier: string, password: string, role: UserRole): Promise<AuthResult> => {
    await storageReady.current;
    const account = accounts.current[keyFor(identifier)];
    if (!account) {
      return {
        ok: false,
        field: "identifier",
        error: `No account found for this ${role === "student" ? "Student ID" : "email"}. Please create an account first.`,
      };
    }
    if (account.role !== role) {
      return { ok: false, field: "identifier", error: `This account is registered as ${account.role}. Switch the role toggle above.` };
    }
    const hash = await hashPassword(identifier, password);
    if (hash !== account.hash) {
      return { ok: false, field: "password", error: "Incorrect password." };
    }
    return { ok: true };
  };

  const resetPassword = async (identifier: string, newPassword: string, role: UserRole): Promise<AuthResult> => {
    await storageReady.current;
    const key = keyFor(identifier);
    const account = accounts.current[key];
    if (!account || account.role !== role) {
      return { ok: false, field: "identifier", error: "No account found for this ID/email." };
    }
    try {
      accounts.current[key] = { ...account, hash: await hashPassword(identifier, newPassword) };
      await saveAccounts();
    } catch (err) {
      console.warn("Could not update password", err);
      return { ok: false, field: "password", error: "Couldn't update the password. Please try again." };
    }
    return { ok: true };
  };

  const login = (nextUser: AuthUser) => {
    setUser({ ...nextUser, photoUri: photos.current[keyFor(nextUser.identifier)] ?? null });
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        registerUser,
        getRegisteredName,
        updatePhoto,
        registerAccount,
        verifyCredentials,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
