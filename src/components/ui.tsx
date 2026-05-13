import clsx from "clsx";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import type { AppointmentStatus } from "../types";
import { statusLabel, useClinicStore } from "../store/clinicStore";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx("w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100", props.className)} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</label>;
}

export function StatCard({ title, value, icon, tone = "blue" }: { title: string; value: ReactNode; icon: ReactNode; tone?: "blue" | "green" | "amber" | "rose" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={clsx("rounded-lg p-3", tones[tone])}>{icon}</div>
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({ status }: { status: AppointmentStatus | "Active" | "Inactive" | "AVAILABLE" | "NOT AVAILABLE" }) {
  const map: Record<string, string> = {
    WAITING: "bg-amber-50 text-amber-700 ring-amber-200",
    IN_CONSULTATION: "bg-blue-50 text-blue-700 ring-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    SENT_TO_PHARMACY: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    MEDICINE_ISSUED: "bg-slate-100 text-slate-700 ring-slate-200",
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
    AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "NOT AVAILABLE": "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1", map[status])}>{status.includes("_") ? statusLabel(status as AppointmentStatus) : status}</span>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-soft">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Info className="mx-auto text-slate-400" />
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-slate-100" />
      ))}
    </div>
  );
}

export function Toast() {
  const toast = useClinicStore((state) => state.toast);
  const clearToast = useClinicStore((state) => state.clearToast);
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? AlertCircle : Info;
  window.setTimeout(clearToast, 2600);
  return (
    <div className="fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-soft">
      <Icon size={20} className={toast.type === "error" ? "text-rose-600" : toast.type === "info" ? "text-blue-600" : "text-emerald-600"} />
      <span className="text-sm font-medium text-slate-800">{toast.message}</span>
    </div>
  );
}

export function ConfirmDialog({ title, body, onCancel, onConfirm }: { title: string; body: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
}
