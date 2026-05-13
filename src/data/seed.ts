import type { Appointment, DoctorAnnouncement, MedicineInventory, Patient, Prescription, Staff } from "../types";

export const seedPatients: Patient[] = [];
export const seedAppointments: Appointment[] = [];
export const seedPrescriptions: Prescription[] = [];

export const seedInventory: MedicineInventory[] = [
  { id: "m1", medicineName: "Paracetamol 500mg", stockQty: 220, unitPrice: 2 },
  { id: "m2", medicineName: "Cetirizine 10mg", stockQty: 140, unitPrice: 1.5 },
  { id: "m3", medicineName: "Azithromycin 500mg", stockQty: 60, unitPrice: 24 },
  { id: "m4", medicineName: "Pantoprazole 40mg", stockQty: 180, unitPrice: 5 },
  { id: "m5", medicineName: "Amlodipine 5mg", stockQty: 200, unitPrice: 2.5 },
  { id: "m6", medicineName: "ORS Sachet", stockQty: 90, unitPrice: 12 },
  { id: "m7", medicineName: "Cough Syrup 100ml", stockQty: 45, unitPrice: 68 },
  { id: "m8", medicineName: "Vitamin D3", stockQty: 75, unitPrice: 18 },
];

export const seedAnnouncement: DoctorAnnouncement = {
  message: "Doctor unavailable from May 20 to May 25 for a medical conference.",
  startDate: "2026-05-20",
  endDate: "2026-05-25",
  isActive: true,
};

export const seedStaff: Staff[] = [
  { id: "s1", fullName: "Pooja Shah", role: "Nurse", mobile: "9811111111", email: "pooja@clinic.demo", address: "Anand Road, Nadiad", joiningDate: "2025-08-12", username: "nurse", password: "1234", status: "Active" },
  { id: "s2", fullName: "Neha Patel", role: "Nurse", mobile: "9811111112", email: "neha@clinic.demo", address: "Station Road, Anand", joiningDate: "2026-01-04", username: "nurse2", password: "1234", status: "Active" },
  { id: "s3", fullName: "Rahul Mehta", role: "Medical Department", mobile: "9811111113", email: "rahul@clinic.demo", address: "Vallabh Vidyanagar", joiningDate: "2025-11-20", username: "medical", password: "1234", status: "Active" },
  { id: "s4", fullName: "Sonal Desai", role: "Medical Department", mobile: "9811111114", email: "sonal@clinic.demo", address: "Karamsad", joiningDate: "2026-02-18", username: "medical2", password: "1234", status: "Inactive" },
];
