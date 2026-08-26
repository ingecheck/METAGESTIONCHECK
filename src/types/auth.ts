export type EntityType =
  | "municipalidad"
  | "gobierno_regional"
  | "ministerio"
  | "empresa"
  | "consorcio"
  | "consultor_supervisor";

export type TeamMemberRole =
  | "titular"
  | "residente"
  | "supervisor"
  | "especialista_costos"
  | "gestor_licitaciones"
  | "auditor"
  | "admin_contratos"
  | "asistente";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  dni?: string;
  cip?: string; // Colegiatura del Ingeniero / Arquitecto
  role: TeamMemberRole;
  cargoText?: string;
  phone?: string;
  accessPin?: string; // PIN de 4-6 dígitos para acceso rápido del colaborador
  status: "active" | "inactive";
  createdAt: string;
  lastAccess?: string;
  allowedModules?: ("ofertador" | "obras" | "auditoria" | "valorizaciones" | "all")[];
  notes?: string;
}

export interface LicenseSession {
  id: string;
  userId?: string; // Firebase Auth UID
  userName: string;
  userEmail: string;
  companyName: string;
  ruc: string;
  licenseKey: string;
  role: "admin" | "postor" | "consultor" | "entidad";
  entityType?: EntityType;
  status: "active" | "suspended" | "expired";
  createdAt: string;
  expiresAt: string;
  maxTenders: number;
  maxTeamMembers?: number; // Límite de miembros permitidos en el equipo
  teamMembers?: TeamMember[]; // Lista de colaboradores agregados por el titular
  currentTendersCount: number;
  lastLogin?: string;
  issuedBy: string; // admin email
  notes?: string;
  firebaseSynced?: boolean;
  activeMemberId?: string; // ID del miembro activo que está operando la mesa de trabajo
}

export interface LicenseRequest {
  id: string;
  userName: string;
  userEmail: string;
  companyName: string;
  ruc: string;
  entityType?: EntityType;
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
    entityType: "ministerio",
    status: "active",
    createdAt: "2026-01-01",
    expiresAt: "2035-12-31",
    maxTenders: 99999,
    maxTeamMembers: 999,
    teamMembers: [],
    currentTendersCount: 0,
    lastLogin: "2026-08-26",
    issuedBy: "System Root",
    notes: "Cuenta Maestra con acceso exclusivo al Panel de Control de Licencias y supervisión global.",
    firebaseSynced: true,
  },
  {
    id: "lic-muni-chiclayo",
    userName: "Ing. Marco Tulio Morales (Gerente de Infraestructura)",
    userEmail: "infraestructura@munichiclayo.gob.pe",
    companyName: "MUNICIPALIDAD PROVINCIAL DE CHICLAYO",
    ruc: "20175997008",
    licenseKey: "LIC-MUNI-CHICLAYO-2026",
    role: "entidad",
    entityType: "municipalidad",
    status: "active",
    createdAt: "2026-02-01",
    expiresAt: "2027-12-31",
    maxTenders: 50,
    maxTeamMembers: 10,
    currentTendersCount: 3,
    lastLogin: "2026-08-26",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia de Entidad Pública para la Municipalidad Provincial de Chiclayo. Mesa de trabajo para obras y contrataciones.",
    firebaseSynced: true,
    teamMembers: [
      {
        id: "tm-muni-1",
        name: "Ing. Marco Tulio Morales",
        email: "infraestructura@munichiclayo.gob.pe",
        dni: "43890122",
        cip: "CIP 189432",
        role: "titular",
        cargoText: "Gerente de Infraestructura y Obras Públicas",
        accessPin: "1122",
        status: "active",
        createdAt: "2026-02-01",
        allowedModules: ["all"],
      },
      {
        id: "tm-muni-2",
        name: "Ing. Carlos Santisteban Ramos",
        email: "csantisteban@munichiclayo.gob.pe",
        dni: "45129844",
        cip: "CIP 204519",
        role: "supervisor",
        cargoText: "Supervisor de Obras Viales",
        accessPin: "2233",
        status: "active",
        createdAt: "2026-02-05",
        allowedModules: ["obras", "auditoria", "valorizaciones"],
      },
      {
        id: "tm-muni-3",
        name: "Eco. Patricia Valdivieso",
        email: "pvaldivieso@munichiclayo.gob.pe",
        dni: "47890123",
        role: "especialista_costos",
        cargoText: "Especialista en Valorizaciones y Liquidaciones",
        accessPin: "3344",
        status: "active",
        createdAt: "2026-02-10",
        allowedModules: ["obras", "valorizaciones"],
      },
    ],
  },
  {
    id: "lic-muni-rioja",
    userName: "Ing. Carlos Mendoza Pinedo (Gerente de Infraestructura)",
    userEmail: "infraestructura@munirioja.gob.pe",
    companyName: "MUNICIPALIDAD PROVINCIAL DE RIOJA",
    ruc: "20148174415",
    licenseKey: "LIC-MUNI-RIOJA-2026",
    role: "entidad",
    entityType: "municipalidad",
    status: "active",
    createdAt: "2026-03-01",
    expiresAt: "2027-12-31",
    maxTenders: 50,
    maxTeamMembers: 10,
    currentTendersCount: 2,
    lastLogin: "2026-08-26",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia oficial para la Municipalidad Provincial de Rioja (San Martín). Gestión técnica y de control de obras públicas.",
    firebaseSynced: true,
    teamMembers: [
      {
        id: "tm-rioja-1",
        name: "Ing. Carlos Mendoza Pinedo",
        email: "infraestructura@munirioja.gob.pe",
        dni: "41982341",
        cip: "CIP 178290",
        role: "titular",
        cargoText: "Gerente de Desarrollo Urbano e Infraestructura",
        accessPin: "1122",
        status: "active",
        createdAt: "2026-03-01",
        allowedModules: ["all"],
      },
      {
        id: "tm-rioja-2",
        name: "Ing. Wilson Tafur Vargas",
        email: "wtafur@munirioja.gob.pe",
        dni: "44290188",
        cip: "CIP 218904",
        role: "supervisor",
        cargoText: "Supervisor Principal de Obras Públicas",
        accessPin: "3344",
        status: "active",
        createdAt: "2026-03-05",
        allowedModules: ["obras", "auditoria", "valorizaciones"],
      },
      {
        id: "tm-rioja-3",
        name: "Ing. Vanessa Dávila Ruiz",
        email: "vdavila@munirioja.gob.pe",
        dni: "46890112",
        cip: "CIP 198421",
        role: "especialista_costos",
        cargoText: "Especialista en Valorizaciones y Liquidaciones de Obra",
        accessPin: "5566",
        status: "active",
        createdAt: "2026-03-10",
        allowedModules: ["obras", "valorizaciones"],
      },
    ],
  },
  {
    id: "lic-postor-jhon-franklin",
    userName: "Jhon Franklin",
    userEmail: "jfta12345678@gmail.com",
    companyName: "CONSTRUCTORA & CONSULTORES JF S.A.C.",
    ruc: "20608899112",
    licenseKey: "LIC-JHON-FRANKLIN-2026",
    role: "postor",
    entityType: "empresa",
    status: "active",
    createdAt: "2026-08-20",
    expiresAt: "2027-08-20",
    maxTenders: 100,
    maxTeamMembers: 8,
    currentTendersCount: 1,
    lastLogin: "2026-08-26",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia de Empresa Contratista habilitada con mesa de trabajo limpia para licitaciones y control de obras.",
    firebaseSynced: true,
    teamMembers: [
      {
        id: "tm-jf-1",
        name: "Jhon Franklin (Gerente)",
        email: "jfta12345678@gmail.com",
        dni: "71289410",
        role: "titular",
        cargoText: "Gerente General / Representante Legal",
        accessPin: "7890",
        status: "active",
        createdAt: "2026-08-20",
        allowedModules: ["all"],
      },
      {
        id: "tm-jf-2",
        name: "Ing. Fernando Castro Mendoza",
        email: "fcastro.obras@gmail.com",
        dni: "42890119",
        cip: "CIP 198244",
        role: "residente",
        cargoText: "Ingeniero Residente de Obra",
        accessPin: "4567",
        status: "active",
        createdAt: "2026-08-21",
        allowedModules: ["obras", "auditoria", "valorizaciones"],
      },
      {
        id: "tm-jf-3",
        name: "Lic. Andrea Meza Rojas",
        email: "ameza.licitaciones@gmail.com",
        dni: "46890123",
        role: "gestor_licitaciones",
        cargoText: "Especialista en Propuestas Técnicas SEACE",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-08-22",
        allowedModules: ["ofertador"],
      },
    ],
  },
];
