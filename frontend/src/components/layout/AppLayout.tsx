import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Upload,
  MessageSquareText,
  Bell,
  UserCircle,
  Users,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  X,
  FileText,
  BarChart3,
  ClipboardList,
  Inbox,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui";
import UokLogo from "@/components/UokLogo";
import { api } from "@/lib/api";
import type { Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const PORTAL_LABEL: Record<Role, string> = {
  STUDENT: "Student Portal",
  SUPERVISOR: "Supervisor Portal",
  HOD: "HOD Portal",
};

const NAV: Record<Role, NavSection[]> = {
  STUDENT: [
    {
      items: [{ to: "/profile", label: "Personal Profile", icon: UserCircle }],
    },
    {
      title: "SUPERVISION",
      items: [
        { to: "/student", label: "My Project", icon: LayoutDashboard },
        { to: "/student/tasks", label: "Tasks & Milestones", icon: ListChecks },
        { to: "/student/submissions", label: "Submissions", icon: Upload },
        { to: "/student/feedback", label: "Feedback", icon: MessageSquareText },
      ],
    },
    {
      title: "EXAMINATION",
      items: [
        { to: "/student/progress", label: "Progress Tracker", icon: FileText },
        { to: "/alerts", label: "Notifications", icon: Bell },
      ],
    },
  ],
  SUPERVISOR: [
    {
      items: [{ to: "/profile", label: "Personal Profile", icon: UserCircle }],
    },
    {
      title: "SUPERVISION",
      items: [
        { to: "/supervisor", label: "Dashboard", icon: LayoutDashboard },
        { to: "/supervisor/students", label: "My Students", icon: Users },
        { to: "/supervisor/reviews", label: "Reviews", icon: ClipboardCheck },
      ],
    },
    {
      title: "ALERTS",
      items: [{ to: "/alerts", label: "Notifications", icon: Bell }],
    },
  ],
  HOD: [
    {
      items: [{ to: "/profile", label: "Personal Profile", icon: UserCircle }],
    },
    {
      title: "DEPARTMENT",
      items: [
        { to: "/hod", label: "Dashboard", icon: LayoutDashboard },
        { to: "/hod/proposals", label: "Topic Applicants", icon: ClipboardList },
        { to: "/hod/requests", label: "Supervisor Requests", icon: Inbox },
        { to: "/hod/supervisors", label: "Supervisors", icon: Users },
        { to: "/hod/students", label: "Students", icon: GraduationCap },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { to: "/hod/faculty", label: "Faculty Overview", icon: BarChart3 },
        { to: "/alerts", label: "Notifications", icon: Bell },
      ],
    },
  ],
};

function SidebarNav({
  sections,
  role,
  unread,
  onNavigate,
}: {
  sections: NavSection[];
  role: Role;
  unread: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {sections.map((section, si) => (
        <div key={si} className={si > 0 ? "mt-5" : ""}>
          {section.title && (
            <p className="mb-2 px-3 text-[11px] font-bold tracking-wider text-campus-sky">
              {section.title}
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavLink
                key={`${section.title}-${item.to}-${item.label}`}
                to={item.to}
                end={item.to === `/${role.toLowerCase()}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <item.icon size={18} strokeWidth={1.75} className="shrink-0" />
                <span>{item.label}</span>
                {item.to === "/alerts" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    api
      .get<{ count: number }>("/notifications/unread-count")
      .then((res) => setUnread(res.data.count))
      .catch(() => {});
  }, [location.pathname]);

  if (!user) return null;
  const sections = NAV[user.role];

  return (
    <div className="flex h-full bg-campus-page">
      {/* Desktop sidebar — always visible */}
      <aside className="hidden w-64 shrink-0 flex-col bg-campus-maroon text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <UokLogo variant="light" />
          <p className="mt-2 text-[11px] font-medium text-white/60">
            {user.role === "HOD" && user.department
              ? `${user.department} Head of Department Portal`
              : PORTAL_LABEL[user.role]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav sections={sections} role={user.role} unread={unread} />
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto bg-campus-maroon text-white shadow-xl transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <UokLogo variant="light" />
          <p className="mt-2 text-[11px] font-medium text-white/60">
            {user.role === "HOD" && user.department
              ? `${user.department} Head of Department Portal`
              : PORTAL_LABEL[user.role]}
          </p>
        </div>

        <div className="flex-1 px-3 py-4">
          <SidebarNav
            sections={sections}
            role={user.role}
            unread={unread}
            onNavigate={() => setOpen(false)}
          />
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 bg-campus-gold px-4 shadow-sm lg:px-8">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-white">E-Supervision Portal</p>
            <p className="text-xs text-white/80">{PORTAL_LABEL[user.role]}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/alerts"
              className="relative rounded-lg p-2 text-white hover:bg-white/10"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-white/80">
                  {user.role === "HOD"
                    ? `${user.department || "Department"} Head`
                    : user.role === "SUPERVISOR"
                      ? `${user.department || "Department"} Supervisor`
                      : user.program || "Student"}
                </p>
              </div>
              <Avatar name={user.fullName} src={user.avatarUrl} size={40} />
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
