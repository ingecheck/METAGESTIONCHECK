export interface LicenseSession {
  id: string;
  userId?: string; // Firebase Auth UID
  userName: string;
  userEmail: string;
  companyName: string;
  ruc: string;
  licenseKey: string;
  role: "admin" | "postor" | "consultor";
  status: "active" | "suspended" | "expired";
  createdAt: string;
  expiresAt: string;
  maxTenders: number;
  currentTendersCount: number;
  lastLogin?: string;
  issuedBy: string; // admin email
  notes?: string;
  firebaseSynced?: boolean;
}

export interface LicenseRequest {
  id: string;
  userName: string;
  userEmail: string;
  companyName: string;
  ruc: string;
  intendedUse?: string;
  phone?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  assignedKey?: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: LicenseSession | null;
  isAdmin: boolean;
}

export const ADMIN_MASTER_EMAIL = "ingecheckplus@gmail.com";

export const ADMIN_MASTER_CREDENTIALS = {
  email: "ingecheckplus@gmail.com",
  adminKey: "ADMIN-OSCE-MASTER-2026",
  name: "Administrador Principal (ingecheckplus@gmail.com)",
};

export const INITIAL_DEFAULT_SESSIONS: LicenseSession[] = [
  {
    id: "lic-admin-master",
    userName: "Administrador Principal",
    userEmail: ADMIN_MASTER_EMAIL,
    companyName: "GESTIÓN DE LICITACIONES Y CONTRATACIONES",
    ruc: "20100000001",
    licenseKey: "ADMIN-OSCE-MASTER-2026",
    role: "admin",
    status: "active",
    createdAt: "2026-01-01",
    expiresAt: "2035-12-31",
    maxTenders: 99999,
    currentTendersCount: 0,
    lastLogin: "2026-08-20",
    issuedBy: "System Root",
    notes: "Cuenta Maestra con acceso exclusivo al Panel de Control de Licencias y supervisión global.",
    firebaseSynced: true,
  },
  {
    id: "lic-postor-jhon-franklin",
    userName: "Jhon Franklin",
    userEmail: "jfta12345678@gmail.com",
    companyName: "CONSTRUCTORA & CONSULTORES JF S.A.C.",
    ruc: "20608899112",
    licenseKey: "LIC-JHON-FRANKLIN-2026",
    role: "postor",
    status: "active",
    createdAt: "2026-08-20",
    expiresAt: "2027-08-20",
    maxTenders: 100,
    currentTendersCount: 0,
    lastLogin: "2026-08-20",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia de postor habilitada para Jhon Franklin.",
    firebaseSynced: true,
  },
];
