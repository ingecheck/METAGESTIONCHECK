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
export const ACTIVE_USER_STORAGE_KEY = "osce_current_user_free_v1";

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
    id: "lic-muni-rioja",
    userName: "Gerencia de Infraestructura (Muni Rioja)",
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
    maxTeamMembers: 15,
    currentTendersCount: 2,
    lastLogin: "2026-08-26",
    issuedBy: ADMIN_MASTER_EMAIL,
    notes: "Licencia oficial para la Municipalidad Provincial de Rioja (San Martín). Gestión técnica, OEI y control de obras públicas.",
    firebaseSynced: true,
    teamMembers: [
      {
        id: "tm-rioja-1",
        name: "Gerente de Infraestructura",
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
        id: "tm-rioja-josue-pilco",
        name: "Ing. Josué Pilco",
        email: "jpilco@munirioja.gob.pe",
        dni: "45892147",
        cip: "CIP 214589",
        role: "supervisor",
        cargoText: "Especialista OEI / Seguimiento de Inversiones y Obras (Pilco)",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-02",
        allowedModules: ["all"],
      },
      {
        id: "tm-rioja-luis",
        name: "Ing. Luis Vásquez",
        email: "luis.oei@munirioja.gob.pe",
        dni: "46781203",
        cip: "CIP 198542",
        role: "residente",
        cargoText: "Ingeniero OEI / Control de Proyectos e Informes",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-03",
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
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-05",
        allowedModules: ["all"],
      },
      {
        id: "tm-rioja-3",
        name: "Ing. Vanessa Dávila Ruiz",
        email: "vdavila@munirioja.gob.pe",
        dni: "46890112",
        cip: "CIP 198421",
        role: "especialista_costos",
        cargoText: "Especialista en Valorizaciones y Liquidaciones de Obra",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-10",
        allowedModules: ["all"],
      },
      {
        id: "tm-rioja-jhon",
        name: "Ing. Jhon Franklin Torres Abanto",
        email: "jhon.obras@munirioja.gob.pe",
        dni: "71289410",
        cip: "CIP 230182",
        role: "supervisor",
        cargoText: "Especialista OEI / Seguimiento de Obras & Valorizaciones",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-12",
        allowedModules: ["all"],
      },
      {
        id: "tm-rioja-jennifer",
        name: "Ing. Jennifer Del Pilar Diaz Tuesta",
        email: "jdiaz@munirioja.gob.pe",
        dni: "47812903",
        cip: "CIP 248901",
        role: "supervisor",
        cargoText: "Especialista OEI / Seguimiento y Control de Proyectos",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-15",
        allowedModules: ["all"],
      },
      {
        id: "tm-rioja-jezer",
        name: "Ing. Jezer Daniel Chamoly Urtecho",
        email: "jchamoly@munirioja.gob.pe",
        dni: "46290184",
        cip: "CIP 251029",
        role: "supervisor",
        cargoText: "Especialista OEI / Seguimiento de Puentes y Obras Civiles",
        accessPin: "1234",
        status: "active",
        createdAt: "2026-03-16",
        allowedModules: ["all"],
      },
    ],
  },
];

/**
 * Safely merge two versions of a LicenseSession, ensuring teamMembers are never lost or wiped out.
 */
export function mergeLicenseSessionWithExisting(
  existing: LicenseSession | undefined,
  incoming: LicenseSession
): LicenseSession {
  if (!existing) return incoming;

  const memberMap = new Map<string, TeamMember>();

  // 1. Put incoming members
  (incoming.teamMembers || []).forEach((m) => {
    if (m && (m.id || m.email)) {
      const key = m.id || m.email;
      memberMap.set(key, m);
    }
  });

  // 2. Put existing members (preserve local collaborators, unioning lists)
  (existing.teamMembers || []).forEach((m) => {
    if (m && (m.id || m.email)) {
      const key = m.id || m.email;
      const current = memberMap.get(key);
      if (!current) {
        memberMap.set(key, m);
      } else {
        memberMap.set(key, {
          ...current,
          ...m,
          allowedModules: m.allowedModules || current.allowedModules || ["all"],
        });
      }
    }
  });

  return {
    ...incoming,
    ...existing,
    teamMembers: Array.from(memberMap.values()),
    status: existing.status === "suspended" ? "suspended" : (incoming.status || existing.status),
  };
}
