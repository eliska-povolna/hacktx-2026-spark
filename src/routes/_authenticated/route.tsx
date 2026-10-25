import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth";
import bgRealm from "@/assets/bg-realm.jpg";

// Client-side guard: this frontend-only project keeps the session in
// localStorage (see src/lib/auth.tsx), so beforeLoad cannot see it during SSR.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-display text-lg text-gold">Consulting the guild archives...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <img
        src={bgRealm}
        alt=""
        width={1920}
        height={1088}
        className="fixed inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <div className="candle-glow fixed inset-0 -z-10" />

      <div className="flex">
        <AppSidebar />
        <main className="min-w-0 flex-1 px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
