import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { FiMenu, FiUser } from "react-icons/fi";

export default function TopBar({
  title,
  onMenu,
  right,
}: {
  title: string;
  onMenu: () => void;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-md md:px-10">
      <div className="flex items-center gap-5">
        <button onClick={onMenu} aria-label="Open menu" className="text-lg hover:text-accent">
          <FiMenu />
        </button>
        <div className="flex items-baseline gap-3">
          <span className="label-mono hidden sm:inline">StratMan</span>
          <h1 className="text-base tracking-tight md:text-lg">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {right}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center border border-border hover:border-foreground"
          >
            <FiUser />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-11 z-40 w-40 border border-border bg-card">
              <button
                className="label-mono w-full px-4 py-3 text-left hover:bg-muted hover:text-foreground"
                onClick={() => navigate({ to: "/" })}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function TopNavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="label-mono hidden hover:text-accent sm:inline-flex"
      activeProps={{ className: "text-accent" }}
    >
      {children}
    </Link>
  );
}
