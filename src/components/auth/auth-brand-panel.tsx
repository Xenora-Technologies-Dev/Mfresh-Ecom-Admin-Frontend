import Image from "next/image";
import { Shield, UserPlus, Settings } from "lucide-react";

const highlights = [
  {
    title: "Invite-only access",
    description: "Operations admins join by invitation. There is no public signup for this portal.",
    icon: UserPlus,
  },
  {
    title: "Marketplace control",
    description: "Manage catalog, orders, banners, suppliers, and storefront content.",
    icon: Settings,
  },
  {
    title: "Secure operations",
    description: "Clerk handles authentication. Buyer and seller accounts use the storefront instead.",
    icon: Shield,
  },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden w-[45%] overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
      <div className="relative">
        <div className="inline-block rounded-xl bg-white p-3">
          <Image src="/logo.png" alt="MFresh" width={140} height={48} className="h-10 w-auto" />
        </div>
        <h1 className="mt-10 text-3xl font-bold leading-tight text-white xl:text-4xl">
          MFresh Operations Portal
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
          Sign in with your invited administrator account to manage marketplace operations.
        </p>
      </div>
      <div className="relative grid gap-4">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="rounded-lg bg-white/10 p-2">
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-0.5 text-sm text-white/70">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
