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
    lastLogin: "2026-08-18",
    issuedBy: "System Root",
    notes: "Cuenta Maestra con acceso exclusivo al Panel de Control de Licencias y supervisión global.",
    firebaseSynced: true,
  },
  {
    id: "lic-postor-andina",
    userName: "Ing. Carlos Mendoza Ramos",
    userEmail: "carlos@andinaingenieros.pe",
    companyName: "ANDINA INGENIEROS & CONTRATISTAS S.A.C.",
    ruc: "20549281921",
    licenseKey: "LIC-ANDINA-2026-PRO",
    role: "postor",
    status: "active",
    createdAt: "2026-02-01",
    expiresAt: "2027-02-01",
    maxTenders: 50,
    currentTendersCount: 2,
    lastLogin: "2026-08-19",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia activa de postor - Registro independiente de expedientes y obras.",
    firebaseSynced: true,
  },
  {
    id: "lic-postor-pacifico",
    userName: "Ing. Lucía Fernández Rojas",
    userEmail: "lucia@pacificoconsultores.pe",
    companyName: "CONSORCIO PACÍFICO VIAL",
    ruc: "20601839281",
    licenseKey: "LIC-PACIFICO-2026-STD",
    role: "postor",
    status: "active",
    createdAt: "2026-03-15",
    expiresAt: "2027-03-15",
    maxTenders: 30,
    currentTendersCount: 1,
    lastLogin: "2026-08-19",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia activa de postor - Espacio de trabajo exclusivo.",
    firebaseSynced: true,
  },
];
