import { UserOfferPackage, CompanyProfile, TenderInfo, KeyPersonnel, EquipmentItem, ExperienceRecord } from "../types/osce";
import { UserObraPackage, ObraProyecto, ValorizacionMensual } from "../types/obras";
import { LicenseSession } from "../types/auth";
import { EMPTY_COMPANY, EMPTY_TENDER } from "../data/sampleTenders";
import { EMPTY_OBRA, EMPTY_LIQUIDACION } from "../data/sampleObras";
import { SAMPLE_PARTIDAS_OBRA } from "../data/samplePartidas";
import { SAMPLE_AUDITORIA_DATA } from "../data/sampleIncongruencias";

const STORAGE_PREFIX = "mgc_account_";

export function getUserStorageKey(user: LicenseSession | null): string {
  if (!user) return "guest_default";
  return user.id || user.licenseKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function getOffersStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getUserStorageKey(user)}_offers_v1`;
}

export function getActiveOfferIdStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getUserStorageKey(user)}_active_offer_id_v1`;
}

export function getObrasStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getUserStorageKey(user)}_obras_v1`;
}

export function getActiveObraIdStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getUserStorageKey(user)}_active_obra_id_v1`;
}

export function getCompanyStorageKey(user: LicenseSession | null): string {
  return `${STORAGE_PREFIX}${getUserStorageKey(user)}_company_v1`;
}

/**
 * Creates default starter data tailored to a specific user account if no stored projects exist
 */
function createInitialUserWorkspace(user: LicenseSession | null): {
  offers: UserOfferPackage[];
  obras: UserObraPackage[];
  company: CompanyProfile;
} {
  const companyName = user?.companyName || "EMPRESA CONSTRUCTORA & CONSULTORES S.A.C.";
  const ruc = user?.ruc || "20600000001";
  const userName = user?.userName || "Ingeniero Responsable";
  const email = user?.userEmail || "contacto@constructora.pe";

  const baseCompany: CompanyProfile = {
    ...EMPTY_COMPANY,
    razonSocial: companyName,
    ruc: ruc,
    representanteLegal: userName,
    email: email,
    rnpVigente: true,
    registroRNP: "Ejecutor de Obras",
    domicilioFiscal: "Av. Principal N° 450, Urb. Industrial, Lima",
    distrito: "San Isidro",
    provincia: "Lima",
    departamento: "Lima",
    cuentaCCI: "002-194-000000000000-99",
    banco: "Banco de Crédito del Perú (BCP)",
  };

  // Specific demo accounts pre-seeding
  if (user?.id === "lic-postor-andina" || user?.licenseKey === "LIC-ANDINA-2026-PRO") {
    const andinaPersonal: KeyPersonnel[] = [
      {
        id: "pers-and-1",
        nombreCompleto: "Ing. Carlos Mendoza Ramos",
        dni: "42819201",
        profesion: "Ingeniero Civil",
        cipOCol: "CIP 89412",
        cargoPostulado: "Residente de Obra",
        tiempoExperienciaMeses: 48,
        descripcionExperiencia: "Residente en obras viales y carreteras asfaltadas (más de 36 meses requeridos)",
        documentosAcreditacion: "Título Profesional, Certificado de Habilidad y 3 Contratos con Acta de Recepción",
        cumpleRequisito: true,
      },
      {
        id: "pers-and-2",
        nombreCompleto: "Ing. David Quispe Loayza",
        dni: "44901239",
        profesion: "Ingeniero Geotécnico / Civil",
        cipOCol: "CIP 102345",
        cargoPostulado: "Especialista en Suelos y Pavimentos",
        tiempoExperienciaMeses: 30,
        descripcionExperiencia: "Control de calidad de subbase, base granular y mezclas asfálticas en caliente",
        documentosAcreditacion: "Título Profesional, Certificado de Habilidad y 2 Constancias de Trabajo",
        cumpleRequisito: true,
      },
    ];

    const andinaEquipment: EquipmentItem[] = [
      {
        id: "eq-and-1",
        denominacion: "Motoniveladora 140 HP o superior",
        marcaModelo: "Caterpillar 140K",
        anioFabricacion: "2023",
        capacidad: "145 HP",
        estadoDisponibilidad: "Propio",
        sustento: "Factura N° F001-00293 y Tarjeta de Propiedad",
      },
      {
        id: "eq-and-2",
        denominacion: "Rodillo Vibratorio Autopropulsado 10-12 Tn",
        marcaModelo: "Dynapac CA250D",
        anioFabricacion: "2022",
        capacidad: "12 Toneladas",
        estadoDisponibilidad: "Propio",
        sustento: "Factura N° F003-00912 y Póliza de Importación",
      },
    ];

    const andinaExperience: ExperienceRecord[] = [
      {
        id: "exp-and-1",
        cliente: "GOBIERNO REGIONAL DE AYACUCHO",
        tipoCliente: "Público",
        objetoContrato: "Mejoramiento Carretera Huanta - San José",
        nroDocumento: "CONTRATO N° 045-2023-GRA",
        fechaEmision: "2023-04-10",
        fechaConformidad: "2024-06-30",
        moneda: "PEN",
        montoOriginal: 5200000,
        montoEnSoles: 5200000,
        tipoComprobante: "Contrato + Conformidad",
        validoOSCE: true,
        especialidad: "Viales, Puertos y Afines",
        esSimilar: true,
      },
    ];

    const andinaOffer: UserOfferPackage = {
      id: "andina-oferta-1",
      nomenclatura: "AS-SM-12-2026-MTC/20",
      nombreProyecto: "Mejoramiento de la Carretera Departamental Huancavelica - Castrovirreyna Tramo II",
      entidad: "PROVIAS DESCENTRALIZADO - MTC",
      cui: "2491023",
      objetoContratacion: "Ejecución de Obras",
      valorEstimadoReferencial: "S/ 8,450,000.00",
      valorNumerico: 8450000,
      plazoEjecucion: "240 días calendario",
      estadoOferta: "En Formulación",
      montoOfertado: 7605000,
      incluyeIGV: true,
      createdAt: "2026-02-10",
      updatedAt: "2026-08-19",
      tender: {
        ...EMPTY_TENDER,
        id: "tender-andina-1",
        nomenclatura: "AS-SM-12-2026-MTC/20",
        entidadConvocante: "PROVIAS DESCENTRALIZADO - MTC",
        nombreProyectoInversion: "Mejoramiento de la Carretera Departamental Huancavelica - Castrovirreyna Tramo II",
        codigoInversionCUI: "2491023",
        valorEstimadoReferencial: "S/ 8,450,000.00",
        valorNumerico: 8450000,
        plazoEjecucion: "240 días calendario",
        plazoDias: 240,
        departamentoEjecucion: "Huancavelica",
        provinciaEjecucion: "Castrovirreyna",
        especialidad: "Obras Viales, Puentes y Pavimentaciones",
      },
      personal: andinaPersonal,
      equipment: andinaEquipment,
      experience: andinaExperience,
      observations: [],
    };

    const andinaValorizaciones: ValorizacionMensual[] = [
      {
        id: "val-and-1",
        numero: 1,
        mesPeriodo: "Mes 1 - Marzo 2026",
        montoProgramado: 600000,
        montoEjecutado: 640000,
        porcentajeProgramadoMes: 7.89,
        porcentajeEjecutadoMes: 8.42,
        porcentajeProgramadoAcumulado: 7.89,
        porcentajeEjecutadoAcumulado: 8.42,
        montoAcumuladoProgramado: 600000,
        montoAcumuladoEjecutado: 640000,
        factorKReajuste: 1.025,
        montoReajusteK: 16000,
        amortizacionAdelantoDirecto: 64000,
        amortizacionMateriales: 0,
        retencionFondoGarantia: 0,
        montoNetoAPagar: 592000,
        estadoPago: "Aprobada y Pagada",
        fechaPresentacion: "2026-03-31",
      },
      {
        id: "val-and-2",
        numero: 2,
        mesPeriodo: "Mes 2 - Abril 2026",
        montoProgramado: 950000,
        montoEjecutado: 980000,
        porcentajeProgramadoMes: 12.49,
        porcentajeEjecutadoMes: 12.88,
        porcentajeProgramadoAcumulado: 20.38,
        porcentajeEjecutadoAcumulado: 21.3,
        montoAcumuladoProgramado: 1550000,
        montoAcumuladoEjecutado: 1620000,
        factorKReajuste: 1.028,
        montoReajusteK: 27440,
        amortizacionAdelantoDirecto: 98000,
        amortizacionMateriales: 0,
        retencionFondoGarantia: 0,
        montoNetoAPagar: 909440,
        estadoPago: "Aprobada y Pagada",
        fechaPresentacion: "2026-04-30",
      },
    ];

    const andinaObra: UserObraPackage = {
      id: "andina-obra-1",
      cui: "2491023",
      nombre: "Carretera Departamental Huancavelica - Castrovirreyna Tramo II",
      entidad: "PROVIAS DESCENTRALIZADO - MTC",
      contratista: "ANDINA INGENIEROS & CONTRATISTAS S.A.C.",
      montoContractual: 7605000,
      estado: "En Ejecución",
      createdAt: "2026-02-15",
      updatedAt: "2026-08-19",
      obra: {
        ...EMPTY_OBRA,
        id: "andina-obra-1",
        cui: "2491023",
        nombre: "Carretera Departamental Huancavelica - Castrovirreyna Tramo II",
        entidad: "PROVIAS DESCENTRALIZADO - MTC",
        contratista: "ANDINA INGENIEROS & CONTRATISTAS S.A.C.",
        rucContratista: "20549281921",
        supervisor: "CONSORCIO SUPERVISOR VIAL CASTROVIRREYNA",
        rucSupervisor: "20604819201",
        residente: "Ing. Carlos Mendoza Ramos",
        dniResidente: "42819201",
        cipResidente: "89412",
        montoContractual: 7605000,
        plazoDias: 240,
        fechaInicio: "2026-03-01",
        fechaFinProgramada: "2026-10-26",
        sistemaContratacion: "A Precios Unitarios",
        estado: "En Ejecución",
        ubicacion: "Castrovirreyna, Huancavelica",
        tipologia: "Carreteras y Vías",
      },
      valorizaciones: andinaValorizaciones,
      asientos: [],
      modificaciones: [],
      liquidacion: EMPTY_LIQUIDACION,
      partidas: SAMPLE_PARTIDAS_OBRA,
      auditorias: [SAMPLE_AUDITORIA_DATA],
    };

    return {
      offers: [andinaOffer],
      obras: [andinaObra],
      company: {
        ...baseCompany,
        razonSocial: "ANDINA INGENIEROS & CONTRATISTAS S.A.C.",
        ruc: "20549281921",
        representanteLegal: "Ing. Carlos Mendoza Ramos",
        email: "carlos@andinaingenieros.pe",
        domicilioFiscal: "Av. Manuel Olguín 335, Of. 802, Santiago de Surco, Lima",
      },
    };
  }

  if (user?.id === "lic-postor-pacifico" || user?.licenseKey === "LIC-PACIFICO-2026-STD") {
    const pacificoOffer: UserOfferPackage = {
      id: "pacifico-oferta-1",
      nomenclatura: "CP-SM-08-2026-MUNI-PIURA",
      nombreProyecto: "Creación del Sistema de Drenaje Pluvial y Defensas Ribereñas Castilla",
      entidad: "MUNICIPALIDAD PROVINCIAL DE PIURA",
      cui: "2519201",
      objetoContratacion: "Ejecución de Obras",
      valorEstimadoReferencial: "S/ 4,800,000.00",
      valorNumerico: 4800000,
      plazoEjecucion: "180 días calendario",
      estadoOferta: "En Formulación",
      montoOfertado: 4320000,
      incluyeIGV: true,
      createdAt: "2026-03-20",
      updatedAt: "2026-08-19",
      tender: {
        ...EMPTY_TENDER,
        id: "tender-pacifico-1",
        nomenclatura: "CP-SM-08-2026-MUNI-PIURA",
        entidadConvocante: "MUNICIPALIDAD PROVINCIAL DE PIURA",
        nombreProyectoInversion: "Creación del Sistema de Drenaje Pluvial y Defensas Ribereñas Castilla",
        codigoInversionCUI: "2519201",
        valorEstimadoReferencial: "S/ 4,800,000.00",
        valorNumerico: 4800000,
        plazoEjecucion: "180 días calendario",
        plazoDias: 180,
        departamentoEjecucion: "Piura",
        provinciaEjecucion: "Piura",
        distritoEjecucion: "Castilla",
        especialidad: "Saneamiento, Drenaje y Obras Hidráulicas",
      },
      personal: [],
      equipment: [],
      experience: [],
      observations: [],
    };

    const pacificoObra: UserObraPackage = {
      id: "pacifico-obra-1",
      cui: "2519201",
      nombre: "Sistema de Drenaje Pluvial Castilla",
      entidad: "MUNICIPALIDAD PROVINCIAL DE PIURA",
      contratista: "CONSORCIO PACÍFICO VIAL",
      montoContractual: 4320000,
      estado: "En Ejecución",
      createdAt: "2026-03-25",
      updatedAt: "2026-08-19",
      obra: {
        ...EMPTY_OBRA,
        id: "pacifico-obra-1",
        cui: "2519201",
        nombre: "Sistema de Drenaje Pluvial Castilla",
        entidad: "MUNICIPALIDAD PROVINCIAL DE PIURA",
        contratista: "CONSORCIO PACÍFICO VIAL",
        rucContratista: "20601839281",
        supervisor: "INGENIEROS CONSULTORES DEL NORTE S.A.C.",
        rucSupervisor: "20593819203",
        residente: "Ing. Lucía Fernández Rojas",
        dniResidente: "46920192",
        cipResidente: "94812",
        montoContractual: 4320000,
        plazoDias: 180,
        fechaInicio: "2026-04-01",
        fechaFinProgramada: "2026-09-28",
        sistemaContratacion: "A Suma Alzada",
        estado: "En Ejecución",
        ubicacion: "Distrito de Castilla, Piura",
        tipologia: "Saneamiento y Agua Potable",
      },
      valorizaciones: [],
      asientos: [],
      modificaciones: [],
      liquidacion: EMPTY_LIQUIDACION,
      partidas: SAMPLE_PARTIDAS_OBRA,
      auditorias: [SAMPLE_AUDITORIA_DATA],
    };

    return {
      offers: [pacificoOffer],
      obras: [pacificoObra],
      company: {
        ...baseCompany,
        razonSocial: "CONSORCIO PACÍFICO VIAL",
        ruc: "20601839281",
        representanteLegal: "Ing. Lucía Fernández Rojas",
        email: "lucia@pacificoconsultores.pe",
        domicilioFiscal: "Av. Grau 1250, Piura",
      },
    };
  }

  // Generic / Admin Master / Default
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
 * Save user obras list and active ID
 */
export function saveUserObras(
  user: LicenseSession | null,
  obras: UserObraPackage[],
  activeId: string
): void {
  const key = getObrasStorageKey(user);
  const activeKey = getActiveObraIdStorageKey(user);

  try {
    localStorage.setItem(key, JSON.stringify(obras));
    localStorage.setItem(activeKey, activeId);
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
