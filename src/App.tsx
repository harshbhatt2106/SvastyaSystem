import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowRight, Bed, BellRing, Building2, CalendarDays, CheckCircle2, ClipboardList, Clock3, CreditCard, Edit, Eye, FilePlus2, FlaskConical, HeartPulse, LockKeyhole, MonitorCheck, PackagePlus, Pill, Plus, Search, Send, ShieldCheck, Stethoscope, Trash2, UserCheck, UserCog, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppLayout, RequireAuth } from "./components/Layout";
import { Badge, Button, ConfirmDialog, EmptyState, Input, Label, Modal, Panel, Select, SkeletonRows, StatCard, Textarea, Toast } from "./components/ui";
import { currency, fullName, todaysAppointments, useClinicStore } from "./store/clinicStore";
import type { FormEvent } from "react";
import type { Appointment, MedicineItem, Patient, Staff } from "./types";

const today = () => new Date().toISOString().slice(0, 10);
const isDoctorUnavailable = (announcement: { isActive: boolean; startDate: string; endDate: string }) => {
  const current = today();
  return announcement.isActive && announcement.startDate <= current && announcement.endDate >= current;
};
const formatDisplayDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
const formatAnnouncementRange = (announcement: { startDate: string; endDate: string }) => `${formatDisplayDate(announcement.startDate)} to ${formatDisplayDate(announcement.endDate)}`;
const appointmentCaseType = (appointment: Appointment, patient?: Patient) => appointment.caseType ?? (patient && patient.totalVisits > 0 ? "OLD" : "NEW");
const appointmentFee = (appointment: Appointment, patient?: Patient) => appointment.consultationFee ?? (appointmentCaseType(appointment, patient) === "NEW" ? 200 : 100);

function AnnouncementNotice({
  announcement,
  live,
  compact = false,
}: {
  announcement: { message: string; startDate: string; endDate: string; isActive: boolean };
  live: boolean;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-amber-100 p-2 text-amber-800"><Clock3 size={18} /></div>
          <div>
            <p className="text-xs font-black uppercase text-amber-700">Doctor Announcement</p>
            <p className="text-sm font-bold text-amber-950">From {formatAnnouncementRange(announcement)}</p>
          </div>
        </div>
        <Badge status={live ? "NOT AVAILABLE" : "AVAILABLE"} />
      </div>
      <div className={compact ? "px-4 py-3" : "px-5 py-4"}>
        <p className={compact ? "text-base font-black text-slate-950" : "text-xl font-black text-slate-950"}>{announcement.message}</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          This notice applies from {formatAnnouncementRange(announcement)}.
        </p>
      </div>
    </div>
  );
}

function ExecutiveOverview({ rows, title = "Hospital Command Overview" }: { rows: ReturnType<typeof useTodayRows>; title?: string }) {
  const completed = rows.filter((row) => ["COMPLETED", "SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(row.appointment.status)).length;
  const waiting = rows.filter((row) => row.appointment.status === "WAITING").length;
  const revenue = rows.reduce((sum, row) => sum + (row.appointment.feeCollected ? appointmentFee(row.appointment, row.patient) : 0), 0);
  const kpis = [
    { title: "Patients", value: rows.length, icon: <Users />, helper: "Today's registered OPD flow", tone: "blue" as const },
    { title: "Appointments", value: rows.length + 8, icon: <CalendarDays />, helper: `${waiting} waiting for care`, tone: "amber" as const },
    { title: "Revenue", value: currency(revenue), icon: <CreditCard />, helper: "Collected consultation fees", tone: "green" as const },
  ];
  return (
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-clinical">
      <div className="grid gap-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-clinic-50 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-clinic-100 bg-white px-3 py-1.5 text-xs font-black uppercase text-clinic-700 shadow-sm">
            <ShieldCheck size={15} /> Enterprise Healthcare Suite
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A calm, role-aware operating surface for patient flow, clinical work, billing, pharmacy, lab, staff, and bed management.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">System Health</p>
            <p className="mt-2 text-2xl font-black text-emerald-800">99.9%</p>
            <p className="mt-1 text-xs font-semibold text-emerald-700">Live OPD, billing, and pharmacy</p>
          </div>
          <div className="rounded-lg border border-clinic-100 bg-white p-4">
            <p className="text-xs font-black uppercase text-clinic-700">Completed Cases</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{completed}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Consultation progress today</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 bg-blue-50/30 p-5 sm:p-6 md:grid-cols-3">
        {kpis.map((kpi) => <StatCard key={kpi.title} {...kpi} />)}
      </div>
    </section>
  );
}

function ModuleGrid() {
  const modules = [
    { name: "Patient Registration", detail: "Profiles, old cases, visit history", icon: Users, tone: "clinic" },
    { name: "Appointment Scheduling", detail: "Tokens, date planning, OPD queue", icon: CalendarDays, tone: "sky" },
    { name: "Doctor Management", detail: "Clinical console and prescriptions", icon: Stethoscope, tone: "emerald" },
    { name: "OPD / IPD Workflow", detail: "Consultation, admission, discharge", icon: Activity, tone: "amber" },
    { name: "Billing & Invoices", detail: "Fees, invoices, payment tracking", icon: CreditCard, tone: "slate" },
    { name: "Pharmacy Management", detail: "Prescription queue and stock issue", icon: Pill, tone: "emerald" },
    { name: "Lab Reports", detail: "Diagnostics and report readiness", icon: FlaskConical, tone: "sky" },
    { name: "Staff Management", detail: "Users, roles, access control", icon: UserCog, tone: "clinic" },
    { name: "Bed / Ward Management", detail: "Occupancy, wards, patient stay", icon: Bed, tone: "amber" },
    { name: "Notifications & Alerts", detail: "Doctor notices and workflow alerts", icon: BellRing, tone: "rose" },
  ];
  const toneClass: Record<string, string> = {
    clinic: "bg-clinic-50 text-clinic-700 ring-clinic-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  return (
    <Panel title="Hospital Modules" eyebrow="Complete HMS suite">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {modules.map(({ name, detail, icon: Icon, tone }) => (
          <div key={name} className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-clinic-200 hover:shadow-clinical">
            <div className={`mb-4 inline-flex rounded-md p-2.5 ring-1 ${toneClass[tone]}`}><Icon size={19} /></div>
            <h3 className="text-sm font-black text-slate-950">{name}</h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AlertsPanel() {
  const alerts = [
    ["Pharmacy", "3 prescriptions ready for medicine issue"],
    ["Lab", "2 reports pending doctor review"],
    ["Beds", "ICU capacity at controlled utilization"],
  ];
  return (
    <Panel title="Notifications & Alerts" eyebrow="Live operations">
      <div className="grid gap-3 md:grid-cols-3">
        {alerts.map(([label, detail]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-black uppercase text-clinic-700">{label}</p>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">{detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function patientFor(patients: Patient[], patientId: string) {
  return patients.find((patient) => patient.id === patientId);
}

function useTodayRows() {
  const appointments = useClinicStore((state) => state.appointments);
  const patients = useClinicStore((state) => state.patients);
  return useMemo(
    () =>
      todaysAppointments(appointments)
        .sort((a, b) => a.tokenNumber - b.tokenNumber)
        .map((appointment) => ({ appointment, patient: patientFor(patients, appointment.patientId) }))
        .filter((row): row is { appointment: Appointment; patient: Patient } => Boolean(row.patient)),
    [appointments, patients],
  );
}

function Login() {
  const login = useClinicStore((state) => state.login);
  const user = useClinicStore((state) => state.user);
  const pushToast = useClinicStore((state) => state.pushToast);
  const announcement = useClinicStore((state) => state.announcement);
  const [username, setUsername] = useState("doctor");
  const [password, setPassword] = useState("1234");
  const navigate = useNavigate();
  const showAnnouncement = announcement.isActive && Boolean(announcement.message.trim());
  if (user) return <Navigate to={user.role === "Doctor" ? "/doctor/dashboard" : user.role === "Nurse" ? "/nurse/dashboard" : "/medical/dashboard"} replace />;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!login(username.trim(), password)) {
      pushToast("Invalid username or password.", "error");
      return;
    }
    const role = useClinicStore.getState().user?.role;
    navigate(role === "Doctor" ? "/doctor/dashboard" : role === "Nurse" ? "/nurse/dashboard" : "/medical/dashboard");
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <Toast />
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_440px]">
        {showAnnouncement && <div className="lg:col-span-2"><AnnouncementNotice announcement={announcement} live={isDoctorUnavailable(announcement)} /></div>}
        <section className="relative">
          <div className="mb-8 inline-flex items-center gap-3 rounded-lg border border-clinic-100 bg-white px-4 py-3 text-clinic-900 shadow-sm">
            <HeartPulse className="text-clinic-700" /> <span className="text-lg font-black">Svastya Hospital</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 md:text-5xl">A professional clinic operating system for OPD care teams.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Reception, doctor consultation, pharmacy billing, staff access, and patient queue display in one role-aware healthcare workspace.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/patient/login"><Button variant="secondary"><MonitorCheck size={16} /> Patient Token Login</Button></Link>
            <span className="inline-flex items-center gap-2 rounded-md border border-care-100 bg-care-50 px-3 py-2 text-sm font-bold text-care-700"><ShieldCheck size={16} /> Demo data stored locally</span>
          </div>
          <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              ["Doctor", "doctor", "1234", "Clinical queue and prescriptions"],
              ["Nurse", "nurse", "1234", "Registration and history"],
              ["Medical", "medical", "1234", "Pharmacy and billing"],
            ].map(([role, userName, pass, detail]) => (
              <button key={role} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-clinic-200 hover:shadow-clinical" onClick={() => { setUsername(userName); setPassword(pass); }}>
                <div className="mb-3 inline-flex rounded-md bg-clinic-50 p-2 text-clinic-700"><Building2 size={18} /></div>
                <p className="font-black text-slate-950">{role}</p>
                <p className="mt-1 text-sm text-slate-500">{detail}</p>
                <p className="mt-3 text-xs font-bold uppercase text-slate-500">{userName} / {pass}</p>
              </button>
            ))}
          </div>
        </section>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-clinical">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-md bg-clinic-800 p-3 text-white"><LockKeyhole size={22} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Staff Sign In</h2>
              <p className="text-sm text-slate-500">Use seeded credentials or doctor-created staff access.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div><Label>Username</Label><Input value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <Button className="w-full" type="submit">Enter Workspace <ArrowRight size={16} /></Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientLogin() {
  const rows = useTodayRows();
  const announcement = useClinicStore((state) => state.announcement);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const liveAnnouncement = isDoctorUnavailable(announcement);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim().toLowerCase();
    const match = rows.find(({ patient }) => patient.mobile === mobile.trim() && fullName(patient).toLowerCase().includes(cleanName));
    if (!match) {
      useClinicStore.getState().pushToast("Patient token not found for today.", "error");
      return;
    }
    navigate(`/patient/display/${match.appointment.id}`);
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <Toast />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[1fr_420px]">
        {liveAnnouncement && <div className="lg:col-span-2"><AnnouncementNotice announcement={announcement} live compact /></div>}
        <section>
          <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-clinic-100 bg-white px-4 py-3 text-clinic-900 shadow-sm">
            <MonitorCheck className="text-clinic-700" /> <span className="text-lg font-black">Svastya Hospital Queue</span>
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-slate-950">Check your token number, current call status, and nearby queue.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Patients can sign in with the same mobile number and name used during appointment registration.</p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Doctor availability</p>
            <p className={liveAnnouncement ? "mt-1 text-lg font-bold text-rose-600" : "mt-1 text-lg font-bold text-emerald-600"}>
              {liveAnnouncement ? "NOT AVAILABLE" : "AVAILABLE"}
            </p>
            {liveAnnouncement && <p className="mt-2 text-sm text-slate-600">Notice from {formatAnnouncementRange(announcement)}: {announcement.message}</p>}
          </div>
        </section>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-clinical">
          <h2 className="text-2xl font-black text-slate-950">Patient Token Login</h2>
          <p className="mt-1 text-sm text-slate-500">Enter appointment mobile number and patient name.</p>
          <div className="mt-6 space-y-4">
            <div><Label>Mobile Number</Label><Input value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="10 digit mobile" required /></div>
            <div><Label>Patient Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="First name or full name" required /></div>
            <Button className="w-full" type="submit">View My Token <ArrowRight size={16} /></Button>
            <Link className="block text-center text-sm font-semibold text-clinic-700 hover:underline" to="/login">Staff login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function NurseDashboard() {
  const rows = useTodayRows();
  const current = rows.find((row) => row.appointment.status === "IN_CONSULTATION")?.appointment.tokenNumber ?? "-";
  return (
    <div className="space-y-6">
      <ExecutiveOverview rows={rows} title="Hospital Management Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Today Total Appointments" value={rows.length} icon={<ClipboardList />} />
        <StatCard title="Waiting Patients" value={rows.filter((r) => r.appointment.status === "WAITING").length} icon={<Users />} tone="amber" />
        <StatCard title="In Consultation" value={rows.filter((r) => r.appointment.status === "IN_CONSULTATION").length} icon={<Activity />} tone="blue" />
        <StatCard title="Completed" value={rows.filter((r) => ["COMPLETED", "SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(r.appointment.status)).length} icon={<CheckCircle2 />} tone="green" />
        <StatCard title="Current Token" value={current} icon={<UserCheck />} tone="slate" />
      </div>
      <QueuePanel role="nurse" />
      <ModuleGrid />
      <AlertsPanel />
    </div>
  );
}

function QueuePanel({ role }: { role: "nurse" | "doctor" }) {
  const rows = useTodayRows();
  const updateAppointmentStatus = useClinicStore((state) => state.updateAppointmentStatus);
  const collectAppointmentFee = useClinicStore((state) => state.collectAppointmentFee);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);
  if (loading) return <Panel title="Today's Queue"><SkeletonRows /></Panel>;
  return (
    <Panel title={role === "doctor" ? "Doctor Queue" : "Appointment Queue"}>
      <div className="overflow-auto scrollbar-thin">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr className="border-b border-slate-100"><th className="py-3">Token</th><th>Patient Name</th><th>Mobile</th><th>Appointment Date</th><th>Case</th><th>Fee</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map(({ appointment, patient }) => (
              <tr key={appointment.id} className={appointment.status === "IN_CONSULTATION" ? "border-b border-t-4 border-b-emerald-100 border-t-emerald-500 bg-emerald-50/60 shadow-sm" : "border-b border-slate-100 last:border-0"}>
                <td className="py-3 font-bold text-slate-950">#{appointment.tokenNumber}</td>
                <td>{fullName(patient)}</td>
                <td>{patient.mobile}</td>
                <td>{formatDisplayDate(appointment.appointmentDate)}</td>
                <td><span className="font-bold text-slate-700">{appointmentCaseType(appointment, patient)}</span></td>
                <td>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-950">{currency(appointmentFee(appointment, patient))}</p>
                    {appointment.feeCollected ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-emerald-800 ring-1 ring-emerald-200">Collected</span> : <Button variant="secondary" onClick={() => collectAppointmentFee(appointment.id)}>Collect</Button>}
                  </div>
                </td>
                <td><Badge status={appointment.status} /></td>
                <td>
                  {role === "nurse" ? (
                    <Button variant="secondary" disabled={appointment.status !== "WAITING"} onClick={() => updateAppointmentStatus(appointment.id, "IN_CONSULTATION")}><Send size={15} /> Send To Doctor</Button>
                  ) : (
                    <Link className="font-semibold text-clinic-700 hover:underline" to={`/doctor/patient/${appointment.id}`}>
                      {appointment.status === "SENT_TO_PHARMACY" || appointment.status === "MEDICINE_ISSUED" ? "Edit Prescription" : "Open"}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState title="No appointments today" body="New tokens created by reception will appear here." />}
      </div>
    </Panel>
  );
}

function NurseAppointments() {
  const patients = useClinicStore((state) => state.patients);
  const appointments = useClinicStore((state) => state.appointments);
  const createPatientAppointment = useClinicStore((state) => state.createPatientAppointment);
  const createAppointmentForExisting = useClinicStore((state) => state.createAppointmentForExisting);
  const user = useClinicStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(today());
  const [feeCollected, setFeeCollected] = useState(false);
  const [form, setForm] = useState({ firstName: "", surname: "", age: "", gender: "Male", mobile: "", weight: "", village: "" });
  const todaysQueue = todaysAppointments(appointments);
  const dateQueue = appointments.filter((appointment) => appointment.appointmentDate === appointmentDate);
  const nextTokenNumber = dateQueue.length ? Math.max(...dateQueue.map((appointment) => appointment.tokenNumber)) + 1 : 1;
  const autoPatient = useMemo(() => {
    const firstName = form.firstName.trim().toLowerCase();
    const surname = form.surname.trim().toLowerCase();
    const mobile = form.mobile.trim();
    if (!firstName || !/^\d{10}$/.test(mobile)) return undefined;
    return patients.find((patient) => {
      const patientName = fullName(patient).toLowerCase();
      const nameMatches = patient.firstName.toLowerCase() === firstName || patientName.includes(firstName);
      const surnameMatches = !surname || patient.surname.toLowerCase() === surname || patientName.includes(surname);
      return patient.mobile === mobile && nameMatches && surnameMatches;
    });
  }, [form.firstName, form.mobile, form.surname, patients]);
  const currentCaseType = autoPatient ? "OLD" : "NEW";
  const currentFee = currentCaseType === "NEW" ? 200 : 100;
  useEffect(() => {
    if (!autoPatient) return;
    setForm((current) => ({
      ...current,
      firstName: autoPatient.firstName,
      surname: autoPatient.surname,
      age: String(autoPatient.age),
      gender: autoPatient.gender,
      mobile: autoPatient.mobile,
      weight: String(autoPatient.weight),
      village: autoPatient.village,
    }));
  }, [autoPatient]);
  const matches = patients.filter((patient) => {
    const tokenMatch = appointments.find((appointment) => appointment.patientId === patient.id && String(appointment.tokenNumber) === query);
    return query && (`${fullName(patient)} ${patient.mobile}`.toLowerCase().includes(query.toLowerCase()) || tokenMatch);
  });
  const submitNew = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return useClinicStore.getState().pushToast("Mobile number must be 10 digits.", "error");
    if (autoPatient) {
      createAppointmentForExisting(autoPatient.id, user?.username ?? "nurse", appointmentDate, feeCollected);
    } else {
      createPatientAppointment({ firstName: form.firstName, surname: form.surname, age: Number(form.age), gender: form.gender as Patient["gender"], mobile: form.mobile, weight: Number(form.weight), village: form.village }, user?.username ?? "nurse", appointmentDate, feeCollected);
    }
    setForm({ firstName: "", surname: "", age: "", gender: "Male", mobile: "", weight: "", village: "" });
    setFeeCollected(false);
    setQuery("");
  };
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-clinical">
        <div className="border-b border-slate-100 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-clinic-700 p-3 text-white"><FilePlus2 size={24} /></div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">New OPD Appointment</h2>
                <p className="text-sm text-slate-600">Verify existing patient first, then generate the next token.</p>
              </div>
            </div>
            <div className="rounded-lg bg-clinic-50 px-5 py-3 text-right ring-1 ring-clinic-100">
              <p className="text-xs font-bold uppercase text-slate-500">Next Token For {formatDisplayDate(appointmentDate)}</p>
              <p className="text-3xl font-black text-clinic-700">#{nextTokenNumber}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">Today's Total</p><p className="text-2xl font-black text-slate-950">{todaysQueue.length}</p></div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-bold uppercase text-amber-700">Waiting</p><p className="text-2xl font-black text-amber-700">{todaysQueue.filter((appointment) => appointment.status === "WAITING").length}</p></div>
              <div className="rounded-lg border border-clinic-100 bg-clinic-50 p-3"><p className="text-xs font-bold uppercase text-clinic-700">In Consultation</p><p className="text-2xl font-black text-clinic-800">{todaysQueue.filter((appointment) => appointment.status === "IN_CONSULTATION").length}</p></div>
            </div>
            <Label>Search existing patient by mobile, name, or token</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Example: 9876543210, Ramesh, 4" />
            </div>
            <div className="mt-4 grid gap-3">
              {query && matches.map((patient) => (
                <button key={patient.id} className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-clinic-200 hover:bg-clinic-25" onClick={() => setSelected(patient)}>
                  <div>
                    <p className="font-bold text-slate-950">{fullName(patient)}</p>
                    <p className="text-sm text-slate-500">{patient.age} yrs • {patient.village} • {patient.mobile}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{patient.totalVisits} visits</span>
                </button>
              ))}
              {query && !matches.length && <EmptyState title="No existing patient found" body="Fill the registration form below to create a new patient token." />}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-bold text-slate-950">Reception Flow</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clinic-700 font-bold text-white">1</span><p className="text-slate-600">Search patient using mobile, name, or token.</p></div>
              <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clinic-700 font-bold text-white">2</span><p className="text-slate-600">Continue existing patient or register new patient.</p></div>
              <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clinic-700 font-bold text-white">3</span><p className="text-slate-600">System auto-generates today's token.</p></div>
            </div>
          </div>
        </div>
      </section>
      <Panel title={autoPatient ? "Old Case Appointment" : "Register New Patient"} action={<span className="rounded-full bg-clinic-50 px-3 py-1 text-xs font-bold text-clinic-700">Token #{nextTokenNumber} will be assigned</span>}>
        <form className="grid gap-4" onSubmit={submitNew}>
          <div className="grid gap-4 md:grid-cols-4">
            <div><Label>Appointment Date</Label><Input required type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} /></div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Case Type</p>
              <p className={autoPatient ? "mt-1 text-xl font-black text-clinic-700" : "mt-1 text-xl font-black text-emerald-700"}>{currentCaseType} CASE</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Appointment Fee</p>
              <p className="mt-1 text-xl font-black text-slate-950">{currency(currentFee)}</p>
            </div>
            <label className="flex min-h-[74px] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-clinic-700" checked={feeCollected} onChange={(e) => setFeeCollected(e.target.checked)} />
              Fee collected now
            </label>
          </div>
          {autoPatient && <div className="rounded-lg border border-clinic-100 bg-clinic-50 p-3 text-sm font-semibold text-clinic-800">Old case found. Patient details are auto-filled from the previous record.</div>}
          <div className="grid gap-4 md:grid-cols-4">
            <div><Label>First Name</Label><Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><Label>Surname</Label><Input required value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} /></div>
            <div><Label>Age</Label><Input required type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
            <div><Label>Gender</Label><Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></Select></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Mobile Number</Label><Input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="10 digit mobile" /></div>
            <div><Label>Weight</Label><Input required type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
            <div><Label>Village</Label><Input required value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} /></div>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit"><FilePlus2 size={16} /> {autoPatient ? "Create Old Case Token" : "Create New Case Token"}</Button>
          </div>
        </form>
      </Panel>
      {selected && (
        <Modal title="Existing Patient Found" onClose={() => setSelected(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xl font-bold text-slate-950">{fullName(selected)}</p><p className="mt-2 text-sm text-slate-600">{selected.age} yrs • {selected.village}</p><p className="text-sm text-slate-600">{selected.mobile}</p><p className="mt-2 text-sm font-semibold text-slate-700">Total visits: {selected.totalVisits}</p><p className="text-sm text-slate-600">Last visit: {selected.lastVisitDate || "New patient"}</p></div>
            <div>{selected.visitHistory.slice(0, 2).map((visit) => <div key={visit.visitDate} className="mb-3 rounded-md border border-slate-200 p-3"><p className="font-semibold">{visit.visitDate}</p><p className="text-sm text-slate-600">{visit.doctorNotes}</p></div>)}</div>
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">Appointment: {formatDisplayDate(appointmentDate)} / Old case fee: {currency(100)} / {feeCollected ? "Collected now" : "Pending collection"}</div>
          <div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setSelected(null)}>Register As New</Button><Button onClick={() => { createAppointmentForExisting(selected.id, user?.username ?? "nurse", appointmentDate, feeCollected); setSelected(null); }}>Continue Existing Patient</Button></div>
        </Modal>
      )}
    </div>
  );
}

function PatientHistory() {
  const patients = useClinicStore((state) => state.patients);
  const appointments = useClinicStore((state) => state.appointments);
  const prescriptions = useClinicStore((state) => state.prescriptions);
  const collectAppointmentFee = useClinicStore((state) => state.collectAppointmentFee);
  const [query, setQuery] = useState("");
  const results = patients.filter((patient) => {
    const tokenMatch = appointments.find((appointment) => appointment.patientId === patient.id && String(appointment.tokenNumber) === query);
    return query && (`${fullName(patient)} ${patient.mobile}`.toLowerCase().includes(query.toLowerCase()) || tokenMatch);
  });
  return (
    <Panel title="Patient History Search">
      <Label>Search by mobile, name, or token</Label><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient history" />
      <div className="mt-5 grid gap-4">
        {results.map((patient) => {
          const todayPrescriptions = prescriptions.filter((rx) => rx.patientId === patient.id);
          const patientAppointments = appointments.filter((appointment) => appointment.patientId === patient.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          return (
            <div key={patient.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div><h3 className="font-bold text-slate-950">{fullName(patient)}</h3><p className="text-sm text-slate-500">{patient.mobile} • {patient.village} • {patient.totalVisits} visits</p></div>
                <Badge status="Active" />
              </div>
              <div className="mt-4 overflow-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="p-3">Appointment Date</th><th>Time</th><th>Token</th><th>Case</th><th>Fee</th><th>Payment</th></tr>
                  </thead>
                  <tbody>
                    {patientAppointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-slate-100">
                        <td className="p-3 font-semibold">{formatDisplayDate(appointment.appointmentDate)}</td>
                        <td>{new Date(appointment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>#{appointment.tokenNumber}</td>
                        <td className="font-semibold text-slate-700">{appointmentCaseType(appointment, patient)}</td>
                        <td className="font-semibold text-slate-950">{currency(appointmentFee(appointment, patient))}</td>
                        <td>
                          {appointment.feeCollected ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-emerald-800 ring-1 ring-emerald-200">Collected</span>
                          ) : (
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-amber-700">Pending</span><Button variant="secondary" onClick={() => collectAppointmentFee(appointment.id)}>Collect {currency(appointmentFee(appointment, patient))}</Button></div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 overflow-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="p-3">Visit Date</th><th>Visit Time</th><th>Token</th><th>Doctor Notes</th><th>Medicines</th></tr>
                  </thead>
                  <tbody>
                    {patient.visitHistory.map((visit, index) => (
                      <tr key={`${patient.id}-${visit.visitDate}-${index}`} className="border-b border-slate-100">
                        <td className="p-3 font-semibold">{visit.visitDate}</td>
                        <td>{visit.visitTime || "-"}</td>
                        <td>#{visit.tokenNumber}</td>
                        <td className="max-w-md text-slate-600">{visit.doctorNotes}</td>
                        <td className="font-semibold text-clinic-700">{visit.medicines.join(", ") || "-"}</td>
                      </tr>
                    ))}
                    {todayPrescriptions.map((rx) => (
                      <tr key={rx.id} className="border-b border-clinic-100 bg-clinic-50">
                        <td className="p-3 font-semibold">{rx.createdAt.slice(0, 10)}</td>
                        <td>{new Date(rx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>Today</td>
                        <td className="max-w-md text-slate-700">{rx.doctorNotes}</td>
                        <td className="font-semibold text-clinic-700">{rx.medicines.map((medicine) => medicine.medicineName).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!patient.visitHistory.length && !todayPrescriptions.length && <EmptyState title="No previous visits" body="Prescription history will appear after doctor consultation." />}
            </div>
          );
        })}
        {query && !results.length && <EmptyState title="No history found" body="Try another mobile number, name, or token." />}
      </div>
    </Panel>
  );
}

function DoctorDashboard() {
  const rows = useTodayRows();
  const [query, setQuery] = useState("");
  const searchRows = rows.filter(({ patient }) => {
    const cleanQuery = query.trim().toLowerCase();
    return cleanQuery && fullName(patient).toLowerCase().includes(cleanQuery);
  });
  const completedCount = rows.filter((r) => ["COMPLETED", "SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(r.appointment.status)).length;
  return (
    <div className="space-y-6">
      <ExecutiveOverview rows={rows} title="Doctor & OPD Clinical Dashboard" />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-clinical">
        <div className="bg-[#123f55] px-5 py-6 text-white sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-[#d8f0f6]">Doctor Console</p>
              <h2 className="mt-2 text-3xl font-black text-white">Find Patient By Name</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#eef8fb]">
                Type patient name and open the consultation file directly.
              </p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3 text-right ring-1 ring-white/15">
              <p className="text-xs font-black uppercase text-[#d8f0f6]">Today</p>
              <p className="mt-1 text-2xl font-black text-white">{rows.length} patients</p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <div className="rounded-lg border border-clinic-100 bg-clinic-25 p-4 shadow-sm">
            <Label>Patient Name Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-clinic-700" size={20} />
              <Input
                className="h-14 rounded-lg border-clinic-100 bg-white pl-12 text-base font-semibold shadow-sm"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter patient name"
                autoFocus
              />
            </div>
          </div>
          <div className="mt-5 max-h-[360px] space-y-3 overflow-auto pr-1 scrollbar-thin">
            {query.trim() && searchRows.map(({ appointment, patient }) => (
              <Link
                key={appointment.id}
                to={`/doctor/patient/${appointment.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-clinic-200 hover:bg-clinic-25 hover:shadow-clinical"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#123f55] text-lg font-black text-white">
                    {patient.firstName.charAt(0)}{patient.surname.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-950">{fullName(patient)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Token #{appointment.tokenNumber} / {patient.mobile} / {patient.village}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={appointment.status} />
                  <span className="inline-flex items-center gap-2 rounded-md bg-clinic-700 px-3 py-2 text-sm font-bold text-white">
                    Open <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
            {query.trim() && !searchRows.length && <EmptyState title="No patient found" body="Enter the registered patient name." />}
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Today Total Patients" value={rows.length} icon={<Users />} />
        <StatCard title="Completed Patients" value={completedCount} icon={<CheckCircle2 />} tone="green" />
      </div>
      <QueuePanel role="doctor" />
      <ModuleGrid />
    </div>
  );
}

function PatientDetail() {
  const { id } = useParams();
  const appointments = useClinicStore((state) => state.appointments);
  const patients = useClinicStore((state) => state.patients);
  const prescriptions = useClinicStore((state) => state.prescriptions);
  const savePrescription = useClinicStore((state) => state.savePrescription);
  const navigate = useNavigate();
  const appointment = appointments.find((item) => item.id === id);
  const patient = appointment ? patientFor(patients, appointment.patientId) : undefined;
  const existingPrescription = prescriptions.find((item) => item.appointmentId === id);
  const [notes, setNotes] = useState(existingPrescription?.doctorNotes ?? "");
  const [meds, setMeds] = useState<MedicineItem[]>(
    existingPrescription?.medicines.length
      ? existingPrescription.medicines
      : [{ medicineName: "", morning: true, afternoon: false, night: true, days: 3, beforeFood: false, afterFood: true, quantity: 6, price: 0 }],
  );
  const [editedAfterSend, setEditedAfterSend] = useState(false);
  if (!appointment || !patient) return <EmptyState title="Patient not found" body="Return to the doctor dashboard and open a valid token." />;
  const isSentToPharmacy = appointment.status === "SENT_TO_PHARMACY" || appointment.status === "MEDICINE_ISSUED";
  const canSendToPharmacy = !isSentToPharmacy || editedAfterSend;
  const markPrescriptionEdited = () => {
    if (isSentToPharmacy) setEditedAfterSend(true);
  };
  const updateMed = (index: number, patch: Partial<MedicineItem>) => {
    markPrescriptionEdited();
    setMeds((items) => items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };
  const submit = (send: boolean) => {
    if (!notes.trim()) return useClinicStore.getState().pushToast("Doctor notes are required.", "error");
    if (meds.some((medicine) => !medicine.medicineName.trim())) return useClinicStore.getState().pushToast("Medicine name is required.", "error");
    savePrescription(appointment.id, notes, meds, send);
    if (send) {
      setEditedAfterSend(false);
      navigate("/doctor/dashboard");
    }
  };
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-clinical">
        <div className="h-1 bg-clinic-800" />
        <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-clinic-700">Token #{appointment.tokenNumber}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{fullName(patient)}</h2>
            <p className="mt-1 text-sm text-slate-600">{patient.age} yrs • {patient.gender} • {patient.weight} kg • {patient.mobile} • {patient.village}</p>
          </div>
          <Badge status={appointment.status} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-clinic-50 p-4 ring-1 ring-clinic-100"><p className="text-xs font-bold uppercase text-clinic-700">Total Visits</p><p className="mt-1 text-2xl font-black text-slate-950">{patient.totalVisits}</p></div>
          <div className="rounded-lg bg-care-50 p-4 ring-1 ring-care-100"><p className="text-xs font-bold uppercase text-care-700">Last Visit</p><p className="mt-1 text-lg font-bold text-slate-950">{patient.lastVisitDate || "First visit"}</p></div>
          <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100"><p className="text-xs font-bold uppercase text-amber-700">Previous Notes</p><p className="mt-1 text-sm text-slate-600">{patient.visitHistory[0]?.doctorNotes || "No previous notes"}</p></div>
        </div>
        </div>
      </section>
      <Panel title="Create Prescription" eyebrow="Consultation workspace">
        <div><Label>Doctor Notes</Label><Textarea rows={4} value={notes} onChange={(e) => { markPrescriptionEdited(); setNotes(e.target.value); }} placeholder="Clinical notes, diagnosis, advice" /></div>
        <div className="mt-5 space-y-4">
          {meds.map((medicine, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid gap-3 md:grid-cols-[1.5fr_0.6fr_0.6fr]"><div><Label>Medicine Name</Label><Input value={medicine.medicineName} onChange={(e) => updateMed(index, { medicineName: e.target.value, price: 0 })} placeholder="Type medicine name manually" /></div><div><Label>Days</Label><Input type="number" value={medicine.days} onChange={(e) => updateMed(index, { days: Number(e.target.value) })} /></div><div><Label>Quantity</Label><Input type="number" value={medicine.quantity} onChange={(e) => updateMed(index, { quantity: Number(e.target.value) })} /></div></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-5">{(["morning", "afternoon", "night", "beforeFood", "afterFood"] as const).map((key) => <label key={key} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(medicine[key])} onChange={(e) => updateMed(index, { [key]: e.target.checked })} /> {key.replace("Food", " food")}</label>)}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { markPrescriptionEdited(); setMeds([...meds, { medicineName: "", morning: true, afternoon: false, night: true, days: 3, beforeFood: false, afterFood: true, quantity: 1, price: 0 }]); }}><Plus size={16} /> Add Medicine</Button>
          {canSendToPharmacy && <Button onClick={() => submit(true)}><Send size={16} /> Send To Pharmacy</Button>}
          {!canSendToPharmacy && <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">Already sent to pharmacy</span>}
        </div>
      </Panel>
    </div>
  );
}

function Announcement() {
  const announcement = useClinicStore((state) => state.announcement);
  const setAnnouncement = useClinicStore((state) => state.setAnnouncement);
  const deleteAnnouncement = useClinicStore((state) => state.deleteAnnouncement);
  const [form, setForm] = useState(announcement);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const live = isDoctorUnavailable(announcement);
  const hasAnnouncement = Boolean(announcement.message.trim());
  return (
    <Panel title="Doctor Announcement" eyebrow="Patient notice">
      <form className="grid max-w-2xl gap-4" onSubmit={(e) => { e.preventDefault(); setAnnouncement(form); }}>
        <div>
          <Label>Message</Label>
          <Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active announcement
        </label>
        <div><Button type="submit">Announce</Button></div>
      </form>

      {hasAnnouncement && (
        <div className="mt-6 space-y-3">
          <AnnouncementNotice announcement={announcement} live={live} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-600">
              Patient side visibility: {live ? "Visible now on login and token display." : announcement.isActive ? "Scheduled for selected dates." : "Inactive."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setForm(announcement)}><Edit size={15} /> Edit</Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete</Button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Delete Announcement" body="Delete current doctor announcement? It will stop showing on login and patient screens." onCancel={() => setConfirmDelete(false)} onConfirm={() => { deleteAnnouncement(); setForm({ message: "", startDate: today(), endDate: today(), isActive: false }); setConfirmDelete(false); }} />}
    </Panel>
  );
}

function StaffList() {
  const staff = useClinicStore((state) => state.staff);
  const deleteStaff = useClinicStore((state) => state.deleteStaff);
  const toggleStaffStatus = useClinicStore((state) => state.toggleStaffStatus);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [view, setView] = useState<Staff | null>(null);
  const [remove, setRemove] = useState<Staff | null>(null);
  const rows = staff.filter((item) => `${item.fullName} ${item.mobile}`.toLowerCase().includes(query.toLowerCase()) && (role === "All" || item.role === role) && (status === "All" || item.status === status));
  return <Panel title="Staff Management" action={<Link to="/doctor/staff/add"><Button><Plus size={16} /> Add Staff</Button></Link>}><div className="mb-4 grid gap-3 md:grid-cols-3"><Input placeholder="Search by name or mobile" value={query} onChange={(e) => setQuery(e.target.value)} /><Select value={role} onChange={(e) => setRole(e.target.value)}><option>All</option><option>Nurse</option><option>Medical Department</option></Select><Select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></Select></div><div className="overflow-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr className="border-b"><th className="py-3">Staff ID</th><th>Full Name</th><th>Role</th><th>Mobile</th><th>Email</th><th>Joining Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3 font-bold">{item.id}</td><td>{item.fullName}</td><td>{item.role}</td><td>{item.mobile}</td><td>{item.email}</td><td>{item.joiningDate}</td><td><Badge status={item.status} /></td><td><div className="flex gap-2"><Button variant="ghost" onClick={() => setView(item)}><Eye size={15} /></Button><Link to={`/doctor/staff/edit/${item.id}`}><Button variant="ghost"><Edit size={15} /></Button></Link><Button variant="ghost" onClick={() => toggleStaffStatus(item.id)}>{item.status === "Active" ? "Deactivate" : "Activate"}</Button><Button variant="ghost" onClick={() => setRemove(item)}><Trash2 size={15} /></Button></div></td></tr>)}</tbody></table></div>{!rows.length && <EmptyState title="No staff found" body="Adjust filters or add a new staff member." />}{view && <Modal title="Staff Detail" onClose={() => setView(null)}><div className="rounded-lg bg-slate-50 p-5"><p className="text-2xl font-bold">{view.fullName}</p><p className="mt-2">{view.role}</p><p className="text-sm text-slate-600">{view.mobile} • {view.email}</p><p className="text-sm text-slate-600">{view.address}</p><p className="mt-3 text-sm font-semibold">Joined {view.joiningDate}</p><Badge status={view.status} /></div></Modal>}{remove && <ConfirmDialog title="Delete Staff" body={`Delete ${remove.fullName}? This removes their login access.`} onCancel={() => setRemove(null)} onConfirm={() => { deleteStaff(remove.id); setRemove(null); }} />}</Panel>;
}

function StaffForm() {
  const { id } = useParams();
  const staff = useClinicStore((state) => state.staff);
  const addStaff = useClinicStore((state) => state.addStaff);
  const updateStaff = useClinicStore((state) => state.updateStaff);
  const existing = staff.find((item) => item.id === id);
  const navigate = useNavigate();
  const [form, setForm] = useState<Staff>(existing ?? { id: "", fullName: "", role: "Nurse", mobile: "", email: "", address: "", joiningDate: today(), username: "", password: "1234", status: "Active" });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return useClinicStore.getState().pushToast("Mobile must be 10 digits.", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return useClinicStore.getState().pushToast("Enter a valid email.", "error");
    if (existing) updateStaff(form); else addStaff({ fullName: form.fullName, role: form.role, mobile: form.mobile, email: form.email, address: form.address, joiningDate: form.joiningDate, username: form.username, password: form.password, status: form.status, profilePhoto: form.profilePhoto });
    navigate("/doctor/staff");
  };
  return <Panel title={existing ? "Edit Staff" : "Add Staff"}><form onSubmit={submit} className="grid max-w-3xl gap-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Full Name</Label><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div><div><Label>Role</Label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })}><option>Nurse</option><option>Medical Department</option></Select></div></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Mobile Number</Label><Input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div><div><Label>Email</Label><Input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></div><div><Label>Address</Label><Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div><div className="grid gap-3 sm:grid-cols-3"><div><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></div><div><Label>Username</Label><Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div><div><Label>Password</Label><Input required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div></div><div><Label>Profile Photo</Label><Input type="file" /></div><div><Label>Status</Label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Staff["status"] })}><option>Active</option><option>Inactive</option></Select></div><div className="flex gap-3"><Button type="submit">{existing ? "Update Staff" : "Create Staff"}</Button><Link to="/doctor/staff"><Button type="button" variant="secondary">Cancel</Button></Link></div></form></Panel>;
}

function MedicalDashboard() {
  const rows = useTodayRows();
  const prescriptions = useClinicStore((state) => state.prescriptions);
  const appointments = useClinicStore((state) => state.appointments);
  const inventory = useClinicStore((state) => state.inventory);
  const pending = prescriptions.filter((rx) => appointments.find((a) => a.id === rx.appointmentId)?.status === "SENT_TO_PHARMACY");
  const issuedToday = appointments.filter((a) => a.appointmentDate === today() && a.status === "MEDICINE_ISSUED").length;
  const issuedMedicineCount = prescriptions.reduce((sum, rx) => sum + (rx.issuedMedicines?.length ?? 0), 0);
  return <div className="space-y-6"><ExecutiveOverview rows={rows} title="Pharmacy, Billing & Operations Dashboard" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard title="Pending Prescriptions" value={pending.length} icon={<ClipboardList />} tone="amber" /><StatCard title="Total Medicines In Stock" value={inventory.reduce((s, m) => s + m.stockQty, 0)} icon={<Pill />} /><StatCard title="Patients Issued Today" value={issuedToday} icon={<PackagePlus />} tone="green" /><StatCard title="Issued Medicine Items" value={issuedMedicineCount} icon={<CheckCircle2 />} tone="slate" /></div><PrescriptionQueue /><ModuleGrid /><AlertsPanel /></div>;
}

function PrescriptionQueue() {
  const prescriptions = useClinicStore((state) => state.prescriptions);
  const appointments = useClinicStore((state) => state.appointments);
  const patients = useClinicStore((state) => state.patients);
  const issueMedicine = useClinicStore((state) => state.issueMedicine);
  const [issueId, setIssueId] = useState<string | null>(null);
  const rows = prescriptions.map((rx) => ({ rx, appointment: appointments.find((a) => a.id === rx.appointmentId), patient: patientFor(patients, rx.patientId) })).filter((row) => row.appointment && row.patient && ["SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(row.appointment.status));
  const active = rows.find((row) => row.rx.id === issueId);
  const doseText = (medicine: MedicineItem) => [
    medicine.morning ? "M" : "",
    medicine.afternoon ? "A" : "",
    medicine.night ? "N" : "",
  ].filter(Boolean).join("-") || "-";
  return <Panel title="Prescription Queue"><div className="overflow-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr className="border-b"><th className="py-3">Token</th><th>Patient</th><th>Doctor Prescription</th><th>Given Medicines</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(({ rx, appointment, patient }) => <tr key={rx.id} className="border-b border-slate-100 align-top"><td className="py-3 font-bold">#{appointment!.tokenNumber}</td><td className="py-3">{fullName(patient!)}</td><td className="py-3"><div className="space-y-2">{rx.medicines.map((m) => <div key={m.medicineName} className="rounded-md bg-slate-50 p-2"><p className="font-bold text-slate-900">{m.medicineName}</p><p className="text-xs text-slate-600">Dose: {doseText(m)} / {m.days} days / Qty {m.quantity} / {m.beforeFood ? "Before food" : ""} {m.afterFood ? "After food" : ""}</p></div>)}</div><p className="mt-2 text-xs text-slate-500">Notes: {rx.doctorNotes}</p></td><td className="py-3">{rx.issuedMedicines?.length ? <div className="space-y-1">{rx.issuedMedicines.map((name) => <span key={name} className="block rounded-md bg-care-50 px-2 py-1 text-xs font-bold text-care-800 ring-1 ring-care-100">{name}</span>)}</div> : <span className="text-sm font-semibold text-slate-500">Not issued yet</span>}</td><td className="py-3"><Badge status={appointment!.status} /></td><td className="py-3"><Button disabled={appointment!.status === "MEDICINE_ISSUED"} onClick={() => setIssueId(rx.id)}>Issue Medicine</Button></td></tr>)}</tbody></table></div>{!rows.length && <EmptyState title="No pharmacy prescriptions" body="Doctor prescriptions sent to pharmacy will appear here." />}{active && <IssueMedicineModal row={active as never} onClose={() => setIssueId(null)} onIssue={(medicineNames) => { issueMedicine(active.rx.id, medicineNames); setIssueId(null); }} />}</Panel>;
}

function IssueMedicineModal({
  row,
  onClose,
  onIssue,
}: {
  row: { rx: ReturnType<typeof useClinicStore.getState>["prescriptions"][number]; appointment: Appointment; patient: Patient };
  onClose: () => void;
  onIssue: (medicineNames: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(row.rx.issuedMedicines?.length ? row.rx.issuedMedicines : row.rx.medicines.map((medicine) => medicine.medicineName));
  const toggleMedicine = (medicineName: string) => {
    setSelected((current) => current.includes(medicineName) ? current.filter((name) => name !== medicineName) : [...current, medicineName]);
  };
  return <Modal title="Issue Medicine" onClose={onClose}><div className="rounded-lg border border-slate-200 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xl font-bold">Token #{row.appointment.tokenNumber}</p><p className="text-sm font-semibold text-slate-600">{fullName(row.patient)} / {row.patient.mobile}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700 ring-1 ring-slate-200">Government bill default</span></div><p className="mt-4 text-sm text-slate-600">Select only medicines actually given to the patient. No manual bill or price entry is needed.</p><div className="mt-4 space-y-3">{row.rx.medicines.map((medicine) => <label key={medicine.medicineName} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-clinic-700" checked={selected.includes(medicine.medicineName)} onChange={() => toggleMedicine(medicine.medicineName)} /><span><span className="block font-bold text-slate-950">{medicine.medicineName}</span><span className="text-slate-600">Qty {medicine.quantity} / {medicine.days} days</span></span></label>)}</div><div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Close</Button><Button disabled={!selected.length} onClick={() => onIssue(selected)}>Confirm Issue</Button></div></div></Modal>;
}
function PublicDisplay() {
  const { appointmentId } = useParams();
  const rows = useTodayRows();
  const announcement = useClinicStore((state) => state.announcement);
  const selectedIndex = rows.findIndex((row) => row.appointment.id === appointmentId);
  const selected = selectedIndex >= 0 ? rows[selectedIndex] : undefined;
  const current = rows.find((row) => row.appointment.status === "IN_CONSULTATION") ?? rows.find((row) => row.appointment.status === "COMPLETED" || row.appointment.status === "SENT_TO_PHARMACY");
  const next = rows.filter((row) => row.appointment.status === "WAITING").slice(0, 3);
  const available = !isDoctorUnavailable(announcement);
  const waitingRows = rows.filter((row) => row.appointment.status === "WAITING");
  const patientPosition = selected?.appointment.status === "WAITING" ? waitingRows.findIndex((row) => row.appointment.id === selected.appointment.id) + 1 : 0;
  const nearbyRows = selectedIndex >= 0 ? rows.slice(Math.max(0, selectedIndex - 5), selectedIndex + 6) : [];
  if (!selected) return <Navigate to="/patient/login" replace />;
  const turnsBeforeYou = Math.max(patientPosition - 1, 0);
  const patientMessage =
    selected.appointment.status === "IN_CONSULTATION"
      ? "Please go to the consultation room now."
      : selected.appointment.status === "WAITING"
        ? turnsBeforeYou === 0
          ? "You are next. Please stay near the clinic desk."
          : `${turnsBeforeYou} patient${turnsBeforeYou === 1 ? "" : "s"} before you. Please stay nearby.`
        : "Your consultation is completed or moved to pharmacy.";
  const liveAnnouncement = isDoctorUnavailable(announcement);

  return (
    <div className="min-h-screen bg-[#eef4f7] p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase text-[#115f7e]">Svastya Hospital</p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">Patient Queue Status</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">{fullName(selected.patient)} / {selected.patient.mobile}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={available ? "AVAILABLE" : "NOT AVAILABLE"} />
            <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" to="/patient/login">Logout</Link>
          </div>
        </div>

        {liveAnnouncement && <div className="mb-5"><AnnouncementNotice announcement={announcement} live compact /></div>}

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-clinical sm:p-8">
            <p className="text-sm font-black uppercase text-slate-500">Your Token Number</p>
            <p className="mt-3 text-8xl font-black leading-none text-[#123f55] sm:text-9xl">#{selected.appointment.tokenNumber}</p>
            <p className="mx-auto mt-5 max-w-xl rounded-lg border border-[#d8f0f6] bg-[#eef8fb] px-4 py-3 text-lg font-black text-[#123f55]">{patientMessage}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase text-amber-700">Before You</p>
                <p className="mt-1 text-4xl font-black text-amber-800">{selected.appointment.status === "WAITING" ? turnsBeforeYou : "-"}</p>
              </div>
              <div className="rounded-lg border border-[#d8f0f6] bg-[#f8fcff] p-4">
                <p className="text-xs font-black uppercase text-[#115f7e]">Your Status</p>
                <div className="mt-2 flex justify-center"><Badge status={selected.appointment.status} /></div>
              </div>
              <div className="rounded-lg border border-care-100 bg-care-50 p-4">
                <p className="text-xs font-black uppercase text-care-700">Waiting</p>
                <p className="mt-1 text-4xl font-black text-care-700">{waitingRows.length}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-clinical">
            <div className="rounded-lg bg-[#123f55] p-6 text-center text-white">
              <p className="text-sm font-black uppercase text-[#d8f0f6]">Now Serving</p>
              <p className="mt-2 text-7xl font-black leading-none sm:text-8xl">{current ? `#${current.appointment.tokenNumber}` : "-"}</p>
              <p className="mt-3 text-lg font-bold text-[#eef8fb]">{current ? fullName(current.patient) : "Queue not started"}</p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-slate-500">Next Tokens</p>
                <h2 className="text-xl font-black text-slate-950">Coming Up</h2>
              </div>
              <Clock3 className="text-[#115f7e]" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {next.length ? next.map((row) => (
                <div key={row.appointment.id} className="rounded-lg border border-care-100 bg-care-50 p-5 text-center text-4xl font-black text-care-700">{row.appointment.tokenNumber}</div>
              )) : <div className="col-span-3 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center font-bold text-slate-600">No waiting tokens</div>}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-clinical">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black">Nearby Queue List</p>
              <p className="text-sm text-slate-500">Your token is highlighted below.</p>
            </div>
            <span className="rounded-full bg-[#eef8fb] px-3 py-1 text-sm font-bold text-[#115f7e]">Live OPD queue</span>
          </div>
          <div className="mt-4 overflow-auto scrollbar-thin">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th>Token</th><th>Patient</th><th>Status</th><th>Position</th></tr></thead>
              <tbody>
                {nearbyRows.map((row) => (
                  <tr key={row.appointment.id} className={row.appointment.id === selected.appointment.id ? "bg-clinic-50 font-bold text-clinic-900" : ""}>
                    <td>#{row.appointment.tokenNumber}</td>
                    <td>{fullName(row.patient)}</td>
                    <td>{row.appointment.status.replaceAll("_", " ")}</td>
                    <td>{row.appointment.id === selected.appointment.id ? "Your token" : row.appointment.tokenNumber < selected.appointment.tokenNumber ? "Before you" : "After you"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isDoctorUnavailable(announcement) && <div className="mt-6 rounded-lg bg-amber-100 p-5 text-amber-900"><b>Doctor leave notice:</b> From {formatAnnouncementRange(announcement)}. {announcement.message}</div>}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/display" element={<Navigate to="/patient/login" replace />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/display/:appointmentId" element={<PublicDisplay />} />
        <Route element={<RequireAuth />}><Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={<RequireAuth role="Nurse" />}><Route path="/nurse/dashboard" element={<NurseDashboard />} /><Route path="/nurse/appointments" element={<NurseAppointments />} /><Route path="/nurse/history" element={<PatientHistory />} /></Route>
          <Route element={<RequireAuth role="Doctor" />}><Route path="/doctor/dashboard" element={<DoctorDashboard />} /><Route path="/doctor/patient/:id" element={<PatientDetail />} /><Route path="/doctor/announcement" element={<Announcement />} /><Route path="/doctor/staff" element={<StaffList />} /><Route path="/doctor/staff/add" element={<StaffForm />} /><Route path="/doctor/staff/edit/:id" element={<StaffForm />} /></Route>
          <Route element={<RequireAuth role="Medical Department" />}><Route path="/medical/dashboard" element={<MedicalDashboard />} /><Route path="/medical/prescriptions" element={<PrescriptionQueue />} /><Route path="/medical/billing" element={<PrescriptionQueue />} /></Route>
        </Route></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
