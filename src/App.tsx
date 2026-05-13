import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowRight, BadgeIndianRupee, Building2, CheckCircle2, ClipboardList, Clock3, Edit, Eye, FilePlus2, HeartPulse, LockKeyhole, MonitorCheck, PackagePlus, Pill, Plus, Search, Send, ShieldCheck, Trash2, UserCheck, Users } from "lucide-react";
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
  const [username, setUsername] = useState("doctor");
  const [password, setPassword] = useState("1234");
  const navigate = useNavigate();
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
        <section className="relative">
          <div className="mb-8 inline-flex items-center gap-3 rounded-lg border border-clinic-100 bg-white px-4 py-3 text-clinic-900 shadow-sm">
            <HeartPulse className="text-clinic-700" /> <span className="text-lg font-black">Aarogya OPD Clinic</span>
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
        <section>
          <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-clinic-100 bg-white px-4 py-3 text-clinic-900 shadow-sm">
            <MonitorCheck className="text-clinic-700" /> <span className="text-lg font-black">Aarogya OPD Queue</span>
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-slate-950">Check your token number, current call status, and nearby queue.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Patients can sign in with the same mobile number and name used during appointment registration.</p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Doctor availability</p>
            <p className={isDoctorUnavailable(announcement) ? "mt-1 text-lg font-bold text-rose-600" : "mt-1 text-lg font-bold text-emerald-600"}>
              {isDoctorUnavailable(announcement) ? "NOT AVAILABLE" : "AVAILABLE"}
            </p>
            {isDoctorUnavailable(announcement) && <p className="mt-2 text-sm text-slate-600">{announcement.message}</p>}
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Today Total Appointments" value={rows.length} icon={<ClipboardList />} />
        <StatCard title="Waiting Patients" value={rows.filter((r) => r.appointment.status === "WAITING").length} icon={<Users />} tone="amber" />
        <StatCard title="In Consultation" value={rows.filter((r) => r.appointment.status === "IN_CONSULTATION").length} icon={<Activity />} tone="blue" />
        <StatCard title="Completed" value={rows.filter((r) => ["COMPLETED", "SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(r.appointment.status)).length} icon={<CheckCircle2 />} tone="green" />
        <StatCard title="Current Token" value={current} icon={<UserCheck />} tone="slate" />
      </div>
      <QueuePanel role="nurse" />
    </div>
  );
}

function QueuePanel({ role }: { role: "nurse" | "doctor" }) {
  const rows = useTodayRows();
  const updateAppointmentStatus = useClinicStore((state) => state.updateAppointmentStatus);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);
  if (loading) return <Panel title="Today's Queue"><SkeletonRows /></Panel>;
  return (
    <Panel title={role === "doctor" ? "Doctor Queue" : "Appointment Queue"}>
      <div className="overflow-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr className="border-b border-slate-100"><th className="py-3">Token</th><th>Patient Name</th><th>Mobile</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map(({ appointment, patient }) => (
              <tr key={appointment.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 font-bold text-slate-950">#{appointment.tokenNumber}</td>
                <td>{fullName(patient)}</td>
                <td>{patient.mobile}</td>
                <td>{new Date(appointment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
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
  const [form, setForm] = useState({ firstName: "", surname: "", age: "", gender: "Male", mobile: "", weight: "", village: "" });
  const todaysQueue = todaysAppointments(appointments);
  const nextTokenNumber = todaysQueue.length ? Math.max(...todaysQueue.map((appointment) => appointment.tokenNumber)) + 1 : 1;
  const matches = patients.filter((patient) => {
    const tokenMatch = appointments.find((appointment) => appointment.patientId === patient.id && String(appointment.tokenNumber) === query);
    return query && (`${fullName(patient)} ${patient.mobile}`.toLowerCase().includes(query.toLowerCase()) || tokenMatch);
  });
  const submitNew = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return useClinicStore.getState().pushToast("Mobile number must be 10 digits.", "error");
    createPatientAppointment({ firstName: form.firstName, surname: form.surname, age: Number(form.age), gender: form.gender as Patient["gender"], mobile: form.mobile, weight: Number(form.weight), village: form.village }, user?.username ?? "nurse");
    setForm({ firstName: "", surname: "", age: "", gender: "Male", mobile: "", weight: "", village: "" });
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
              <p className="text-xs font-bold uppercase text-slate-500">Next Token</p>
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
      <Panel title="Register New Patient" action={<span className="rounded-full bg-clinic-50 px-3 py-1 text-xs font-bold text-clinic-700">Token #{nextTokenNumber} will be assigned</span>}>
        <form className="grid gap-4" onSubmit={submitNew}>
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
            <Button type="submit"><FilePlus2 size={16} /> Create Appointment Token</Button>
          </div>
        </form>
      </Panel>
      {selected && (
        <Modal title="Existing Patient Found" onClose={() => setSelected(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xl font-bold text-slate-950">{fullName(selected)}</p><p className="mt-2 text-sm text-slate-600">{selected.age} yrs • {selected.village}</p><p className="text-sm text-slate-600">{selected.mobile}</p><p className="mt-2 text-sm font-semibold text-slate-700">Total visits: {selected.totalVisits}</p><p className="text-sm text-slate-600">Last visit: {selected.lastVisitDate || "New patient"}</p></div>
            <div>{selected.visitHistory.slice(0, 2).map((visit) => <div key={visit.visitDate} className="mb-3 rounded-md border border-slate-200 p-3"><p className="font-semibold">{visit.visitDate}</p><p className="text-sm text-slate-600">{visit.doctorNotes}</p></div>)}</div>
          </div>
          <div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setSelected(null)}>Register As New</Button><Button onClick={() => { createAppointmentForExisting(selected.id, user?.username ?? "nurse"); setSelected(null); }}>Continue Existing Patient</Button></div>
        </Modal>
      )}
    </div>
  );
}

function PatientHistory() {
  const patients = useClinicStore((state) => state.patients);
  const appointments = useClinicStore((state) => state.appointments);
  const prescriptions = useClinicStore((state) => state.prescriptions);
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
          return (
            <div key={patient.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div><h3 className="font-bold text-slate-950">{fullName(patient)}</h3><p className="text-sm text-slate-500">{patient.mobile} • {patient.village} • {patient.totalVisits} visits</p></div>
                <Badge status="Active" />
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
  const remaining = rows.filter((row) => ["WAITING", "IN_CONSULTATION"].includes(row.appointment.status));
  const current = rows.find((row) => row.appointment.status === "IN_CONSULTATION");
  const next = rows.find((row) => row.appointment.status === "WAITING");
  const searchRows = rows.filter(({ appointment, patient }) => {
    const text = `${appointment.tokenNumber} ${fullName(patient)} ${patient.mobile} ${patient.village}`.toLowerCase();
    return query.trim() && text.includes(query.toLowerCase());
  });
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-clinical">
        <div className="grid gap-6 bg-[#123f55] p-6 text-white lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-[#d8f0f6]">Doctor Console</p>
            <h2 className="mt-2 text-3xl font-black text-white">Today's OPD Flow</h2>
            <p className="mt-2 max-w-2xl text-[#eef8fb]">
              Current consultation, next token, and remaining patients are grouped here for quick doctor-side decisions.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm text-[#d8f0f6]">Now Consulting</p>
                <p className="mt-2 text-4xl font-black text-white">{current ? `#${current.appointment.tokenNumber}` : "-"}</p>
                <p className="mt-1 text-sm text-[#eef8fb]">{current ? fullName(current.patient) : "No active patient"}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm text-[#d8f0f6]">Next Token</p>
                <p className="mt-2 text-4xl font-black text-white">{next ? `#${next.appointment.tokenNumber}` : "-"}</p>
                <p className="mt-1 text-sm text-[#eef8fb]">{next ? fullName(next.patient) : "Queue clear"}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm text-[#d8f0f6]">Still Remaining</p>
                <p className="mt-2 text-4xl font-black text-white">{remaining.length}</p>
                <p className="mt-1 text-sm text-[#eef8fb]">Waiting and current patients</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-5 text-slate-950 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-clinic-50 p-3 text-clinic-700"><Search size={22} /></div>
              <div>
                <h3 className="font-bold">Patient Search</h3>
                <p className="text-sm text-slate-500">Search by token, mobile, name, or village</p>
              </div>
            </div>
            <div className="mt-4">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Example: 3, Meena, 9876501122" />
            </div>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto scrollbar-thin">
              {query.trim() && searchRows.map(({ appointment, patient }) => (
                <Link
                  key={appointment.id}
                  to={`/doctor/patient/${appointment.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:border-clinic-200 hover:bg-clinic-25"
                >
                  <div>
                    <p className="font-bold text-slate-950">#{appointment.tokenNumber} {fullName(patient)}</p>
                    <p className="text-sm text-slate-500">{patient.mobile} • {patient.village}</p>
                  </div>
                  <Badge status={appointment.status} />
                </Link>
              ))}
              {query.trim() && !searchRows.length && <EmptyState title="No patient found" body="Try another token, mobile number, or patient name." />}
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today Total Patients" value={rows.length} icon={<Users />} />
        <StatCard title="Waiting Patients" value={remaining.length} icon={<Activity />} tone="amber" />
        <StatCard title="Completed Patients" value={rows.filter((r) => ["COMPLETED", "SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(r.appointment.status)).length} icon={<CheckCircle2 />} tone="green" />
        <StatCard title="Current Patient" value={current ? `#${current.appointment.tokenNumber}` : "-"} icon={<UserCheck />} />
      </div>
      <QueuePanel role="doctor" />
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
  const [form, setForm] = useState(announcement);
  return <Panel title="Doctor Announcement"><form className="grid gap-4 max-w-2xl" onSubmit={(e) => { e.preventDefault(); setAnnouncement(form); }}><div><Label>Message</Label><Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div><div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div></div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active announcement</label><Button type="submit">Save Announcement</Button></form></Panel>;
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
  const prescriptions = useClinicStore((state) => state.prescriptions);
  const appointments = useClinicStore((state) => state.appointments);
  const inventory = useClinicStore((state) => state.inventory);
  const pending = prescriptions.filter((rx) => appointments.find((a) => a.id === rx.appointmentId)?.status === "SENT_TO_PHARMACY");
  const issuedToday = appointments.filter((a) => a.appointmentDate === today() && a.status === "MEDICINE_ISSUED").length;
  const billing = prescriptions.filter((rx) => appointments.find((a) => a.id === rx.appointmentId)?.status === "MEDICINE_ISSUED").reduce((sum, rx) => sum + rx.medicines.reduce((s, m) => s + m.quantity * m.price, 0), 0);
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard title="Pending Prescriptions" value={pending.length} icon={<ClipboardList />} tone="amber" /><StatCard title="Total Medicines In Stock" value={inventory.reduce((s, m) => s + m.stockQty, 0)} icon={<Pill />} /><StatCard title="Medicines Issued Today" value={issuedToday} icon={<PackagePlus />} tone="green" /><StatCard title="Today's Billing Total" value={currency(billing)} icon={<BadgeIndianRupee />} tone="slate" /></div><PrescriptionQueue /></div>;
}

function PrescriptionQueue() {
  const prescriptions = useClinicStore((state) => state.prescriptions);
  const appointments = useClinicStore((state) => state.appointments);
  const patients = useClinicStore((state) => state.patients);
  const issueMedicine = useClinicStore((state) => state.issueMedicine);
  const updatePrescriptionPrices = useClinicStore((state) => state.updatePrescriptionPrices);
  const [bill, setBill] = useState<string | null>(null);
  const rows = prescriptions.map((rx) => ({ rx, appointment: appointments.find((a) => a.id === rx.appointmentId), patient: patientFor(patients, rx.patientId) })).filter((row) => row.appointment && row.patient && ["SENT_TO_PHARMACY", "MEDICINE_ISSUED"].includes(row.appointment.status));
  const active = rows.find((row) => row.rx.id === bill);
  const doseText = (medicine: MedicineItem) => [
    medicine.morning ? "M" : "",
    medicine.afternoon ? "A" : "",
    medicine.night ? "N" : "",
  ].filter(Boolean).join("-") || "-";
  return <Panel title="Prescription Queue"><div className="overflow-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr className="border-b"><th className="py-3">Token</th><th>Patient</th><th>Doctor Prescription</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(({ rx, appointment, patient }) => <tr key={rx.id} className="border-b border-slate-100 align-top"><td className="py-3 font-bold">#{appointment!.tokenNumber}</td><td className="py-3">{fullName(patient!)}</td><td className="py-3"><div className="space-y-2">{rx.medicines.map((m) => <div key={m.medicineName} className="rounded-md bg-slate-50 p-2"><p className="font-bold text-slate-900">{m.medicineName}</p><p className="text-xs text-slate-600">Dose: {doseText(m)} • {m.days} days • Qty {m.quantity} • {m.beforeFood ? "Before food" : ""} {m.afterFood ? "After food" : ""}</p></div>)}</div><p className="mt-2 text-xs text-slate-500">Notes: {rx.doctorNotes}</p></td><td className="py-3">{currency(rx.medicines.reduce((s, m) => s + m.price * m.quantity, 0))}</td><td className="py-3"><Badge status={appointment!.status} /></td><td className="py-3"><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setBill(rx.id)}>Enter Price / Bill</Button><Button disabled={appointment!.status === "MEDICINE_ISSUED"} onClick={() => issueMedicine(rx.id)}>Issue Medicine</Button></div></td></tr>)}</tbody></table></div>{!rows.length && <EmptyState title="No pharmacy prescriptions" body="Doctor prescriptions sent to pharmacy will appear here." />}{active && <InvoiceModal row={active as never} onClose={() => setBill(null)} onSavePrices={(prices) => updatePrescriptionPrices(active.rx.id, prices)} />}</Panel>;
}

function InvoiceModal({
  row,
  onClose,
  onSavePrices,
}: {
  row: { rx: ReturnType<typeof useClinicStore.getState>["prescriptions"][number]; appointment: Appointment; patient: Patient };
  onClose: () => void;
  onSavePrices: (prices: Record<string, number>) => void;
}) {
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(row.rx.medicines.map((medicine) => [medicine.medicineName, medicine.price])),
  );
  const [pricesSaved, setPricesSaved] = useState(row.rx.medicines.every((medicine) => medicine.price > 0));
  const allPricesEntered = row.rx.medicines.every((medicine) => (prices[medicine.medicineName] || 0) > 0);
  const total = row.rx.medicines.reduce((sum, medicine) => sum + medicine.quantity * (prices[medicine.medicineName] || 0), 0);
  return <Modal title="Professional Invoice" onClose={onClose}><div className="rounded-lg border border-slate-200 p-5"><div className="flex justify-between"><div><p className="text-xl font-bold">Aarogya OPD Clinic</p><p className="text-sm text-slate-500">Medicine invoice</p></div><div className="text-right"><p className="font-bold">Token #{row.appointment.tokenNumber}</p><p className="text-sm text-slate-500">{today()}</p></div></div><p className="mt-5 font-semibold">Patient: {fullName(row.patient)}</p><p className="mt-2 text-sm text-slate-600">Doctor notes: {row.rx.doctorNotes}</p><table className="mt-4 w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-2">Medicine</th><th>Schedule</th><th>Days</th><th>Qty</th><th>Manual Unit Price</th><th>Subtotal</th></tr></thead><tbody>{row.rx.medicines.map((m) => <tr key={m.medicineName} className="border-b"><td className="p-2 font-semibold">{m.medicineName}</td><td>{[m.morning ? "M" : "", m.afternoon ? "A" : "", m.night ? "N" : ""].filter(Boolean).join("-") || "-"}</td><td>{m.days}</td><td>{m.quantity}</td><td className="py-2"><Input type="number" min="0" value={prices[m.medicineName] ?? 0} onChange={(event) => { setPricesSaved(false); setPrices({ ...prices, [m.medicineName]: Number(event.target.value) }); }} /></td><td>{currency(m.quantity * (prices[m.medicineName] || 0))}</td></tr>)}</tbody></table>{!allPricesEntered && <p className="mt-3 text-sm font-semibold text-amber-700">Enter price for every medicine to enable bill print.</p>}<div className="mt-4 text-right text-xl font-bold">Grand Total: {currency(total)}</div><div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Close</Button>{pricesSaved && allPricesEntered && <Button variant="secondary" onClick={() => window.print()}>Print</Button>}<Button disabled={!allPricesEntered} onClick={() => { onSavePrices(prices); setPricesSaved(true); }}>Save Bill Price</Button></div></div></Modal>;
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

  return (
    <div className="min-h-screen bg-[#eef4f7] p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase text-[#115f7e]">Aarogya OPD Clinic</p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">Patient Queue Status</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">{fullName(selected.patient)} / {selected.patient.mobile}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={available ? "AVAILABLE" : "NOT AVAILABLE"} />
            <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" to="/patient/login">Logout</Link>
          </div>
        </div>

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

        {isDoctorUnavailable(announcement) && <div className="mt-6 rounded-lg bg-amber-100 p-5 text-amber-900"><b>Doctor leave notice:</b> {announcement.message}</div>}
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
