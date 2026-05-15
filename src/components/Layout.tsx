import { Activity, Bell, CalendarPlus, ClipboardList, History, Home, LogOut, Megaphone, Menu, Pill, Search, ShieldCheck, Stethoscope, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useClinicStore } from "../store/clinicStore";
import type { Role } from "../types";
import { Badge, Toast } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);
const isAnnouncementLive = (announcement: { isActive: boolean; startDate: string; endDate: string }) =>
  announcement.isActive && announcement.startDate <= today() && announcement.endDate >= today();
const formatDisplayDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
const formatAnnouncementRange = (announcement: { startDate: string; endDate: string }) => `${formatDisplayDate(announcement.startDate)} to ${formatDisplayDate(announcement.endDate)}`;

const roleHome: Record<Role, string> = {
  Doctor: "/doctor/dashboard",
  Nurse: "/nurse/dashboard",
  "Medical Department": "/medical/dashboard",
};

const navItems: Record<Role, { to: string; label: string; icon: React.ElementType; group: string }[]> = {
  Nurse: [
    { to: "/nurse/dashboard", label: "Dashboard", icon: Home, group: "Reception" },
    { to: "/nurse/appointments", label: "Appointments", icon: CalendarPlus, group: "Reception" },
    { to: "/nurse/history", label: "Patient History", icon: History, group: "Records" },
  ],
  Doctor: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: Home, group: "Clinical" },
    { to: "/doctor/announcement", label: "Announcement", icon: Megaphone, group: "Clinic Ops" },
    { to: "/doctor/staff", label: "Staff Management", icon: Users, group: "Clinic Ops" },
  ],
  "Medical Department": [
    { to: "/medical/dashboard", label: "Dashboard", icon: Home, group: "Pharmacy" },
    { to: "/medical/prescriptions", label: "Prescriptions", icon: ClipboardList, group: "Pharmacy" },
    { to: "/medical/billing", label: "Billing", icon: Pill, group: "Revenue" },
  ],
};

const routeTitles: Record<string, string> = {
  "/nurse/dashboard": "Reception Command Center",
  "/nurse/appointments": "Appointment Registration",
  "/nurse/history": "Patient Records",
  "/doctor/dashboard": "Doctor Clinical Console",
  "/doctor/announcement": "Doctor Availability",
  "/doctor/staff": "Staff Administration",
  "/medical/dashboard": "Pharmacy Operations",
  "/medical/prescriptions": "Prescription Queue",
  "/medical/billing": "Billing Worklist",
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
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;

  const items = navItems[user.role];
  const groups = [...new Set(items.map((item) => item.group))];
  const title = routeTitles[location.pathname] ?? "Clinical Workspace";

  return (
    <div className="min-h-screen bg-[#eaf0fb]">
      <Toast />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-blue-950/40 bg-[#102a5c] text-white shadow-clinical transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate(roleHome[user.role])}>
            <div className="rounded-lg bg-white/15 p-2.5 text-white shadow-sm ring-1 ring-white/20"><Stethoscope size={23} /></div>
            <div>
              <p className="text-lg font-black text-white">Svastya Hospital</p>
              <p className="text-xs font-semibold text-blue-100">Enterprise HMS suite</p>
            </div>
          </button>
          <button className="rounded-md p-2 text-blue-100 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="mx-4 mt-4 rounded-lg border border-white/10 bg-white/10 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-blue-100">Signed in as</p>
              <p className="mt-1 font-black text-white">{user.name}</p>
            </div>
            <ShieldCheck className="text-blue-100" size={22} />
          </div>
          <div className="mt-3"><Badge status="AVAILABLE" /></div>
        </div>

        <nav className="mt-5 space-y-5 px-3">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 text-xs font-black uppercase text-blue-200/80">{group}</p>
              <div className="mt-2 space-y-1">
                {items.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition duration-200",
                          isActive
                            ? "bg-white text-[#102a5c] shadow-sm shadow-blue-950/20 ring-1 ring-white/20 before:h-5 before:w-1 before:rounded-full before:bg-blue-700"
                            : "text-blue-50 hover:bg-white/10 hover:text-white",
                        )
                      }
                    >
                      <Icon size={18} /> {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/10 bg-white/10 p-4">
          <p className="text-xs font-bold uppercase text-blue-200">Clinic status</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Activity size={16} />
            OPD workflow active
          </div>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 shadow-sm shadow-blue-100/70 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-blue-700">{user.role}</p>
                <h1 className="truncate text-xl font-black text-slate-950">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="hidden min-w-64 items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-700 shadow-sm md:flex">
                <Search size={16} /> Search patients, tokens, records
              </button>
              <button className="hidden rounded-lg border border-blue-100 bg-white p-2 text-blue-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-800 sm:inline-flex" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut size={17} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {isAnnouncementLive(announcement) && announcement.message.trim() && (
            <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:px-6">
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                <Activity size={15} />
                <b>Doctor Announcement:</b>
                <span>From {formatAnnouncementRange(announcement)}</span>
                <span className="text-amber-800">/ {announcement.message}</span>
              </span>
            </div>
          )}
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
