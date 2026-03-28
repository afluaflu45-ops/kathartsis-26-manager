import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Wallet, Receipt, Award, Medal, FileText, Trophy, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/stickers", label: "Stickers", icon: Award },
  { href: "/certificates", label: "Certificates", icon: Medal },
  { href: "/statement", label: "Account Statement", icon: FileText },
  { href: "/sports", label: "Sports", icon: Trophy },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <nav className="px-4 py-2 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const logo = (
    <div className="p-5 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-serif font-bold text-lg leading-none">K</span>
        </div>
        KathArtsis
      </h1>
      <p className="text-xs text-muted-foreground mt-1 ml-9 md:ml-10">Manager Portal</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card shadow-sm flex-shrink-0 flex-col print-hide">
        {logo}
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b flex items-center justify-between px-4 py-3 print-hide">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-serif font-bold text-base leading-none">K</span>
          </div>
          KathArtsis
        </h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 z-40 w-72 bg-card shadow-xl flex flex-col pt-16 print-hide">
            {navContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
