import { Activity, CalendarPlus, ClipboardList, History, Home, LogOut, Megaphone, Menu, Pill, Search, Stethoscope, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useClinicStore } from "../store/clinicStore";
import type { Role } from "../types";
import { Toast } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);
const isAnnouncementLive = (announcement: { isActive: boolean; startDate: string; endDate: string }) =>
  announcement.isActive && announcement.startDate <= today() && announcement.endDate >= today();

const roleHome: Record<Role, string> = {
  Doctor: "/doctor/dashboard",
  Nurse: "/nurse/dashboard",
  "Medical Department": "/medical/dashboard",
};

const navItems: Record<Role, { to: string; label: string; icon: React.ElementType }[]> = {
  Nurse: [
    { to: "/nurse/dashboard", label: "Dashboard", icon: Home },
    { to: "/nurse/appointments", label: "Appointments", icon: CalendarPlus },
    { to: "/nurse/history", label: "Patient History", icon: History },
  ],
  Doctor: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: Home },
    { to: "/doctor/announcement", label: "Announcement", icon: Megaphone },
    { to: "/doctor/staff", label: "Staff Management", icon: Users },
  ],
  "Medical Department": [
    { to: "/medical/dashboard", label: "Dashboard", icon: Home },
    { to: "/medical/prescriptions", label: "Prescriptions", icon: ClipboardList },
    { to: "/medical/billing", label: "Billing", icon: Pill },
  ],
};

export function RequireAuth({ role }: { role?: Role }) {
  const user = useClinicStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={roleHome[user.role]} replace />;
  return <Outlet />;
}

export function AppLayout() {
  const user = useClinicStore((state) => state.user);
  const logout = useClinicStore((state) => state.logout);
  const announcement = useClinicStore((state) => state.announcement);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  const items = navItems[user.role];
  return (
    <div className="min-h-screen bg-slate-50">
      <Toast />
      <aside className={clsx("fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="rounded-lg bg-blue-600 p-2 text-white"><Stethoscope size={22} /></div>
          <div>
            <p className="font-bold text-slate-950">Aarogya OPD</p>
            <p className="text-xs text-slate-500">Clinic Management Demo</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition", isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100")
                }
              >
                <Icon size={18} /> {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
              <div>
                <p className="text-sm font-semibold text-slate-500">{user.role}</p>
                <h1 className="text-xl font-bold text-slate-950">Welcome, {user.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 md:flex">
                <Search size={16} /> OPD demo
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut size={17} /> Logout
              </button>
            </div>
          </div>
          {isAnnouncementLive(announcement) && (
            <div className="border-t border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 sm:px-6">
              <span className="inline-flex items-center gap-2"><Activity size={15} /> {announcement.message}</span>
            </div>
          )}
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
