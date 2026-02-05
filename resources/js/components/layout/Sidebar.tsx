import { usePage } from "@inertiajs/react";
import { NavLink } from "@/components/NavLink";
import {
  FileText,
  ClipboardList,
  Receipt,
  History,
  Banknote,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Invoice Form", icon: FileText },
  { path: "/manage", label: "Manage Invoices", icon: ClipboardList },
  { path: "/tax-invoice", label: "Tax Invoice", icon: Receipt },
  { path: "/history", label: "Invoice History", icon: History },
  { path: "/cash-sale", label: "Cash Sale", icon: Banknote },
  { path: "/clients", label: "Client Details", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const page = usePage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-sidebar-foreground rounded-xl shadow-elevated"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              Fuel <span className="text-primary">Invoice </span>Pro 2.0
            </h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1">
              Tax Invoice Management
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = page.url === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/40 text-center">
              Designed by DE Creations (PVT) Ltd.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
