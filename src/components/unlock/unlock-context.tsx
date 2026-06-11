"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UnlockContextType {
  unlocked: boolean;
  unlock: () => void;
}

const UnlockContext = createContext<UnlockContextType>({
  unlocked: false,
  unlock: () => {},
});

const STORAGE_KEY = "bandao_unlock";

export function UnlockProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {}
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  return (
    <UnlockContext.Provider value={{ unlocked, unlock }}>
      {children}
    </UnlockContext.Provider>
  );
}

export function useUnlock() {
  return useContext(UnlockContext);
}
