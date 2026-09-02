import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { TopBar } from "@/components/shell/TopBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { EntityDrawerProvider } from "@/components/intel/EntityLinks";
import { IntelFilterProvider } from "@/lib/filter-context";
import { useSession } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="num text-7xl font-semibold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Console route not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This intelligence surface does not exist or has been retired.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This console panel didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NCRP Telecom Intelligence Console" },
      {
        name: "description",
        content:
          "Cyber intelligence console for suspect mobile numbers, IMEI, and SIM points of sale reported on NCRP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/logo.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated, hydrated } = useSession();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (hydrated && !isAuthenticated && !isLogin) navigate({ to: "/login", replace: true });
  }, [hydrated, isAuthenticated, isLogin, navigate]);

  if (isLogin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-xs tracking-widest text-muted-foreground uppercase">
          Verifying operator session…
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <IntelFilterProvider>
        <EntityDrawerProvider>
          <div className="flex min-h-screen bg-background">
            <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            <div className="relative flex min-w-0 flex-1 flex-col">
              <div className="grid-canvas pointer-events-none absolute inset-0 opacity-60" />
              <TopBar onOpenPalette={() => setPalette(true)} />
              <main className="relative min-w-0 flex-1 px-4 pt-5 pb-12 sm:px-6">
                <Outlet />
              </main>
            </div>
          </div>
          <CommandPalette open={palette} onOpenChange={setPalette} />
        </EntityDrawerProvider>
      </IntelFilterProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
