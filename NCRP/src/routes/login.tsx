import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Lock, ShieldCheck, TriangleAlert, User } from "lucide-react";
import { signIn } from "@/lib/auth";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Secure Sign-in | NCRP Telecom Intelligence" },
      { name: "description", content: "Restricted access console for MHA I4C telecom cyber-intelligence operators." },
      { property: "og:title", content: "Secure Sign-in | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Restricted access console for MHA I4C telecom cyber-intelligence operators." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hydrated } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated) navigate({ to: "/", replace: true });
  }, [hydrated, isAuthenticated, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = signIn(username, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Authentication failed.");
      return;
    }
    setError(null);
    navigate({ to: "/", replace: true });
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="grid-canvas pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[32rem] rounded-full bg-violet/20 blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative grid w-full max-w-4xl gap-0 overflow-hidden rounded-3xl border border-border bg-surface-1/80 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]"
      >
        <div className="relative hidden flex-col justify-between border-r border-border bg-surface-2/50 p-8 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <div className="text-sm font-semibold tracking-tight">NCRP Telecom Intelligence</div>
                <div className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  MHA · I4C · Cyber Crime Division
                </div>
              </div>
            </div>
            <h1 className="mt-8 text-2xl leading-tight font-semibold tracking-tight">
              Restricted cyber-intelligence console
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Suspect mobile numbers, IMEI, SIM points of sale, Pratibimb GIS plots and CEIR blocking lifecycle for
              authorised law-enforcement operators only.
            </p>
          </div>
          <ul className="mt-8 space-y-2 text-xs text-muted-foreground">
            {[
              "All sessions are audited under the I4C access policy",
              "Data is classified — no external redistribution",
              "Unauthorised access is punishable under IT Act, 2000",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Lock className="mt-0.5 size-3.5 text-primary" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} className="p-8">
          <div className="mb-6 lg:hidden">
            <span className="grid size-11 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
              <ShieldCheck className="size-5" />
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Operator sign-in</h2>
          <p className="mt-1 text-xs text-muted-foreground">Authenticate with your I4C directory credentials.</p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Username
            </span>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Operator ID"
                className="num h-11 w-full rounded-xl border border-border bg-surface-2/70 pr-3 pl-10 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Password
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Passphrase"
                className="h-11 w-full rounded-xl border border-border bg-surface-2/70 pr-3 pl-10 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </label>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Sign in to console"}
          </button>

          <div className="mt-6 rounded-xl border border-border bg-surface-2/60 px-4 py-3">
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Note</div>
            <div className="mt-1 text-xs font-medium">Demo credentials</div>
            <dl className="num mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Username:</dt>
                <dd>HQ_ANALYST</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Password:</dt>
                <dd>Password@123</dd>
              </div>
            </dl>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
