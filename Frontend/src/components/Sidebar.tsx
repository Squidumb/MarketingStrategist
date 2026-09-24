import { Link, useLocation } from "@tanstack/react-router";
import { FiBarChart2, FiMessageSquare, FiUploadCloud, FiX, FiZap } from "react-icons/fi";

const navItems = [
  { path: "/setup", icon: <FiUploadCloud />, label: "Setup", index: "01" },
  { path: "/dashboard", icon: <FiBarChart2 />, label: "Dashboard", index: "02" },
  { path: "/chatbot", icon: <FiMessageSquare />, label: "Chatbot", index: "03" },
  { path: "/campaign-strategy", icon: <FiZap />, label: "Strategy", index: "04" },
] as const;

export default function Sidebar({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px]"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[19rem] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-sidebar-border p-7">
          <div>
            <span className="label-mono text-sidebar-foreground/50">Agentic Marketing</span>
            <div className="display-xl mt-2 text-3xl">StratMan</div>
          </div>
          <button onClick={toggleSidebar} aria-label="Close menu" className="p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <FiX />
          </button>
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) toggleSidebar();
                }}
                className={`group flex items-center gap-4 border-b border-sidebar-border px-7 py-5 transition-colors ${
                  active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
                }`}
              >
                <span className="label-mono text-sidebar-foreground/40">{item.index}</span>
                <span className={`text-lg ${active ? "text-sidebar-primary" : "text-sidebar-foreground/70"}`}>
                  {item.icon}
                </span>
                <span className="text-base tracking-tight">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 bg-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 border-t border-sidebar-border p-7">
          <div className="flex h-10 w-10 items-center justify-center border border-sidebar-border font-mono text-sm">
            U
          </div>
          <div className="leading-tight">
            <div className="text-sm">User</div>
            <div className="label-mono text-sidebar-foreground/40">Marketing Team</div>
          </div>
        </div>
      </aside>
    </>
  );
}
