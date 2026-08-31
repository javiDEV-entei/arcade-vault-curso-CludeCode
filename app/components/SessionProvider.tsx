"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface SessionUser {
  name: string; // mayúsculas, máx. 10 caracteres
}

interface SessionContextValue {
  user: SessionUser | null;
  signIn: (name: string) => void;
  signInAsGuest: () => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Estado en memoria: se pierde al recargar. Sin efectos ni almacenamiento.
  const [user, setUser] = useState<SessionUser | null>(null);

  const signIn = useCallback((name: string) => {
    const clean = (name || "PLAYER1").toUpperCase().slice(0, 10);
    setUser({ name: clean });
  }, []);

  const signInAsGuest = useCallback(() => {
    setUser(null);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, signIn, signInAsGuest, signOut }),
    [user, signIn, signInAsGuest, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}
