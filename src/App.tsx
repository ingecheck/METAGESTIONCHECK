/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Sidebar } from "./components/Sidebar";
import { TenderAnalyzer } from "./components/TenderAnalyzer";
import { OfferBuilder } from "./components/OfferBuilder";
import { PersonnelManager } from "./components/PersonnelManager";
import { ExperienceCalculator } from "./components/ExperienceCalculator";
import { ObservationsManager } from "./components/ObservationsManager";
import { CompanyProfileEditor } from "./components/CompanyProfileEditor";
import { AuditReportModal } from "./components/AuditReportModal";
import { ThemeSelectorModal, ThemeOption, THEMES } from "./components/ThemeSelectorModal";
import { DashboardOverview } from "./components/DashboardOverview";
import { AdminPanel } from "./components/AdminPanel";
import { LoginModal } from "./components/LoginModal";
import { WorksDashboard } from "./components/works/WorksDashboard";
import { WorksCommencementProcedure } from "./components/works/WorksCommencementProcedure";
import { WorksValuations } from "./components/works/WorksValuations";
import { WorksModificationsManager } from "./components/works/WorksModificationsManager";
import { WorksSettlementManager } from "./components/works/WorksSettlementManager";
import { WorksBimViewer } from "./components/works/WorksBimViewer";
import { WorksPortfolioTracker } from "./components/works/WorksPortfolioTracker";

import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
  UserOfferPackage,
} from "./types/osce";
import {
  ObraProyecto,
  ValorizacionMensual,
  AsientoCuadernoObra,
  ModificacionObra,
  LiquidacionResumen,
  UserObraPackage,
  PartidaEjecutada,
  AuditoriaValorizacion,
} from "./types/obras";
import {
  LicenseSession,
  INITIAL_DEFAULT_SESSIONS,
  ADMIN_MASTER_EMAIL,
  mergeLicenseSessionWithExisting,
} from "./types/auth";
import {
  EMPTY_TENDER,
  EMPTY_COMPANY,
} from "./data/sampleTenders";
import {
  EMPTY_OBRA,
  EMPTY_LIQUIDACION,
} from "./data/sampleObras";
import { INITIAL_AUDITORIAS_OBRA } from "./data/sampleIncongruencias";
import { WorksItemsExecutedTable } from "./components/works/WorksItemsExecutedTable";
import { WorksValuationAuditor } from "./components/works/WorksValuationAuditor";
import { ContractDocumentUploader } from "./components/works/ContractDocumentUploader";
import { EntityValuationReportsManager } from "./components/works/EntityValuationReportsManager";
import {
  generateAnexo1Docx,
  generateAnexo2Docx,
  generateAnexo3Docx,
  generateAnexo4Docx,
  generateAnexo5PromesaConsorcioDocx,
  generateAnexo6EconomicoDocx,
  generateAnexo8ExperienciaDocx,
  generatePersonalYEquipamientoDocx,
  generateConsultasObservacionesDocx,
} from "./services/docxGenerator";
import { auth, isUserAdmin } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  subscribeToFirebaseLicenses,
  createFirebaseUserLicense,
  updateFirebaseUserLicense,
  fetchFirebaseLicenses,
  isLicenseDeleted,
  markLicenseAsDeleted,
  unmarkLicenseAsDeleted,
} from "./services/firebaseSync";
import {
  loadUserOffers,
  saveUserOffers,
  loadUserObras,
  saveUserObras,
  loadUserCompany,
  saveUserCompany,
  clearUserWorkspace,
} from "./services/userStorage";
import { TeamManagementModal } from "./components/team/TeamManagementModal";

const SESSIONS_STORAGE_KEY = "osce_license_sessions_free_v1";
const ACTIVE_USER_STORAGE_KEY = "osce_current_user_free_v1";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("seguimiento-cartera");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // License Sessions & Authentication State - 100% Local & Free
  const [sessions, setSessions] = useState<LicenseSession[]>(() => {
    const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const map = new Map<string, LicenseSession>();
    
    INITIAL_DEFAULT_SESSIONS.forEach((s) => {
      if (!isLicenseDeleted(s)) {
        map.set(s.licenseKey.toUpperCase(), s);
      }
    });

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((s: LicenseSession) => {
            if (!isLicenseDeleted(s)) {
              // Ensure default members (e.g. for Rioja) are merged into cached sessions
              const defaultMatch = INITIAL_DEFAULT_SESSIONS.find(
                (d) => d.licenseKey.toUpperCase() === s.licenseKey.toUpperCase()
              );
              if (defaultMatch && defaultMatch.teamMembers) {
                const existingMemberIds = new Set((s.teamMembers || []).map((m) => m.id));
                const mergedTeamMembers = [...(s.teamMembers || [])];
                defaultMatch.teamMembers.forEach((dm) => {
                  if (!existingMemberIds.has(dm.id)) {
                    mergedTeamMembers.push(dm);
                  }
                });
                s.teamMembers = mergedTeamMembers;
              }
              map.set(s.licenseKey.toUpperCase(), s);
            }
          });
        }
      } catch (e) {
        // fallback
      }
    }
    return Array.from(map.values());
  });

  const [currentUser, setCurrentUser] = useState<LicenseSession | null>(() => {
    const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          (parsed.licenseKey || parsed.id || parsed.userEmail) &&
          parsed.status !== "suspended" &&
          parsed.status !== "expired"
        ) {
          // Ensure team members from latest default sessions are merged
          const defaultMatch = INITIAL_DEFAULT_SESSIONS.find(
            (d) =>
              (d.licenseKey && parsed.licenseKey && d.licenseKey.toUpperCase() === parsed.licenseKey.toUpperCase()) ||
              (d.userEmail && parsed.userEmail && d.userEmail.toLowerCase() === parsed.userEmail.toLowerCase())
          );
          if (defaultMatch && defaultMatch.teamMembers) {
            const existingMemberIds = new Set((parsed.teamMembers || []).map((m: any) => m.id));
            const merged = [...(parsed.teamMembers || [])];
            defaultMatch.teamMembers.forEach((dm) => {
              if (!existingMemberIds.has(dm.id)) {
                merged.push(dm);
              }
            });
            parsed.teamMembers = merged;
          }
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return null; // Requires login directly - No guest default
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // =========================================================================
  // APARTADO 1: OFERTAS Y CONVOCATORIAS MULTI-EXPEDIENTE STATE (USER-ISOLATED)
  // =========================================================================
  const [offersList, setOffersList] = useState<UserOfferPackage[]>(() => {
    return loadUserOffers(currentUser).offers;
  });

  const [activeOfferId, setActiveOfferId] = useState<string>(() => {
    return loadUserOffers(currentUser).activeId;
  });

  // Current active offer derived objects
  const activeOffer = offersList.find((o) => o.id === activeOfferId) || offersList[0];

  const [tender, setTender] = useState<TenderInfo>(() => activeOffer?.tender || EMPTY_TENDER);
  const [company, setCompany] = useState<CompanyProfile>(() => loadUserCompany(currentUser));
  const [personal, setPersonal] = useState<KeyPersonnel[]>(() => activeOffer?.personal || []);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => activeOffer?.equipment || []);
  const [experience, setExperience] = useState<ExperienceRecord[]>(() => activeOffer?.experience || []);
  const [observations, setObservations] = useState<ObservationItem[]>(() => activeOffer?.observations || []);
  const [montoOfertado, setMontoOfertado] = useState<number>(() => activeOffer?.montoOfertado || 0);
  const [incluyeIGV, setIncluyeIGV] = useState<boolean>(() => activeOffer?.incluyeIGV ?? true);

  // Save offers list to user-isolated localStorage
  useEffect(() => {
    if (currentUser) {
      saveUserOffers(currentUser, offersList, activeOfferId);
    }
  }, [offersList, activeOfferId, currentUser]);

  // Save company profile to user-isolated localStorage
  useEffect(() => {
    if (currentUser) {
      saveUserCompany(currentUser, company);
    }
  }, [company, currentUser]);

  // Sync active offer changes into offersList
  useEffect(() => {
    if (!activeOfferId) return;
    setOffersList((prev) =>
      prev.map((off) => {
        if (off.id === activeOfferId) {
          return {
            ...off,
            nomenclatura: tender.nomenclatura || off.nomenclatura,
            nombreProyecto: tender.nombreProyectoInversion || off.nombreProyecto,
            entidad: tender.entidadConvocante || off.entidad,
            cui: tender.codigoInversionCUI || off.cui,
            objetoContratacion: tender.objetoContratacion || off.objetoContratacion,
            valorEstimadoReferencial: tender.valorEstimadoReferencial || off.valorEstimadoReferencial,
            valorNumerico: tender.valorNumerico || off.valorNumerico,
            plazoEjecucion: tender.plazoEjecucion || off.plazoEjecucion,
            updatedAt: new Date().toISOString().split("T")[0],
            tender,
            personal,
            equipment,
            experience,
            observations,
            montoOfertado,
            incluyeIGV,
          };
        }
        return off;
      })
    );
  }, [tender, personal, equipment, experience, observations, montoOfertado, incluyeIGV, activeOfferId]);

  // Handlers for Offers selection & management
  const handleSelectOffer = (offerId: string) => {
    const target = offersList.find((o) => o.id === offerId);
    if (!target) return;

    setActiveOfferId(offerId);
    setTender(target.tender || EMPTY_TENDER);
    setPersonal(target.personal || []);
    setEquipment(target.equipment || []);
    setExperience(target.experience || []);
    setObservations(target.observations || []);
    setMontoOfertado(target.montoOfertado || target.valorNumerico || 0);
    setIncluyeIGV(target.incluyeIGV ?? true);
  };

  const handleSaveOffer = (offerPkg: UserOfferPackage) => {
    setOffersList((prev) => {
      const exists = prev.some((o) => o.id === offerPkg.id);
      if (exists) {
        return prev.map((o) => (o.id === offerPkg.id ? offerPkg : o));
      } else {
        return [offerPkg, ...prev];
      }
    });

    // If it's the active one or newly created, make it active
    setActiveOfferId(offerPkg.id);
    setTender(offerPkg.tender);
    setPersonal(offerPkg.personal || []);
    setEquipment(offerPkg.equipment || []);
    setExperience(offerPkg.experience || []);
    setObservations(offerPkg.observations || []);
    setMontoOfertado(offerPkg.montoOfertado || offerPkg.valorNumerico || 0);
    setIncluyeIGV(offerPkg.incluyeIGV ?? true);
  };

  const handleDeleteOffer = (offerId: string) => {
    const remaining = offersList.filter((o) => o.id !== offerId);
    setOffersList(remaining);

    if (remaining.length === 0) {
      setActiveOfferId("");
      setTender(EMPTY_TENDER);
      setPersonal([]);
      setEquipment([]);
      setExperience([]);
      setObservations([]);
      setMontoOfertado(0);
      setIncluyeIGV(true);
    } else if (activeOfferId === offerId) {
      handleSelectOffer(remaining[0].id);
    }
  };

  const handleDuplicateOffer = (offerId: string) => {
    const source = offersList.find((o) => o.id === offerId);
    if (!source) return;

    const clonedId = `oferta-${Date.now()}`;
    const cloned: UserOfferPackage = {
      ...source,
      id: clonedId,
      nomenclatura: `${source.nomenclatura} (Copia)`,
      nombreProyecto: `${source.nombreProyecto} (Copia)`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      tender: {
        ...source.tender,
        id: `tender-${Date.now()}`,
        nomenclatura: `${source.tender.nomenclatura} (Copia)`,
        nombreProyectoInversion: `${source.tender.nombreProyectoInversion} (Copia)`,
      },
    };

    setOffersList((prev) => [cloned, ...prev]);
    handleSelectOffer(clonedId);
  };

  // =========================================================================
  // APARTADO 2: CONTROL DE OBRAS Y PROYECTOS MULTI-OBRA STATE (USER-ISOLATED)
  // =========================================================================
  const [obrasList, setObrasList] = useState<UserObraPackage[]>(() => {
    return loadUserObras(currentUser).obras;
  });

  const [activeObraId, setActiveObraId] = useState<string>(() => {
    return loadUserObras(currentUser).activeId;
  });

  const activeObraPkg = obrasList.find((o) => o.id === activeObraId) || obrasList[0];

  const [obra, setObra] = useState<ObraProyecto>(() => activeObraPkg?.obra || EMPTY_OBRA);
  const [valorizaciones, setValorizaciones] = useState<ValorizacionMensual[]>(() => activeObraPkg?.valorizaciones || []);
  const [asientos, setAsientos] = useState<AsientoCuadernoObra[]>(() => activeObraPkg?.asientos || []);
  const [modificaciones, setModificaciones] = useState<ModificacionObra[]>(() => activeObraPkg?.modificaciones || []);
  const [liquidacion, setLiquidacion] = useState<LiquidacionResumen>(() => activeObraPkg?.liquidacion || EMPTY_LIQUIDACION);
  const [partidas, setPartidas] = useState<PartidaEjecutada[]>(() => activeObraPkg?.partidas || []);
  const [auditorias, setAuditorias] = useState<AuditoriaValorizacion[]>(
    () => activeObraPkg?.auditorias || INITIAL_AUDITORIAS_OBRA
  );

  // Save obras list to user-isolated localStorage
  useEffect(() => {
    if (currentUser) {
      saveUserObras(currentUser, obrasList, activeObraId);
    }
  }, [obrasList, activeObraId, currentUser]);

  // Load and switch workspace when currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    // Load isolated offers
    const userOffers = loadUserOffers(currentUser);
    setOffersList(userOffers.offers);
    setActiveOfferId(userOffers.activeId);
    const activeOff = userOffers.offers.find((o) => o.id === userOffers.activeId) || userOffers.offers[0];
    setTender(activeOff?.tender || EMPTY_TENDER);
    setPersonal(activeOff?.personal || []);
    setEquipment(activeOff?.equipment || []);
    setExperience(activeOff?.experience || []);
    setObservations(activeOff?.observations || []);
    setMontoOfertado(activeOff?.montoOfertado || activeOff?.valorNumerico || 0);
    setIncluyeIGV(activeOff?.incluyeIGV ?? true);

    // Load isolated company profile
    const userCompany = loadUserCompany(currentUser);
    setCompany(userCompany);

    // Load isolated obras
    const userObras = loadUserObras(currentUser);
    setObrasList(userObras.obras);
    setActiveObraId(userObras.activeId);
    const activeOb = userObras.obras.find((o) => o.id === userObras.activeId) || userObras.obras[0];
    setObra(activeOb?.obra || EMPTY_OBRA);
    setValorizaciones(activeOb?.valorizaciones || []);
    setAsientos(activeOb?.asientos || []);
    setModificaciones(activeOb?.modificaciones || []);
    setLiquidacion(activeOb?.liquidacion || EMPTY_LIQUIDACION);
    setPartidas(activeOb?.partidas || []);
    setAuditorias(activeOb?.auditorias || INITIAL_AUDITORIAS_OBRA);

    // Admin security check
    if (currentUser.role !== "admin" && currentUser.userEmail !== ADMIN_MASTER_EMAIL) {
      setActiveTab((prev) => (prev === "admin-panel" ? "dashboard" : prev));
    }

    // Direct Municipalities / Entidades like Rioja to Seguimiento Cartera OEI
    if (
      currentUser.role === "entidad" ||
      currentUser.entityType === "municipalidad" ||
      currentUser.companyName?.toUpperCase().includes("RIOJA") ||
      currentUser.licenseKey?.toUpperCase().includes("RIOJA")
    ) {
      setActiveTab((prev) => {
        // If current tab is private postor tender dashboard, switch to OEI Seguimiento de Cartera
        if (prev === "dashboard" || prev === "analyzer" || prev === "builder") {
          return "seguimiento-cartera";
        }
        return prev;
      });
    }
  }, [currentUser?.id, currentUser?.activeMemberId]);

  // Real-time synchronization listener across tabs sharing the Entity database
  useEffect(() => {
    if (!currentUser) return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.includes("_obras_v1")) {
        const { obras: syncedObras, activeId } = loadUserObras(currentUser);
        setObrasList(syncedObras);
        if (activeId && activeId !== activeObraId) {
          setActiveObraId(activeId);
        }
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [currentUser?.id, currentUser?.activeMemberId, activeObraId]);

  // Sync active obra changes into obrasList
  useEffect(() => {
    if (!activeObraId) return;
    setObrasList((prev) =>
      prev.map((ob) => {
        if (ob.id === activeObraId) {
          return {
            ...ob,
            cui: obra.cui || ob.cui,
            nombre: obra.nombre || ob.nombre,
            entidad: obra.entidad || ob.entidad,
            contratista: obra.contratista || ob.contratista,
            montoContractual: obra.montoContractual || ob.montoContractual,
            estado: obra.estado || ob.estado,
            updatedAt: new Date().toISOString().split("T")[0],
            obra,
            valorizaciones,
            asientos,
            modificaciones,
            liquidacion,
            partidas,
            auditorias: auditorias,
          };
        }
        return ob;
      })
    );
  }, [obra, valorizaciones, asientos, modificaciones, liquidacion, partidas, auditorias, activeObraId]);

  // Handlers for Obra selection & management
  const handleSelectObra = (obraId: string) => {
    const target = obrasList.find((o) => o.id === obraId);
    if (!target) return;

    setActiveObraId(obraId);
    setObra(target.obra || EMPTY_OBRA);
    setValorizaciones(target.valorizaciones || []);
    setAsientos(target.asientos || []);
    setModificaciones(target.modificaciones || []);
    setLiquidacion(target.liquidacion || EMPTY_LIQUIDACION);
    setPartidas(target.partidas || []);
    setAuditorias(target.auditorias || INITIAL_AUDITORIAS_OBRA);
  };

  const handleSaveObra = (obraPkg: UserObraPackage) => {
    setObrasList((prev) => {
      const exists = prev.some((o) => o.id === obraPkg.id);
      if (exists) {
        return prev.map((o) => (o.id === obraPkg.id ? obraPkg : o));
      } else {
        return [obraPkg, ...prev];
      }
    });

    setActiveObraId(obraPkg.id);
    setObra(obraPkg.obra);
    setValorizaciones(obraPkg.valorizaciones || []);
    setAsientos(obraPkg.asientos || []);
    setModificaciones(obraPkg.modificaciones || []);
    setLiquidacion(obraPkg.liquidacion || EMPTY_LIQUIDACION);
    setPartidas(obraPkg.partidas || []);
    setAuditorias(obraPkg.auditorias || INITIAL_AUDITORIAS_OBRA);
  };

  const handleSaveObraFromAnalysis = (
    updatedData: Partial<ObraProyecto>,
    completePkg?: UserObraPackage,
    targetObraId?: string
  ) => {
    if (completePkg) {
      handleSaveObra(completePkg);
      return;
    }

    const currentPkgId = targetObraId || activeObraId || (obrasList.length > 0 ? obrasList[0].id : `obra-${Date.now()}`);
    const existingPkg = obrasList.find((o) => o.id === currentPkgId);

    const baseObra = existingPkg?.obra || obra;
    const mergedObra: ObraProyecto = {
      ...baseObra,
      ...updatedData,
      id: currentPkgId,
    };

    const pkgToSave: UserObraPackage = {
      id: currentPkgId,
      cui: mergedObra.cui || existingPkg?.cui || "2548912",
      nombre: mergedObra.nombre || existingPkg?.nombre || "PROYECTO DE OBRA EN EJECUCIÓN",
      entidad: mergedObra.entidad || existingPkg?.entidad || "ENTIDAD CONTRATANTE",
      contratista: mergedObra.contratista || existingPkg?.contratista || "CONSORCIO CONTRATISTA",
      montoContractual: mergedObra.montoContractual || existingPkg?.montoContractual || 0,
      estado: mergedObra.estado || existingPkg?.estado || "En Ejecución",
      createdAt: existingPkg?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      obra: mergedObra,
      valorizaciones: existingPkg?.valorizaciones || valorizaciones || [],
      asientos: existingPkg?.asientos || asientos || [],
      modificaciones: existingPkg?.modificaciones || modificaciones || [],
      liquidacion: existingPkg?.liquidacion || liquidacion || EMPTY_LIQUIDACION,
      partidas: existingPkg?.partidas || partidas || [],
      auditorias: existingPkg?.auditorias || auditorias || [],
    };

    handleSaveObra(pkgToSave);
  };

  const handleDeleteObra = (obraId: string) => {
    const remaining = obrasList.filter((o) => o.id !== obraId);
    setObrasList(remaining);

    if (remaining.length === 0) {
      setActiveObraId("");
      setObra(EMPTY_OBRA);
      setValorizaciones([]);
      setAsientos([]);
      setModificaciones([]);
      setLiquidacion(EMPTY_LIQUIDACION);
      setPartidas([]);
      setAuditorias([]);
    } else if (activeObraId === obraId) {
      handleSelectObra(remaining[0].id);
    }
  };

  const handleDuplicateObra = (obraId: string) => {
    const source = obrasList.find((o) => o.id === obraId);
    if (!source) return;

    const clonedId = `obra-${Date.now()}`;
    const cloned: UserObraPackage = {
      ...source,
      id: clonedId,
      cui: `${source.cui}-C`,
      nombre: `${source.nombre} (Copia)`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      obra: {
        ...source.obra,
        id: clonedId,
        nombre: `${source.obra.nombre} (Copia)`,
      },
    };

    setObrasList((prev) => [cloned, ...prev]);
    handleSelectObra(clonedId);
  };

  // Modals & Layout States
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>("slate");
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  const selectedThemeConfig = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  // Save sessions to localStorage immediately whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [sessions]);

  // Sync currentUser with localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // Real-time synchronization of licenses with Firebase Cloud Firestore
  useEffect(() => {
    // 1. Initial fetch & backup of any local licenses to Firestore
    fetchFirebaseLicenses()
      .then((cloudLicenses) => {
        if (cloudLicenses && cloudLicenses.length > 0) {
          setSessions((prev) => {
            const map = new Map<string, LicenseSession>();
            INITIAL_DEFAULT_SESSIONS.forEach((s) => {
              if (!isLicenseDeleted(s)) map.set(s.licenseKey.toUpperCase(), s);
            });
            prev.forEach((s) => {
              if (!isLicenseDeleted(s)) map.set(s.licenseKey.toUpperCase(), s);
            });
            cloudLicenses.forEach((s) => {
              if (!isLicenseDeleted(s)) {
                const key = s.licenseKey.toUpperCase();
                const existing = map.get(key);
                map.set(key, mergeLicenseSessionWithExisting(existing, s));
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => console.warn("Initial license fetch error:", err));

    // 2. Real-time subscription to cloud changes
    const unsubscribeLicenses = subscribeToFirebaseLicenses((cloudLicenses) => {
      if (cloudLicenses) {
        setSessions((prev) => {
          const map = new Map<string, LicenseSession>();
          INITIAL_DEFAULT_SESSIONS.forEach((s) => {
            if (!isLicenseDeleted(s)) map.set(s.licenseKey.toUpperCase(), s);
          });
          prev.forEach((s) => {
            if (!isLicenseDeleted(s)) map.set(s.licenseKey.toUpperCase(), s);
          });
          cloudLicenses.forEach((s) => {
            if (!isLicenseDeleted(s)) {
              const key = s.licenseKey.toUpperCase();
              const existing = map.get(key);
              map.set(key, mergeLicenseSessionWithExisting(existing, s));
            }
          });
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubscribeLicenses();
    };
  }, []);

  // Optional: Listen to Firebase auth if user signs in with Google, but without recurring DB listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email || "";
        const isAdmin = isUserAdmin(userEmail);

        if (isAdmin) {
          const adminSession: LicenseSession = {
            id: `admin-${firebaseUser.uid}`,
            userId: firebaseUser.uid,
            userName: firebaseUser.displayName || "Administrador Principal",
            userEmail: userEmail,
            companyName: "ORGANISMO SUPERVISOR / ADMIN MASTER",
            ruc: "20100000001",
            licenseKey: "ADMIN-OSCE-MASTER-2026",
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString().split("T")[0],
            expiresAt: "2035-12-31",
            maxTenders: 99999,
            currentTendersCount: 0,
            issuedBy: "Master Auth",
            notes: "Sesión activa como Administrador Principal.",
            firebaseSynced: true,
          };
          setCurrentUser(adminSession);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Clean data resetter
  const handleResetAllDataClean = () => {
    // Clear the current user's workspace
    clearUserWorkspace(currentUser);

    // 1. Reset Ofertador
    setOffersList([]);
    setActiveOfferId("");
    setTender(EMPTY_TENDER);
    setCompany(EMPTY_COMPANY);
    setPersonal([]);
    setEquipment([]);
    setExperience([]);
    setObservations([]);
    setMontoOfertado(0);
    setIncluyeIGV(true);

    // 2. Reset Control de Obras
    setObrasList([]);
    setActiveObraId("");
    setObra(EMPTY_OBRA);
    setValorizaciones([]);
    setAsientos([]);
    setModificaciones([]);
    setLiquidacion(EMPTY_LIQUIDACION);
    setPartidas([]);
    setAuditorias([]);

    setActiveTab("dashboard");
  };

  // Switch tender selection helper
  const handleUpdateTender = (newTender: TenderInfo) => {
    setTender(newTender);
  };

  // Auth & Session handlers
  const handleLogin = (session: LicenseSession) => {
    setCurrentUser(session);
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleAddSession = (newSession: LicenseSession) => {
    if (newSession.id) unmarkLicenseAsDeleted(newSession.id);
    if (newSession.licenseKey) unmarkLicenseAsDeleted(newSession.licenseKey);

    setSessions((prev) => {
      const existing = prev.find(
        (s) =>
          (s.id && s.id === newSession.id) ||
          (s.licenseKey && s.licenseKey.toUpperCase() === newSession.licenseKey.toUpperCase())
      );
      const merged = existing ? mergeLicenseSessionWithExisting(existing, newSession) : newSession;
      const updated = [
        merged,
        ...prev.filter(
          (s) =>
            s.id !== newSession.id &&
            s.licenseKey.toUpperCase() !== newSession.licenseKey.toUpperCase()
        ),
      ];
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (
      currentUser &&
      (currentUser.id === newSession.id ||
        currentUser.licenseKey.toUpperCase() === newSession.licenseKey.toUpperCase())
    ) {
      setCurrentUser((prev) => {
        const mergedUser = prev ? { ...prev, ...newSession } : null;
        try {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(mergedUser));
        } catch (e) {}
        return mergedUser;
      });
    }

    updateFirebaseUserLicense(newSession).catch((err) =>
      console.warn("Cloud sync error for session:", err)
    );
  };

  const handleUpdateSessionStatus = (sessionId: string, status: "active" | "suspended" | "expired") => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
    );
    if (currentUser?.id === sessionId) {
      setCurrentUser((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId || s.licenseKey === sessionId);
    if (sessionToDelete) {
      if (sessionToDelete.id) markLicenseAsDeleted(sessionToDelete.id);
      if (sessionToDelete.licenseKey) markLicenseAsDeleted(sessionToDelete.licenseKey);
    } else {
      markLicenseAsDeleted(sessionId);
    }

    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId && s.licenseKey !== sessionId);
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.id === sessionId || (sessionToDelete && currentUser?.licenseKey === sessionToDelete.licenseKey)) {
      setCurrentUser(null);
      setIsLoginModalOpen(true);
    }
  };

  const handleExtendSession = (sessionId: string, newExpiresAt: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, expiresAt: newExpiresAt, status: "active" } : s))
    );
    if (currentUser?.id === sessionId) {
      setCurrentUser((prev) => (prev ? { ...prev, expiresAt: newExpiresAt, status: "active" } : null));
    }
  };

  const handleRequestLicense = (req: {
    userName: string;
    userEmail: string;
    companyName: string;
    ruc: string;
    intendedUse: string;
  }) => {
    const newSession: LicenseSession = {
      id: `session-${Date.now()}`,
      userId: `user-${Date.now()}`,
      userName: req.userName,
      userEmail: req.userEmail,
      companyName: req.companyName,
      ruc: req.ruc,
      licenseKey: `OSCE-FREE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`,
      role: "postor",
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      expiresAt: "2027-12-31",
      maxTenders: 100,
      currentTendersCount: 1,
      issuedBy: "Auto-Aprobación Gratuita",
      notes: `Uso solicitado: ${req.intendedUse}`,
      firebaseSynced: false,
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentUser(newSession);
    setIsLoginModalOpen(false);
  };

  const handleImportSessions = (imported: LicenseSession[]) => {
    setSessions(imported);
    if (imported.length > 0) {
      setCurrentUser(imported[0]);
    }
  };

  // ZIP Download Generator
  const handleDownloadAllZip = async () => {
    try {
      setIsDownloadingZip(true);
      const zip = new JSZip();
      const folderName = `Expediente_${tender.nomenclatura.replace(/[^a-zA-Z0-9_-]/g, "_") || "Oferta_OSCE"}`;
      const ofertaFolder = zip.folder(folderName) || zip;

      // 1. Anexo 1
      const blob1 = await generateAnexo1Docx(tender, company);
      ofertaFolder.file(`01_Anexo_1_Declaracion_Jurada_Datos_Postor.docx`, blob1);

      // 2. Anexo 2
      const blob2 = await generateAnexo2Docx(tender, company);
      ofertaFolder.file(`02_Anexo_2_Declaracion_Cumplimiento_TDR.docx`, blob2);

      // 3. Anexo 3
      const blob3 = await generateAnexo3Docx(tender, company);
      ofertaFolder.file(`03_Anexo_3_Declaracion_Plazo_Entrega.docx`, blob3);

      // 4. Anexo 4
      const blob4 = await generateAnexo4Docx(tender, company);
      ofertaFolder.file(`04_Anexo_4_Declaracion_Jurada_Art_52_e_Integridad.docx`, blob4);

      // 5. Anexo 5 (Promesa de Consorcio si aplica)
      if (company.esConsorcio) {
        const blob5 = await generateAnexo5PromesaConsorcioDocx(tender, company);
        ofertaFolder.file(`05_Anexo_5_Promesa_Formal_de_Consorcio.docx`, blob5);
      }

      // 5/6. Anexo 6 (Económica)
      const blob6 = await generateAnexo6EconomicoDocx(tender, company, montoOfertado, incluyeIGV);
      ofertaFolder.file(`06_Anexo_6_Oferta_Economica.docx`, blob6);

      // 6. Anexo 8 (Experiencia)
      const blob8 = await generateAnexo8ExperienciaDocx(tender, company, experience);
      ofertaFolder.file(`07_Anexo_8_Experiencia_del_Postor.docx`, blob8);

      // 7. Personal y Equipamiento
      const blobPers = await generatePersonalYEquipamientoDocx(tender, company, personal, equipment);
      ofertaFolder.file(`08_Carta_Acreditacion_Personal_y_Equipos.docx`, blobPers);

      // 8. Consultas y Observaciones
      const blobObs = await generateConsultasObservacionesDocx(tender, company, observations);
      ofertaFolder.file(`09_Pliego_Consultas_y_Observaciones.docx`, blobObs);

      // Generate and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
    } catch (err) {
      console.error("Error generating ZIP:", err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className={`min-h-screen ${selectedThemeConfig.bodyClass} flex font-sans transition-colors duration-200`}>
      {/* Permanent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tender={tender}
        company={company}
        obra={obra}
        currentUser={currentUser}
        onOpenAudit={() => setIsAuditOpen(true)}
        onDownloadAllZip={handleDownloadAllZip}
        isDownloadingZip={isDownloadingZip}
        onOpenThemeSelector={() => setIsThemeModalOpen(true)}
        onOpenTeamManagement={() => setIsTeamModalOpen(true)}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area without top white header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Main Content Body */}
        <main
          className={`flex-1 w-full ${
            activeTab === "seguimiento-cartera"
              ? "max-w-full px-2 sm:px-5 py-3"
              : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5"
          }`}
        >
          {/* ======================================================== */}
          {/* APARTADO 1: OFERTADOR / POSTOR (LICITACIONES SEACE)     */}
          {/* ======================================================== */}
          {activeTab === "dashboard" && (
            <DashboardOverview
              tender={tender}
              company={company}
              personal={personal}
              equipment={equipment}
              experience={experience}
              observations={observations}
              montoOfertado={montoOfertado}
              onNavigateToTab={setActiveTab}
              onOpenAudit={() => setIsAuditOpen(true)}
              onDownloadAllZip={handleDownloadAllZip}
              isDownloadingZip={isDownloadingZip}
              onSelectTender={handleUpdateTender}
              offersList={offersList}
              activeOfferId={activeOfferId}
              onSelectOffer={handleSelectOffer}
              onSaveOffer={handleSaveOffer}
              onDeleteOffer={handleDeleteOffer}
              onDuplicateOffer={handleDuplicateOffer}
            />
          )}

          {activeTab === "admin-panel" && (currentUser?.role === "admin" || currentUser?.userEmail === ADMIN_MASTER_EMAIL) && (
            <AdminPanel
              sessions={sessions}
              onAddSession={handleAddSession}
              onUpdateSessionStatus={handleUpdateSessionStatus}
              onDeleteSession={handleDeleteSession}
              onExtendSession={handleExtendSession}
              onResetAllDataClean={handleResetAllDataClean}
              onImportSessions={handleImportSessions}
              adminUser={currentUser!}
            />
          )}

          {activeTab === "analyzer" && (
            <TenderAnalyzer
              tender={tender}
              setTender={setTender}
              onUpdateTender={setTender}
              onNavigateToBuilder={() => setActiveTab("builder")}
              onNavigateToTab={setActiveTab}
              onNext={() => setActiveTab("company")}
            />
          )}

          {activeTab === "company" && (
            <CompanyProfileEditor
              company={company}
              setCompany={setCompany}
              onNext={() => setActiveTab("experience")}
            />
          )}

          {activeTab === "experience" && (
            <ExperienceCalculator
              tender={tender}
              company={company}
              experience={experience}
              setExperience={setExperience}
              onNext={() => setActiveTab("personnel")}
            />
          )}

          {activeTab === "personnel" && (
            <PersonnelManager
              tender={tender}
              company={company}
              personal={personal}
              setPersonal={setPersonal}
              equipment={equipment}
              setEquipment={setEquipment}
              onNavigateToTab={setActiveTab}
              onNext={() => setActiveTab("observations")}
            />
          )}

          {activeTab === "observations" && (
            <ObservationsManager
              tender={tender}
              company={company}
              observations={observations}
              setObservations={setObservations}
              onNavigateToTab={setActiveTab}
              onOpenAudit={() => setIsAuditOpen(true)}
            />
          )}

          {activeTab === "legal-ai" && (
            <ObservationsManager
              tender={tender}
              company={company}
              observations={observations}
              setObservations={setObservations}
              onNavigateToTab={setActiveTab}
              onOpenAudit={() => setIsAuditOpen(true)}
            />
          )}

          {activeTab === "builder" && (
            <OfferBuilder
              tender={tender}
              company={company}
              personal={personal}
              equipment={equipment}
              experience={experience}
              observations={observations}
              montoOfertado={montoOfertado}
              setMontoOfertado={setMontoOfertado}
              incluyeIGV={incluyeIGV}
              setIncluyeIGV={setIncluyeIGV}
              onOpenAudit={() => setIsAuditOpen(true)}
            />
          )}

          {/* ======================================================== */}
          {/* APARTADO 2: CONTROL DE OBRAS Y SUPERVISIÓN (LEY N° 30225)*/}
          {/* ======================================================== */}
          {activeTab === "obras-dashboard" && (
            <WorksDashboard
              obra={obra}
              setObra={setObra}
              valorizaciones={valorizaciones}
              asientos={asientos}
              modificaciones={modificaciones}
              onNavigateSubtab={setActiveTab}
              obrasList={obrasList}
              activeObraId={activeObraId}
              onSelectObra={handleSelectObra}
              onSaveObra={handleSaveObra}
              onDeleteObra={handleDeleteObra}
              onDuplicateObra={handleDuplicateObra}
            />
          )}

          {activeTab === "obras-bim" && (
            <WorksBimViewer
              obra={obra}
              setObra={setObra}
              valorizaciones={valorizaciones}
              partidas={partidas}
              currentUser={currentUser}
            />
          )}

          {activeTab === "obras-lector" && (
            <ContractDocumentUploader
              currentObra={obra}
              obrasList={obrasList}
              activeObraId={activeObraId}
              onSelectObra={handleSelectObra}
              onSaveProject={(updatedObraData, completePkg, targetObraId) => {
                if (completePkg) {
                  handleSaveObra(completePkg);
                } else {
                  handleSaveObraFromAnalysis(updatedObraData, undefined, targetObraId);
                }
              }}
              onApplyToActiveObra={(updated, targetObraId) => {
                handleSaveObraFromAnalysis(updated, undefined, targetObraId);
              }}
              onCreateNewObra={(newPkg) => {
                handleSaveObra(newPkg);
              }}
              onNavigateToDashboard={() => setActiveTab("obras-dashboard")}
            />
          )}

          {activeTab === "obras-inicio" && (
            <WorksCommencementProcedure
              obra={obra}
              onUpdateObra={(updatedObra) => {
                setObra(updatedObra);
                // Also update in obrasList and local storage
                setObrasList((prev) =>
                  prev.map((pkg) =>
                    pkg.id === activeObraId || pkg.obra.id === updatedObra.id
                      ? {
                          ...pkg,
                          obra: updatedObra,
                          updatedAt: new Date().toISOString(),
                        }
                      : pkg
                  )
                );
              }}
              onNavigateSubtab={setActiveTab}
            />
          )}

          {activeTab === "obras-valorizaciones" && (
            <WorksValuations
              obra={obra}
              valorizaciones={valorizaciones}
              setValorizaciones={setValorizaciones}
              partidas={partidas}
              setPartidas={setPartidas}
              auditorias={auditorias}
              setAuditorias={setAuditorias}
              initialSubTab="curva-s"
            />
          )}

          {activeTab === "obras-partidas" && (
            <WorksItemsExecutedTable
              obra={obra}
              partidas={partidas}
              setPartidas={setPartidas}
              mesSeleccionado="Mes 5 - Mayo 2025"
            />
          )}

          {activeTab === "obras-auditoria" && (
            <WorksValuationAuditor
              obra={obra}
              valorizaciones={valorizaciones}
              setValorizaciones={setValorizaciones}
              partidas={partidas}
              setPartidas={setPartidas}
              auditorias={auditorias}
              onSaveAuditorias={(newAudits) => setAuditorias(newAudits)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "obras-adicionales" && (
            <WorksModificationsManager
              obra={obra}
              modificaciones={modificaciones}
              setModificaciones={setModificaciones}
            />
          )}

          {activeTab === "obras-liquidacion" && (
            <WorksSettlementManager
              obra={obra}
              liquidacion={liquidacion}
              setLiquidacion={setLiquidacion}
            />
          )}

          {/* ======================================================== */}
          {/* APARTADO 3: GESTIÓN DOCUMENTARIA & INFORMES OFICIALES (OEI / GERENCIA / RIOJA) */}
          {/* ======================================================== */}
          {(activeTab.startsWith("informes-") || activeTab === "obras-informe-entidad") && (
            <EntityValuationReportsManager
              currentObra={obra}
              valorizaciones={valorizaciones}
              initialTab={activeTab}
              onNavigateToTab={setActiveTab}
            />
          )}

          {/* ======================================================== */}
          {/* APARTADO 4: SEGUIMIENTO DE CARTERA OEI (1-CLICK PIPELINE) */}
          {/* ======================================================== */}
          {activeTab === "seguimiento-cartera" && (
            <WorksPortfolioTracker
              currentUser={currentUser}
              obrasList={obrasList}
              onSelectObra={(partialObra) =>
                setObra((prev) => ({
                  ...prev,
                  ...partialObra,
                }))
              }
              onNavigateToTab={setActiveTab}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <span className="font-semibold text-slate-300">METAGESTIONCHECK</span> • Suite Especializada de Licitaciones SEACE & Control de Obras Públicas
            </div>
            <div className="text-[11px] text-slate-500">
              Módulos 100% Independientes | Almacenamiento Local Seguro | Ley N° 30225 y Normativa OSCE
            </div>
          </div>
        </footer>

        {/* Preventative Audit Modal */}
        <AuditReportModal
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
          tender={tender}
          company={company}
          personal={personal}
          equipment={equipment}
          experience={experience}
          montoOfertado={montoOfertado}
        />

        {/* Theme Selector Modal */}
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={currentTheme}
          onSelectTheme={(t) => setCurrentTheme(t)}
        />

        {/* Login / License Authentication Modal */}
        <LoginModal
          isOpen={!currentUser || isLoginModalOpen}
          onLogin={handleLogin}
          availableSessions={sessions}
          onRequestLicense={handleRequestLicense}
          onClose={() => setIsLoginModalOpen(false)}
        />

        {/* Team Management Modal for Titular or Admin */}
        {isTeamModalOpen && currentUser && (
          <TeamManagementModal
            isOpen={isTeamModalOpen}
            onClose={() => setIsTeamModalOpen(false)}
            currentUser={currentUser}
            onUpdateSession={(updated) => {
              setSessions((prev) => {
                const updatedList = prev.map((s) =>
                  s.id === updated.id ||
                  s.licenseKey.toUpperCase() === updated.licenseKey.toUpperCase()
                    ? updated
                    : s
                );
                try {
                  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedList));
                } catch (e) {}
                return updatedList;
              });
              setCurrentUser(updated);
              try {
                localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updated));
              } catch (e) {}
              updateFirebaseUserLicense(updated).catch(() => {});
            }}
            onSwitchActiveMember={(memberId) => {
              const updatedUser: LicenseSession = {
                ...currentUser,
                activeMemberId: memberId || undefined,
              };
              setCurrentUser(updatedUser);
              setSessions((prev) => {
                const updatedList = prev.map((s) =>
                  s.id === updatedUser.id || s.licenseKey === updatedUser.licenseKey ? updatedUser : s
                );
                try {
                  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedList));
                  localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedUser));
                } catch (e) {}
                return updatedList;
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
