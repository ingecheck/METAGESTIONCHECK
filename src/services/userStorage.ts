import { UserOfferPackage, CompanyProfile, TenderInfo, KeyPersonnel, EquipmentItem, ExperienceRecord } from "../types/osce";
import { UserObraPackage, ObraProyecto, ValorizacionMensual } from "../types/obras";
import { LicenseSession } from "../types/auth";
import { EMPTY_COMPANY, EMPTY_TENDER } from "../data/sampleTenders";
import { EMPTY_OBRA, EMPTY_LIQUIDACION } from "../data/sampleObras";
import { SAMPLE_PARTIDAS_OBRA } from "../data/samplePartidas";
import { SAMPLE_AUDITORIA_DATA } from "../data/sampleIncongruencias";

const STORAGE_PREFIX = "mgc_account_";

/**
 * Returns the unique Entity Database Key.
 * All members of the technical staff (Titular, Residente, Supervisor, Costos, Asistente)
 * share this single unified database so any added/modified obra or BIM model is instantly
 * visible and synchronized across the entire entity in real time.
 */
export function getEntityStorageKey(user: LicenseSession | null): string {
  if (!user) return "guest_default";
  return user.id || user.licenseKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function getUserStorageKey(user: LicenseSession | null): string {
  return getEntityStorageKey(user);
}

export function getOffersStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getEntityStorageKey(user)}_offers_v1`;
}

export function getActiveOfferIdStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getEntityStorageKey(user)}_active_offer_id_v1`;
}

export function getObrasStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getEntityStorageKey(user)}_obras_v1`;
}

export function getActiveObraIdStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getEntityStorageKey(user)}_active_obra_id_v1`;
}

export function getCompanyStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getEntityStorageKey(user)}_company_v1`;
}

/**
 * Real-time event broadcaster for synchronized multi-member BIM & Obra collaboration
 */
export function broadcastEntitySync(changeType: "obras" | "offers" | "company" | "bim", payload?: any) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("osce_entity_realtime_sync", {
        detail: {
          changeType,
          payload,
          timestamp: Date.now(),
        },
      })
    );
  }
}

/**
 * Creates default starter data tailored to a specific user account or team member if no stored projects exist.
 * All initial workspaces start 100% clean and empty without fake or mock projects.
 */
function createInitialUserWorkspace(user: LicenseSession | null): {
  offers: UserOfferPackage[];
  obras: UserObraPackage[];
  company: CompanyProfile;
} {
  const companyName = user?.companyName || "";
  const ruc = user?.ruc || "";
  
  // Identify active team member if present
  const activeMember = user?.activeMemberId && user?.teamMembers
    ? user.teamMembers.find((m) => m.id === user.activeMemberId)
    : null;

  const userName = activeMember?.name || user?.userName || "";
  const email = activeMember?.email || user?.userEmail || "";

  const baseCompany: CompanyProfile = {
    ...EMPTY_COMPANY,
    razonSocial: companyName,
    ruc: ruc,
    representanteLegal: userName,
    email: email,
    rnpVigente: true,
  };

  return {
    offers: [],
    obras: [],
    company: baseCompany,
  };
}

/**
 * Load offers list and active offer ID for the specified user
 */
export function loadUserOffers(user: LicenseSession | null): {
  offers: UserOfferPackage[];
  activeId: string;
} {
  const key = getOffersStorageKey(user);
  const activeKey = getActiveOfferIdStorageKey(user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedActive = localStorage.getItem(activeKey);
        const validActive = parsed.some((o) => o.id === savedActive)
          ? savedActive!
          : parsed[0].id;
        return { offers: parsed, activeId: validActive };
      }
    }
  } catch (e) {
    console.warn("Error loading user offers:", e);
  }

  // If nothing saved, initialize starter workspace for this user
  const initialData = createInitialUserWorkspace(user);
  const initialOffers = initialData.offers;
  const initialActive = initialOffers[0]?.id || "";

  // Persist the initialized workspace
  try {
    localStorage.setItem(key, JSON.stringify(initialOffers));
    localStorage.setItem(activeKey, initialActive);
  } catch (e) {
    // ignore
  }

  return { offers: initialOffers, activeId: initialActive };
}

/**
 * Save user offers list and active ID
 */
export function saveUserOffers(
  user: LicenseSession | null,
  offers: UserOfferPackage[],
  activeId: string
): void {
  const key = getOffersStorageKey(user);
  const activeKey = getActiveOfferIdStorageKey(user);

  try {
    localStorage.setItem(key, JSON.stringify(offers));
    localStorage.setItem(activeKey, activeId);
    broadcastEntitySync("offers", { count: offers.length, activeId });
  } catch (e) {
    console.warn("Error saving user offers:", e);
  }
}

/**
 * Load obras list and active obra ID for the specified user
 */
export function loadUserObras(user: LicenseSession | null): {
  obras: UserObraPackage[];
  activeId: string;
} {
  const key = getObrasStorageKey(user);
  const activeKey = getActiveObraIdStorageKey(user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedActive = localStorage.getItem(activeKey);
        const validActive = parsed.some((o) => o.id === savedActive)
          ? savedActive!
          : parsed[0].id;
        return { obras: parsed, activeId: validActive };
      }
    }
  } catch (e) {
    console.warn("Error loading user obras:", e);
  }

  // If nothing saved, initialize starter workspace for this user
  const initialData = createInitialUserWorkspace(user);
  const initialObras = initialData.obras;
  const initialActive = initialObras[0]?.id || "";

  try {
    localStorage.setItem(key, JSON.stringify(initialObras));
    localStorage.setItem(activeKey, initialActive);
  } catch (e) {
    // ignore
  }

  return { obras: initialObras, activeId: initialActive };
}

/**
 * Save user obras list and active ID with author metadata
 */
export function saveUserObras(
  user: LicenseSession | null,
  obras: UserObraPackage[],
  activeId: string
): void {
  const key = getObrasStorageKey(user);
  const activeKey = getActiveObraIdStorageKey(user);

  try {
    const serialized = JSON.stringify(obras);
    const existing = localStorage.getItem(key);
    const existingActive = localStorage.getItem(activeKey);

    if (existing !== serialized || existingActive !== activeId) {
      localStorage.setItem(key, serialized);
      localStorage.setItem(activeKey, activeId);
    }
  } catch (e) {
    console.warn("Error saving user obras:", e);
  }
}

/**
 * Load company profile for the specified user
 */
export function loadUserCompany(user: LicenseSession | null): CompanyProfile {
  const key = getCompanyStorageKey(user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error loading user company:", e);
  }

  // If nothing saved, create from user session
  const initialData = createInitialUserWorkspace(user);
  try {
    localStorage.setItem(key, JSON.stringify(initialData.company));
  } catch (e) {
    // ignore
  }

  return initialData.company;
}

/**
 * Save company profile for the specified user
 */
export function saveUserCompany(
  user: LicenseSession | null,
  company: CompanyProfile
): void {
  const key = getCompanyStorageKey(user);

  try {
    localStorage.setItem(key, JSON.stringify(company));
  } catch (e) {
    console.warn("Error saving user company:", e);
  }
}

/**
 * Clear all project data for a specific user
 */
export function clearUserWorkspace(user: LicenseSession | null): void {
  try {
    localStorage.removeItem(getOffersStorageKey(user));
    localStorage.removeItem(getActiveOfferIdStorageKey(user));
    localStorage.removeItem(getObrasStorageKey(user));
    localStorage.removeItem(getActiveObraIdStorageKey(user));
    localStorage.removeItem(getCompanyStorageKey(user));
  } catch (e) {
    console.warn("Error clearing user storage:", e);
  }
}
