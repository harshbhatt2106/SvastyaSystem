import clsx from "clsx";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import type { AppointmentStatus } from "../types";
import { statusLabel, useClinicStore } from "../store/clinicStore";

type Tone = "blue" | "green" | "amber" | "rose" | "slate";

const toneMap: Record<Tone, { border: string; icon: string; bar: string; text: string }> = {
  blue: {
    border: "border-clinic-100",
    icon: "bg-clinic-50 text-clinic-700 ring-clinic-100",
    bar: "bg-clinic-700",
    text: "text-clinic-700",
  },
  green: {
    border: "border-care-100",
    icon: "bg-care-50 text-care-700 ring-care-100",
    bar: "bg-care-600",
    text: "text-care-700",
  },
  amber: {
    border: "border-amber-100",
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    bar: "bg-amber-500",
    text: "text-amber-700",
  },
  rose: {
    border: "border-rose-100",
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    bar: "bg-rose-500",
    text: "text-rose-700",
  },
  slate: {
    border: "border-slate-200",
    icon: "bg-slate-100 text-slate-700 ring-slate-200",
    bar: "bg-slate-500",
    text: "text-slate-700",
  },
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold leading-none transition duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#124f68] text-white shadow-sm shadow-clinic-900/15 hover:-translate-y-0.5 hover:bg-[#123f55] hover:shadow-clinical focus:ring-clinic-100 [&_*]:text-white",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-clinic-200 hover:bg-clinic-25 hover:text-clinic-800 hover:shadow-sm focus:ring-clinic-100",
        variant === "danger" && "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus:ring-rose-100",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-clinic-500 focus:ring-4 focus:ring-clinic-100",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-clinic-500 focus:ring-4 focus:ring-clinic-100",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-clinic-500 focus:ring-4 focus:ring-clinic-100",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{children}</label>;
}

export function StatCard({
  title,
  value,
  icon,
  tone = "blue",
  helper,
}: {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  helper?: ReactNode;
}) {
  const selected = toneMap[tone];
  return (
    <div className={clsx("group overflow-hidden rounded-lg border bg-white/95 shadow-sm shadow-slate-200/70 ring-1 ring-white/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-clinical", selected.border)}>
      <div className={clsx("h-1.5", selected.bar)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            {helper && <p className={clsx("mt-2 text-xs font-semibold", selected.text)}>{helper}</p>}
          </div>
          <div className={clsx("shrink-0 rounded-lg p-3 ring-1 transition group-hover:scale-105", selected.icon)}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  eyebrow,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/70 ring-1 ring-white/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase text-clinic-700">{eyebrow}</p>}
          <h2 className="text-base font-black text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Badge({ status }: { status: AppointmentStatus | "Active" | "Inactive" | "AVAILABLE" | "NOT AVAILABLE" }) {
  const map: Record<string, string> = {
    WAITING: "bg-amber-50 text-amber-800 ring-amber-200",
    IN_CONSULTATION: "bg-clinic-50 text-clinic-800 ring-clinic-200",
    COMPLETED: "bg-care-50 text-care-800 ring-care-200",
    SENT_TO_PHARMACY: "bg-sky-50 text-sky-800 ring-sky-200",
    MEDICINE_ISSUED: "bg-slate-100 text-slate-700 ring-slate-200",
    Active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
    AVAILABLE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    "NOT AVAILABLE": "bg-rose-50 text-rose-800 ring-rose-200",
  };
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase ring-1", map[status])}>{status.includes("_") ? statusLabel(status as AppointmentStatus) : status}</span>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-clinical ring-1 ring-slate-200/80">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase text-clinic-700">Clinical workspace</p>
            <h3 className="text-lg font-black text-slate-950">{title}</h3>
          </div>
          <button className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-clinic-200 bg-clinic-25 p-8 text-center">
      <Info className="mx-auto text-clinic-600" />
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
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
    <div className="fixed right-5 top-5 z-[60] flex max-w-sm items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-clinical">
      <Icon size={20} className={toast.type === "error" ? "text-rose-600" : toast.type === "info" ? "text-clinic-700" : "text-emerald-600"} />
      <span className="text-sm font-medium text-slate-800">{toast.message}</span>
    </div>
  );
}

export function ConfirmDialog({ title, body, onCancel, onConfirm }: { title: string; body: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm leading-6 text-slate-600">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
}
