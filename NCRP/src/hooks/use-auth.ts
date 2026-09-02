import { useEffect, useState } from "react";
import { readSession, subscribeSession, type Session } from "@/lib/auth";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
    return subscribeSession(() => setSession(readSession()));
  }, []);

  return { session, hydrated, isAuthenticated: !!session };
}
