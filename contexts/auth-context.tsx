import { createContext, ReactNode, useContext, useRef, useState } from "react";

export type UserRole = "student" | "faculty";

export type AuthUser = {
  name: string;
  identifier: string; // Student ID or institutional email
  role: UserRole;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  /** Remember a display name against an identifier at registration time, so a
   *  later login with that same identifier can greet the person by name.
   *  This is in-memory only (no backend) and resets on app restart. */
  registerUser: (identifier: string, name: string) => void;
  /** Look up a previously-registered name for an identifier, if any. */
  getRegisteredName: (identifier: string) => string | undefined;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Simple in-memory "directory" of identifier -> full name, populated when
  // someone registers. Not persisted; there's no database to back it with.
  const registeredNames = useRef<Record<string, string>>({});

  const registerUser = (identifier: string, name: string) => {
    if (!identifier) return;
    registeredNames.current[identifier.trim().toLowerCase()] = name.trim();
  };

  const getRegisteredName = (identifier: string) => {
    return registeredNames.current[identifier.trim().toLowerCase()];
  };

  const login = (nextUser: AuthUser) => {
    setUser(nextUser);
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
