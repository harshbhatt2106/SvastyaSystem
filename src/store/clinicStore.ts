import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedAnnouncement, seedAppointments, seedInventory, seedPatients, seedPrescriptions, seedStaff } from "../data/seed";
import type { Appointment, AppointmentStatus, DoctorAnnouncement, MedicineInventory, MedicineItem, Patient, Prescription, Role, Staff, User } from "../types";

const today = () => new Date().toISOString().slice(0, 10);
const stamp = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

export interface ClinicState {
  user: User | null;
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  inventory: MedicineInventory[];
  announcement: DoctorAnnouncement;
  staff: Staff[];
  toast: { id: string; message: string; type: "success" | "error" | "info" } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  pushToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
  createPatientAppointment: (patient: Omit<Patient, "id" | "totalVisits" | "lastVisitDate" | "visitHistory">, createdBy: string, appointmentDate?: string, feeCollected?: boolean) => Appointment;
  createAppointmentForExisting: (patientId: string, createdBy: string, appointmentDate?: string, feeCollected?: boolean) => Appointment;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  collectAppointmentFee: (appointmentId: string) => void;
  savePrescription: (appointmentId: string, doctorNotes: string, medicines: MedicineItem[], sendToPharmacy: boolean) => void;
  setAnnouncement: (announcement: DoctorAnnouncement) => void;
  deleteAnnouncement: () => void;
  addInventory: (medicine: Omit<MedicineInventory, "id">) => void;
  updateInventory: (medicine: MedicineInventory) => void;
  deleteInventory: (medicineId: string) => void;
  updatePrescriptionPrices: (prescriptionId: string, prices: Record<string, number>) => void;
  issueMedicine: (prescriptionId: string, issuedMedicineNames: string[]) => void;
  addStaff: (staff: Omit<Staff, "id">) => void;
  updateStaff: (staff: Staff) => void;
  deleteStaff: (staffId: string) => void;
  toggleStaffStatus: (staffId: string) => void;
}

const doctorUser = { username: "doctor", password: "1234", role: "Doctor" as Role, name: "Dr. Mahesh Shah" };

const nextToken = (appointments: Appointment[], appointmentDate = today()) => {
  const dayAppointments = appointments.filter((appointment) => appointment.appointmentDate === appointmentDate);
  return dayAppointments.length ? Math.max(...dayAppointments.map((appointment) => appointment.tokenNumber)) + 1 : 1;
};

const updatePatientVisit = (patient: Patient, appointment: Appointment, notes: string, medicines: MedicineItem[]) => ({
  ...patient,
  totalVisits: patient.totalVisits + 1,
  lastVisitDate: today(),
  visitHistory: [
    {
      visitDate: today(),
      visitTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tokenNumber: appointment.tokenNumber,
      doctorNotes: notes,
      medicines: medicines.map((medicine) => medicine.medicineName),
    },
    ...patient.visitHistory,
  ],
});

const replacePatientVisit = (patient: Patient, appointment: Appointment, notes: string, medicines: MedicineItem[]) => ({
  ...patient,
  visitHistory: patient.visitHistory.map((visit) =>
    visit.tokenNumber === appointment.tokenNumber && visit.visitDate === appointment.appointmentDate
      ? { ...visit, doctorNotes: notes, medicines: medicines.map((medicine) => medicine.medicineName) }
      : visit,
  ),
});

export const useClinicStore = create<ClinicState>()(
  persist(
    (set, get) => ({
      user: null,
      patients: seedPatients,
      appointments: seedAppointments,
      prescriptions: seedPrescriptions,
      inventory: seedInventory,
      announcement: seedAnnouncement,
      staff: seedStaff,
      toast: null,

      login: (username, password) => {
        const staffUser = get().staff.find(
          (staff) => staff.username === username && staff.password === password && staff.status === "Active",
        );
        if (username === doctorUser.username && password === doctorUser.password) {
          set({ user: { username, role: "Doctor", name: doctorUser.name } });
          return true;
        }
        if (staffUser) {
          set({ user: { username, role: staffUser.role, name: staffUser.fullName } });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),
      pushToast: (message, type = "success") => set({ toast: { id: id("toast"), message, type } }),
      clearToast: () => set({ toast: null }),

      createPatientAppointment: (patientInput, createdBy, appointmentDate = today(), feeCollected = false) => {
        const patient: Patient = {
          ...patientInput,
          id: id("p"),
          totalVisits: 0,
          lastVisitDate: "",
          visitHistory: [],
        };
        const appointment: Appointment = {
          id: id("a"),
          patientId: patient.id,
          tokenNumber: nextToken(get().appointments, appointmentDate),
          appointmentDate,
          createdAt: stamp(),
          createdBy,
          caseType: "NEW",
          consultationFee: 200,
          feeCollected,
          status: "WAITING",
        };
        set((state) => ({ patients: [patient, ...state.patients], appointments: [...state.appointments, appointment] }));
        get().pushToast(`Token ${appointment.tokenNumber} created for ${patient.firstName}.`);
        return appointment;
      },
      createAppointmentForExisting: (patientId, createdBy, appointmentDate = today(), feeCollected = false) => {
        const appointment: Appointment = {
          id: id("a"),
          patientId,
          tokenNumber: nextToken(get().appointments, appointmentDate),
          appointmentDate,
          createdAt: stamp(),
          createdBy,
          caseType: "OLD",
          consultationFee: 100,
          feeCollected,
          status: "WAITING",
        };
        set((state) => ({ appointments: [...state.appointments, appointment] }));
        get().pushToast(`Token ${appointment.tokenNumber} created.`);
        return appointment;
      },
      updateAppointmentStatus: (appointmentId, status) => {
        set((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === appointmentId ? { ...appointment, status } : appointment,
          ),
        }));
        get().pushToast("Appointment status updated.");
      },
      collectAppointmentFee: (appointmentId) => {
        set((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === appointmentId ? { ...appointment, feeCollected: true } : appointment,
          ),
        }));
        get().pushToast("Appointment fee collected.");
      },
      savePrescription: (appointmentId, doctorNotes, medicines, sendToPharmacy) => {
        const appointment = get().appointments.find((item) => item.id === appointmentId);
        if (!appointment) return;
        const existing = get().prescriptions.find((item) => item.appointmentId === appointmentId);
        const prescription: Prescription = {
          id: existing?.id ?? id("rx"),
          patientId: appointment.patientId,
          appointmentId,
          doctorNotes,
          medicines,
          issuedMedicines: existing?.issuedMedicines ?? [],
          createdAt: stamp(),
        };
        set((state) => ({
          prescriptions: existing
            ? state.prescriptions.map((item) => (item.id === existing.id ? prescription : item))
            : [prescription, ...state.prescriptions],
          appointments: state.appointments.map((item) =>
            item.id === appointmentId
              ? {
                  ...item,
                  status: sendToPharmacy
                    ? "SENT_TO_PHARMACY"
                    : item.status === "SENT_TO_PHARMACY" || item.status === "MEDICINE_ISSUED"
                      ? item.status
                      : "COMPLETED",
                }
              : item,
          ),
          patients: state.patients.map((patient) =>
            patient.id === appointment.patientId
              ? existing
                ? replacePatientVisit(patient, appointment, doctorNotes, medicines)
                : updatePatientVisit(patient, appointment, doctorNotes, medicines)
              : patient,
          ),
        }));
        get().pushToast(sendToPharmacy ? "Prescription sent to pharmacy." : "Prescription saved.");
      },
      setAnnouncement: (announcement) => {
        set({ announcement });
        get().pushToast("Announcement successfully announced.");
      },
      deleteAnnouncement: () => {
        set({ announcement: { message: "", startDate: today(), endDate: today(), isActive: false } });
        get().pushToast("Announcement deleted.", "info");
      },
      addInventory: (medicine) => {
        set((state) => ({ inventory: [{ ...medicine, id: id("m") }, ...state.inventory] }));
        get().pushToast("Medicine added.");
      },
      updateInventory: (medicine) => {
        set((state) => ({ inventory: state.inventory.map((item) => (item.id === medicine.id ? medicine : item)) }));
        get().pushToast("Medicine updated.");
      },
      deleteInventory: (medicineId) => {
        set((state) => ({ inventory: state.inventory.filter((item) => item.id !== medicineId) }));
        get().pushToast("Medicine deleted.", "info");
      },
      updatePrescriptionPrices: (prescriptionId, prices) => {
        set((state) => ({
          prescriptions: state.prescriptions.map((prescription) =>
            prescription.id === prescriptionId
              ? {
                  ...prescription,
                  medicines: prescription.medicines.map((medicine) => ({
                    ...medicine,
                    price: prices[medicine.medicineName] ?? medicine.price,
                  })),
                }
              : prescription,
          ),
        }));
        get().pushToast("Medicine prices updated.");
      },
      issueMedicine: (prescriptionId, issuedMedicineNames) => {
        const prescription = get().prescriptions.find((item) => item.id === prescriptionId);
        if (!prescription) return;
        if (!issuedMedicineNames.length) {
          get().pushToast("Select at least one medicine before issuing.", "error");
          return;
        }
        set((state) => ({
          inventory: state.inventory.map((item) => {
            const used = prescription.medicines.find((medicine) => medicine.medicineName === item.medicineName && issuedMedicineNames.includes(medicine.medicineName));
            return used ? { ...item, stockQty: Math.max(0, item.stockQty - used.quantity) } : item;
          }),
          prescriptions: state.prescriptions.map((item) =>
            item.id === prescriptionId ? { ...item, issuedMedicines: issuedMedicineNames } : item,
          ),
          appointments: state.appointments.map((appointment) =>
            appointment.id === prescription.appointmentId ? { ...appointment, status: "MEDICINE_ISSUED" } : appointment,
          ),
        }));
        get().pushToast("Selected medicines issued and stock deducted.");
      },
      addStaff: (staffInput) => {
        set((state) => ({ staff: [{ ...staffInput, id: id("s") }, ...state.staff] }));
        get().pushToast("Staff member created.");
      },
      updateStaff: (staffMember) => {
        set((state) => ({ staff: state.staff.map((item) => (item.id === staffMember.id ? staffMember : item)) }));
        get().pushToast("Staff member updated.");
      },
      deleteStaff: (staffId) => {
        set((state) => ({ staff: state.staff.filter((item) => item.id !== staffId) }));
        get().pushToast("Staff member deleted.", "info");
      },
      toggleStaffStatus: (staffId) => {
        set((state) => ({
          staff: state.staff.map((item) =>
            item.id === staffId ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item,
          ),
        }));
        get().pushToast("Staff status updated.");
      },
    }),
    {
      name: "clinic-opd-demo-store-empty-patients",
      partialize: (state) => ({
        user: state.user,
        patients: state.patients,
        appointments: state.appointments,
        prescriptions: state.prescriptions,
        inventory: state.inventory,
        announcement: state.announcement,
        staff: state.staff,
      }),
    },
  ),
);

export const currency = (value: number) => `Rs ${value.toFixed(2)}`;
export const fullName = (patient: Patient) => `${patient.firstName} ${patient.surname}`;
export const todaysAppointments = (appointments: Appointment[]) => appointments.filter((appointment) => appointment.appointmentDate === today());
export const statusLabel = (status: AppointmentStatus) => status.replaceAll("_", " ");
