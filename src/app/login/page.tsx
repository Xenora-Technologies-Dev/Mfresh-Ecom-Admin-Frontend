"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Store,
  Shield,
  ArrowRight,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  getDashboardPath,
  useAuthStore,
  type PortalRole,
} from "@/store/auth-store";
import { cn } from "@/lib/utils";

const roles: {
  id: PortalRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    id: "buyer",
    title: "Buyer",
    description: "Source products, manage orders, and connect with verified suppliers.",
    icon: ShoppingBag,
    accent: "border-sky-500/30 bg-sky-50 text-sky-700 ring-sky-500/20",
  },
  {
    id: "seller",
    title: "Seller",
    description: "List products, manage inventory, and grow your B2B food business.",
    icon: Store,
    accent: "border-emerald-500/30 bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  },
  {
    id: "admin",
    title: "Operations",
    description: "Manage marketplace content, users, and platform configuration.",
    icon: Shield,
    accent: "border-violet-500/30 bg-violet-50 text-violet-700 ring-violet-500/20",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const initialRole = (searchParams.get("role") as PortalRole) || "buyer";
  const [selectedRole, setSelectedRole] = useState<PortalRole>(
    roles.some((r) => r.id === initialRole) ? initialRole : "buyer",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const displayName =
      name.trim() ||
      (selectedRole === "buyer"
        ? "Buyer Account"
        : selectedRole === "seller"
          ? "Seller Account"
          : "Operations Admin");

    login({
      email: email.trim() || `${selectedRole}@mfresh.com`,
      name: displayName,
      role: selectedRole,
      company: selectedRole !== "admin" ? "Demo Company" : undefined,
    });

    setTimeout(() => {
      router.push(getDashboardPath(selectedRole));
    }, 400);
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[45%] overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <div className="inline-block rounded-xl bg-white p-3">
            <Image src="/logo.png" alt="MFresh" width={140} height={48} className="h-10 w-auto" />
          </div>
          <h1 className="mt-10 text-3xl font-bold leading-tight text-white xl:text-4xl">
            Your gateway to global B2B food trade
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
            One secure portal for buyers, sellers, and marketplace operations —
            built for international procurement at scale.
          </p>
        </div>
        <div className="relative grid gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="rounded-lg bg-white/10 p-2">
                <role.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{role.title}</p>
                <p className="mt-0.5 text-sm text-white/70">{role.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="inline-block rounded-xl bg-white p-2 shadow-sm ring-1 ring-border">
              <Image src="/logo.png" alt="MFresh" width={120} height={40} className="h-8 w-auto" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Sign in to MFresh Portal</h2>
            <p className="mt-2 text-sm text-muted">
              Select your role and access your dedicated workspace.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all",
                  selectedRole === role.id
                    ? cn(role.accent, "ring-2")
                    : "border-border bg-white text-muted hover:border-primary/20",
                )}
              >
                <role.icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{role.title}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            New to MFresh?{" "}
            <Link
              href={
                selectedRole === "seller"
                  ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006"}/become-seller`
                  : `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006"}/become-buyer`
              }
              className="font-medium text-primary hover:underline"
            >
              Register on the storefront
            </Link>
          </p>

          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
            Demo mode — authentication backend will be connected in a future release.
          </p>
        </div>
      </div>
    </div>
  );
}
