const KEY = "ncrp.telecom.session";

export interface Session {
  username: string;
  role: string;
  unit: string;
  loginAt: string;
}

export const DEMO_USERNAME = "HQ_ANALYST";
export const DEMO_PASSWORD = "Password@123";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function signIn(username: string, password: string): { ok: boolean; error?: string } {
  if (!username.trim() || !password) {
    return { ok: false, error: "Both operator ID and passphrase are required." };
  }
  if (username.trim().toUpperCase() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    return {
      ok: false,
      error: "Authentication failed — operator ID or passphrase is not recognised by the I4C directory.",
    };
  }
  const session: Session = {
    username: DEMO_USERNAME,
    role: "HQ Intelligence Analyst",
    unit: "MHA · I4C Telecom Cell",
    loginAt: new Date().toISOString(),
  };
  window.localStorage.setItem(KEY, JSON.stringify(session));
  emit();
  return { ok: true };
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  emit();
}

export function subscribeSession(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}
