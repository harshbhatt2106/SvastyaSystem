export type Role = "Doctor" | "Nurse" | "Medical Department";

export type AppointmentStatus =
  | "WAITING"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "SENT_TO_PHARMACY"
  | "MEDICINE_ISSUED";

export interface VisitHistoryItem {
  visitDate: string;
  visitTime?: string;
  tokenNumber: number;
  doctorNotes: string;
  medicines: string[];
}

export interface Patient {
  id: string;
  firstName: string;
  surname: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  weight: number;
  village: string;
  totalVisits: number;
  lastVisitDate: string;
  visitHistory: VisitHistoryItem[];
}

export interface Appointment {
  id: string;
  patientId: string;
  tokenNumber: number;
  appointmentDate: string;
  createdAt: string;
  createdBy: string;
  status: AppointmentStatus;
}

export interface MedicineItem {
  medicineName: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  days: number;
  beforeFood: boolean;
  afterFood: boolean;
  quantity: number;
  price: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorNotes: string;
  medicines: MedicineItem[];
  createdAt: string;
}

export interface DoctorAnnouncement {
  message: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface MedicineInventory {
  id: string;
  medicineName: string;
  stockQty: number;
  unitPrice: number;
}

export interface Staff {
  id: string;
  fullName: string;
  role: Exclude<Role, "Doctor">;
  mobile: string;
  email: string;
  address: string;
  joiningDate: string;
  username: string;
  password: string;
  status: "Active" | "Inactive";
  profilePhoto?: string;
}

export interface User {
  username: string;
  role: Role;
  name: string;
}
