import { Activity, Bell, CalendarPlus, ClipboardList, History, Home, LogOut, Megaphone, Menu, Pill, Search, ShieldCheck, Stethoscope, Users } from "lucide-react";
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
    <div className="min-h-screen">
      <Toast />
      <aside className={clsx("fixed inset-y-0 left-0 z-40 w-72 border-r border-clinic-100 bg-gradient-to-b from-clinic-900 via-clinic-800 to-slate-950 text-white shadow-clinical transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="rounded-lg bg-white/15 p-2.5 text-white shadow-sm ring-1 ring-white/20"><Stethoscope size={23} /></div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">Aarogya OPD</p>
            <p className="text-xs font-semibold text-clinic-100">Clinical workflow suite</p>
          </div>
        </div>
        <div className="mx-4 mt-4 rounded-lg border border-white/10 bg-white/10 p-3 backdrop-blur">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={17} />
            <p className="text-sm font-black">Secure Demo</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-clinic-100">Frontend-only local clinic data with role-based access.</p>
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
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition duration-200",
                    isActive
                      ? "bg-white text-clinic-900 shadow-sm"
                      : "text-clinic-50 hover:bg-white/10 hover:text-white",
                  )
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
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 shadow-sm shadow-slate-200/40 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-clinic-700">{user.role}</p>
                <h1 className="text-xl font-black tracking-tight text-slate-950">Welcome, {user.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 shadow-sm md:flex">
                <Search size={16} /> Search records
              </button>
              <button className="hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-clinic-25 hover:text-clinic-700 sm:inline-flex" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
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
            <div className="border-t border-clinic-100 bg-clinic-50 px-4 py-2 text-sm font-semibold text-clinic-800 sm:px-6">
              <span className="inline-flex items-center gap-2"><Activity size={15} /> {announcement.message}</span>
            </div>
          )}
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
