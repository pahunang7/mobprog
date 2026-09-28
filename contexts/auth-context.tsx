import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

export type UserRole = "student" | "faculty";

export type AuthUser = {
  name: string;
  identifier: string; // Student ID or institutional email
  role: UserRole;
  photoUri?: string | null; // profile picture (saved on this device)
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  /** Remember a display name against an identifier at registration time, so a
   *  later login with that same identifier can greet the person by name.
   *  Saved on the device (AsyncStorage) so it survives app restarts / page refreshes.
   *  There is still no backend, so it only exists on the device that registered. */
  registerUser: (identifier: string, name: string) => void;
  /** Look up a previously-registered name for an identifier, if any. */
  getRegisteredName: (identifier: string) => string | undefined;
  /** Set (or clear with null) the logged-in user's profile picture. Saved on this device. */
  updatePhoto: (uri: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NAMES_KEY = "ustp_registered_names";
const PHOTOS_KEY = "ustp_profile_photos";
const keyFor = (identifier: string) => identifier.trim().toLowerCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Directory of identifier -> full name, filled in when someone registers
  // and reloaded from device storage when the app starts.
  const registeredNames = useRef<Record<string, string>>({});
  // identifier -> profile picture (data URI / file URI)
  const photos = useRef<Record<string, string>>({});

  useEffect(() => {
    AsyncStorage.getItem(NAMES_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Record<string, string>;
        // saved names first, so anything registered since launch wins
        registeredNames.current = { ...saved, ...registeredNames.current };
      })
      .catch((err) => console.warn("Could not load registered names", err));

    AsyncStorage.getItem(PHOTOS_KEY)
      .then((raw) => {
        if (!raw) return;
        photos.current = { ...(JSON.parse(raw) as Record<string, string>), ...photos.current };
        // if someone is already logged in by the time this loads, attach their photo
        setUser((prev) => (prev && !prev.photoUri ? { ...prev, photoUri: photos.current[keyFor(prev.identifier)] ?? null } : prev));
      })
      .catch((err) => console.warn("Could not load profile photos", err));
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
