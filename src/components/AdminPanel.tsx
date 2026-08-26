import React, { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  Key,
  Users,
  PlusCircle,
  CheckCircle,
  Ban,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Building2,
  FileSpreadsheet,
  Search,
  Sparkles,
  Lock,
  Layers,
  Database,
  Send,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  UserCheck,
  ArrowRight,
  HardHat,
  Briefcase,
  Sliders,
  UserPlus,
} from "lucide-react";
import {
  LicenseSession,
  LicenseRequest,
  ADMIN_MASTER_EMAIL,
  EntityType,
  TeamMember,
} from "../types/auth";
import {
  createFirebaseUserLicense,
  updateFirebaseLicenseStatus,
  extendFirebaseLicense,
  deleteFirebaseUserLicense,
  subscribeToLicenseRequests,
  updateLicenseRequestStatus,
  deleteLicenseRequest,
} from "../services/firebaseSync";
import { TeamManagementModal } from "./team/TeamManagementModal";

interface AdminPanelProps {
  sessions: LicenseSession[];
  onAddSession: (newSession: LicenseSession) => void;
  onUpdateSessionStatus: (id: string, newStatus: "active" | "suspended" | "expired") => void;
  onDeleteSession: (id: string) => void;
  onExtendSession: (id: string, days: number) => void;
  onResetAllDataClean?: () => void;
  onImportSessions?: (imported: LicenseSession[]) => void;
  adminUser: LicenseSession;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  sessions,
  onAddSession,
  onUpdateSessionStatus,
  onDeleteSession,
  onExtendSession,
  onResetAllDataClean,
  onImportSessions,
  adminUser,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<"licenses" | "requests">("licenses");
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<"all" | EntityType>("all");
  const [requestsSearchTerm, setRequestsSearchTerm] = useState("");
  const [requestsFilter, setRequestsFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [issuedLicenseModal, setIssuedLicenseModal] = useState<LicenseSession | null>(null);
  const [inspectTeamLicense, setInspectTeamLicense] = useState<LicenseSession | null>(null);

  // License Requests list from cloud
  const [requestsList, setRequestsList] = useState<LicenseRequest[]>([]);
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<LicenseRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New License Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newRuc, setNewRuc] = useState("");
  const [newEntityType, setNewEntityType] = useState<EntityType>("empresa");
  const [newRole, setNewRole] = useState<"postor" | "entidad" | "consultor">("postor");
  const [newMaxTenders, setNewMaxTenders] = useState(50);
  const [newMaxTeamMembers, setNewMaxTeamMembers] = useState(10);
  const [newExpiryDays, setNewExpiryDays] = useState(365);
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);

  // Real-time Firestore subscription for License Requests
  useEffect(() => {
    const unsubscribe = subscribeToLicenseRequests((incoming) => {
      setRequestsList(incoming);
    });
    return () => unsubscribe();
  }, []);

  const pendingRequestsCount = requestsList.filter((r) => r.status === "pending").length;

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyInviteMessage = (sess: LicenseSession) => {
    const isPublic = sess.entityType === "municipalidad" || sess.entityType === "gobierno_regional" || sess.entityType === "ministerio";
    const entityLabel = isPublic ? "Entidad Pública" : "Empresa / Contratista";

    const message = `🏛️ *METAGESTIONCHECK - CREDENCIALES OFICIALES DE ACCESO*
Hola *${sess.userName}*, se ha emitido la Licencia Institucional para la ${entityLabel} *${sess.companyName}* (RUC: ${sess.ruc}):

🔑 *Clave de Licencia Titular:* \`${sess.licenseKey}\`
👤 *Usuario Administrador:* ${sess.userEmail}
📅 *Vigencia hasta:* ${sess.expiresAt}
📑 *Cupo de Expedientes / Obras:* ${sess.maxTenders}
👥 *Cupo de Miembros de Equipo:* ${sess.maxTeamMembers || 10} colaboradores

💼 *Mesa de Trabajo Limpia:*
Como Titular de la cuenta, usted puede acceder y registrar a los miembros de su equipo de trabajo (Ingeniero Residente, Supervisor de Obra, Especialistas en Costos y Licitaciones). Cada uno tendrá su propio PIN de acceso y firma técnica para operar en la cartera institucional.

🌐 *Portal de Acceso:* ${window.location.origin}`;

    navigator.clipboard.writeText(message);
    setCopiedInvite(sess.id);
    setTimeout(() => setCopiedInvite(null), 3000);
  };

  const handleOpenApprovalForRequest = (req: LicenseRequest) => {
    setSelectedRequestForApproval(req);
    setLinkedRequestId(req.id);
    setNewUserName(req.userName);
    setNewUserEmail(req.userEmail);
    setNewCompanyName(req.companyName);
    setNewRuc(req.ruc);
    const suggestedType: EntityType = req.companyName.toLowerCase().includes("muni")
      ? "municipalidad"
      : req.companyName.toLowerCase().includes("gobierno regional") || req.companyName.toLowerCase().includes("gore")
      ? "gobierno_regional"
      : req.companyName.toLowerCase().includes("consorcio")
      ? "consorcio"
      : "empresa";
    setNewEntityType(suggestedType);
    setNewRole(suggestedType === "municipalidad" || suggestedType === "gobierno_regional" ? "entidad" : "postor");
    setNewExpiryDays(365);
    setNewMaxTenders(50);
    setNewMaxTeamMembers(10);
    setNewNotes(`Solicitud aprobada: ${req.intendedUse || "Uso general SEACE y Obras"}`);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerateKeySuggestion = () => {
    const cleanCompanyTag = (newCompanyName || "TITULAR")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8)
      .toUpperCase();
    const prefix = newEntityType === "municipalidad" ? "LIC-MUNI" : newEntityType === "gobierno_regional" ? "LIC-GORE" : "LIC-CORP";
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewCustomKey(`${prefix}-${cleanCompanyTag}-2026-${randomSuffix}`);
  };

  const handleGenerateCustomLicense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName || !newCompanyName || !newRuc) {
      alert("Por favor complete los campos obligatorios (*).");
      return;
    }

    setIsSaving(true);
    try {
      let finalKey = newCustomKey.trim().toUpperCase();
      if (!finalKey) {
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const cleanCompanyTag = newCompanyName
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 8)
          .toUpperCase();
        const prefix = newEntityType === "municipalidad" ? "LIC-MUNI" : newEntityType === "gobierno_regional" ? "LIC-GORE" : "LIC-CORP";
        finalKey = `${prefix}-${cleanCompanyTag}-2026-${randomSuffix}`;
      }

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + newExpiryDays);

      // Create starter team members with Titular
      const initialTeamMembers: TeamMember[] = [
        {
          id: `tm-${Date.now()}-1`,
          name: newUserName.trim(),
          email: (newUserEmail || `${newRuc}@titular.pe`).trim().toLowerCase(),
          role: "titular",
          cargoText: "Titular / Administrador General",
          accessPin: String(Math.floor(1000 + Math.random() * 9000)),
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
          allowedModules: ["all"],
        },
      ];

      const newSession: LicenseSession = {
        id: `lic-${Date.now()}`,
        userName: newUserName.trim(),
        userEmail: (newUserEmail || `${newRuc}@titular.pe`).trim().toLowerCase(),
        companyName: newCompanyName.trim().toUpperCase(),
        ruc: newRuc.trim(),
        licenseKey: finalKey,
        role: newRole,
        entityType: newEntityType,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
        expiresAt: expDate.toISOString().split("T")[0],
        maxTenders: newMaxTenders,
        maxTeamMembers: newMaxTeamMembers,
        teamMembers: initialTeamMembers,
        currentTendersCount: 0,
        issuedBy: adminUser.userEmail || ADMIN_MASTER_EMAIL,
        notes: newNotes,
        firebaseSynced: false,
      };

      // 1. Add to local storage & state
      onAddSession(newSession);

      // 2. Save to Firebase in Cloud Firestore
      try {
        await createFirebaseUserLicense(newSession);
        newSession.firebaseSynced = true;
      } catch (err) {
        console.log("Firebase sync fallback:", err);
      }

      // 3. If this was from a pending request, mark it as approved
      if (linkedRequestId) {
        try {
          await updateLicenseRequestStatus(linkedRequestId, "approved", {
            assignedKey: finalKey,
            processedBy: adminUser.userEmail || ADMIN_MASTER_EMAIL,
          });
        } catch (e) {
          console.warn("Could not update request status in cloud:", e);
        }
      }

      setIssuedLicenseModal(newSession);
      setSaveSuccessMsg(`¡Licencia para ${newUserName} (${newCompanyName}) generada exitosamente con cupo para ${newMaxTeamMembers} miembros!`);

      // Reset Form
      setNewUserName("");
      setNewUserEmail("");
      setNewCompanyName("");
      setNewRuc("");
      setNewCustomKey("");
      setNewNotes("");
      setLinkedRequestId(null);
      setSelectedRequestForApproval(null);
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Error creating license:", err);
      alert("Error al registrar licencia: " + (err.message || "Verifique los datos"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSessionTeam = (updatedSession: LicenseSession) => {
    // Update locally
    const updatedSessions = sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    if (onImportSessions) {
      onImportSessions(updatedSessions);
    }
    // Also save in cloud
    createFirebaseUserLicense(updatedSession).catch((e) => console.log("Firebase team sync:", e));
    setInspectTeamLicense(updatedSession);
  };

  const handleRejectRequest = async (reqId: string, name: string) => {
    if (!confirm(`¿Rechazar la solicitud de acceso de "${name}"?`)) return;
    try {
      await updateLicenseRequestStatus(reqId, "rejected", {
        processedBy: adminUser.userEmail || ADMIN_MASTER_EMAIL,
        notes: "Rechazado por el Administrador",
      });
      setSaveSuccessMsg(`Solicitud de "${name}" marcada como rechazada.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e) {
      alert("Error al actualizar la solicitud.");
    }
  };

  const handleDeleteRequest = async (reqId: string) => {
    if (!confirm("¿Eliminar este registro de solicitud?")) return;
    try {
      await deleteLicenseRequest(reqId);
    } catch (e) {
      alert("Error al eliminar la solicitud.");
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await updateFirebaseLicenseStatus(id, nextStatus);
    } catch (e) {
      // Local fallback
    }
    onUpdateSessionStatus(id, nextStatus);
  };

  const handleExtend = async (id: string, days: number) => {
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    const baseDate = new Date(sess.expiresAt || Date.now());
    baseDate.setDate(baseDate.getDate() + days);
    const newDateStr = baseDate.toISOString().split("T")[0];

    try {
      await extendFirebaseLicense(id, newDateStr);
    } catch (e) {
      // Local fallback
    }
    onExtendSession(id, days);
  };

  const handleDelete = async (sessToDelete: LicenseSession) => {
    const isMaster = sessToDelete.role === "admin" || sessToDelete.userEmail === ADMIN_MASTER_EMAIL || sessToDelete.licenseKey === "ADMIN-OSCE-MASTER-2026";
    if (isMaster) {
      alert("No es posible eliminar la Cuenta Maestra del Administrador Principal.");
      return;
    }

    const confirmText = `¿Está seguro de ELIMINAR DEFINITIVAMENTE la siguiente licencia?\n\n• Titular / Entidad: ${sessToDelete.userName} (${sessToDelete.companyName})\n• Clave: ${sessToDelete.licenseKey}\n• RUC: ${sessToDelete.ruc}\n\nEsta acción borrará la licencia del sistema y de la nube.`;
    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      setIsSaving(true);
      // Delete from cloud and register in deleted blacklist
      if (sessToDelete.id) {
        await deleteFirebaseUserLicense(sessToDelete.id);
      }
      if (sessToDelete.licenseKey && sessToDelete.licenseKey !== sessToDelete.id) {
        await deleteFirebaseUserLicense(sessToDelete.licenseKey);
      }
      // Delete locally
      onDeleteSession(sessToDelete.id);
      
      setSaveSuccessMsg(`✓ Licencia de "${sessToDelete.userName}" (${sessToDelete.companyName}) eliminada correctamente.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e) {
      console.warn("Delete license error:", e);
      onDeleteSession(sessToDelete.id);
      setSaveSuccessMsg(`✓ Licencia eliminada del registro local.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Export all sessions to a JSON file (Free local backup)
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LICENCIAS_OSCE_BACKUP_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import sessions from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          if (onImportSessions) {
            onImportSessions(importedData);
          } else {
            importedData.forEach((s) => onAddSession(s));
          }
          setSaveSuccessMsg(`¡Se importaron ${importedData.length} licencias correctamente!`);
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        } else {
          alert("El archivo no tiene el formato de licencias correcto.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const filteredSessions = sessions.filter((s) => {
    if (entityFilter !== "all") {
      const matchEntity = s.entityType === entityFilter;
      if (!matchEntity) return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.userName.toLowerCase().includes(term) ||
      s.companyName.toLowerCase().includes(term) ||
      s.ruc.includes(term) ||
      s.licenseKey.toLowerCase().includes(term) ||
      s.userEmail.toLowerCase().includes(term)
    );
  });

  const filteredRequests = requestsList.filter((r) => {
    if (requestsFilter !== "all" && r.status !== requestsFilter) return false;
    if (!requestsSearchTerm.trim()) return true;
    const term = requestsSearchTerm.toLowerCase();
    return (
      r.userName.toLowerCase().includes(term) ||
      r.companyName.toLowerCase().includes(term) ||
      r.ruc.includes(term) ||
      r.userEmail.toLowerCase().includes(term)
    );
  });

  const activeCount = sessions.filter((s) => s.status === "active").length;
  const suspendedCount = sessions.filter((s) => s.status === "suspended").length;

  return (
    <div className="space-y-6">
      {/* 1. Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              PANEL DE CONTROL DEL ADMINISTRADOR
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sincronización en la Nube (Firestore)
            </span>
          </div>
          <h1 className="text-xl font-bold mt-2">
            Administración de Solicitudes y Licencias de Postores
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Como Administrador ({ADMIN_MASTER_EMAIL}), usted revisa las solicitudes de acceso recibidas, emite claves oficiales y supervisa la vigencia de los postores.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* Export / Backup button */}
          <button
            onClick={handleExportBackup}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            title="Descargar copia de respaldo de todas las licencias"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Respaldar (.json)</span>
          </button>

          {/* Import Backup button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            title="Importar copia de respaldo de licencias"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restaurar</span>
          </button>

          {onResetAllDataClean && (
            <button
              onClick={() => {
                if (confirm("¿Deseas reiniciar los formularios y procedimientos activos a un estado completamente limpio?")) {
                  onResetAllDataClean();
                }
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Limpiar formularios y procedimientos activos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Datos</span>
            </button>
          )}

          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (!showCreateForm) {
                setLinkedRequestId(null);
                setSelectedRequestForApproval(null);
                setNewUserName("");
                setNewUserEmail("");
                setNewCompanyName("");
                setNewRuc("");
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showCreateForm ? "Cerrar Formulario" : "Emitir Nueva Licencia"}</span>
          </button>
        </div>
      </div>

      {/* Cloud Quota & Persistence Health Status */}
      <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Database className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sky-900 dark:text-sky-200">
              Estado de la Base de Datos Cloud Firestore (Capa Gratuita &quot;Spark&quot;)
            </p>
            <p className="text-sky-700 dark:text-sky-400 mt-0.5">
              El sistema opera con redundancia dual: persistencia local inmediata en el navegador + réplica en la nube. Las cuotas de escritura se reinician cada día a las 00:00 UTC.
            </p>
          </div>
        </div>
        <a
          href="https://console.firebase.google.com/project/inspired-task-c07pf/firestore/databases/ai-studio-armadordeofertas-2f311217-dfdc-450b-967e-f91b81568713/data?openUpgradeDialog=true"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
        >
          <span>Abrir Consola Firebase</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveAdminTab("requests")}
          className={`bg-white p-5 rounded-xl border transition cursor-pointer ${
            activeAdminTab === "requests"
              ? "border-amber-400 ring-2 ring-amber-100 shadow-sm"
              : "border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Solicitudes Pendientes de Acceso</span>
            <Inbox className={`w-4 h-4 ${pendingRequestsCount > 0 ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span>{pendingRequestsCount}</span>
            {pendingRequestsCount > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Requieren Aprobación
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Enviadas desde la pantalla de ingreso</div>
        </div>

        <div
          onClick={() => setActiveAdminTab("licenses")}
          className={`bg-white p-5 rounded-xl border transition cursor-pointer ${
            activeAdminTab === "licenses"
              ? "border-blue-400 ring-2 ring-blue-100 shadow-sm"
              : "border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Licencias Activas (Habilitadas)</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Acceso autorizado al armador</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Licencias Bloqueadas / Suspendidas</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{suspendedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sin acceso a generación de Word</div>
        </div>
      </div>

      {/* 3. New User / License Registration Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <Key className="w-4 h-4" />
              <span>
                {selectedRequestForApproval
                  ? `Aprobando Solicitud de: ${selectedRequestForApproval.userName}`
                  : "Emitir Nueva Licencia Institucional (Titular & Equipo)"}
              </span>
            </div>
            {selectedRequestForApproval && (
              <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                Vinculada a Solicitud de Acceso
              </span>
            )}
          </div>

          <form onSubmit={handleGenerateCustomLicense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Entidad / Titular *
                </label>
                <select
                  value={newEntityType}
                  onChange={(e) => {
                    const type = e.target.value as EntityType;
                    setNewEntityType(type);
                    setNewRole(
                      type === "municipalidad" || type === "gobierno_regional" || type === "ministerio"
                        ? "entidad"
                        : "postor"
                    );
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="municipalidad">🏛️ Municipalidad Provincial / Distrital</option>
                  <option value="gobierno_regional">🏢 Gobierno Regional (GORE)</option>
                  <option value="ministerio">🏛️ Ministerio / Organismo Nacional</option>
                  <option value="empresa">🏢 Empresa Constructora / Contratista</option>
                  <option value="consorcio">🤝 Consorcio Ejecutor</option>
                  <option value="consultor_supervisor">📐 Consultoría & Supervisión de Obras</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Titular / Responsable Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ing. Carlos Mendoza Ramos"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico del Titular *
                </label>
                <input
                  type="email"
                  required
                  placeholder="titular@constructora.pe"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razón Social de la Entidad o Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MUNICIPALIDAD PROVINCIAL DE CUSCO"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RUC Institucional (11 Dígitos) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="20601234567"
                  value={newRuc}
                  onChange={(e) => setNewRuc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cupo de Miembros de Equipo (Colaboradores)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newMaxTeamMembers}
                  onChange={(e) => setNewMaxTeamMembers(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vigencia de la Licencia
                </label>
                <select
                  value={newExpiryDays}
                  onChange={(e) => setNewExpiryDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value={30}>30 Días (1 Mes - Prueba)</option>
                  <option value={90}>90 Días (Trimestral)</option>
                  <option value={180}>180 Días (Semestral)</option>
                  <option value={365}>365 Días (1 Año Institucional)</option>
                  <option value={1825}>5 Años (Licencia Multianual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Límite de Obras / Expedientes SEACE
                </label>
                <input
                  type="number"
                  value={newMaxTenders}
                  onChange={(e) => setNewMaxTenders(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Clave de Licencia (Personalizada o Auto)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateKeySuggestion}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                  >
                    Generar Clave
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Dejar vacío para autogenerar o click en 'Generar'"
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notas Administrativas / Observaciones
              </label>
              <input
                type="text"
                placeholder="Ej: Licencia institucional para Gerencia de Obras e Infraestructura"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedRequestForApproval(null);
                  setLinkedRequestId(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando y Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>
                      {selectedRequestForApproval
                        ? "Aprobar y Emitir Clave Institucional"
                        : "Generar y Activar Licencia"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveAdminTab("licenses")}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeAdminTab === "licenses"
              ? "border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Licencias y Titulares ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("requests")}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeAdminTab === "requests"
              ? "border-amber-600 text-amber-700 font-bold bg-amber-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Solicitudes de Acceso</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.2 rounded-full">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 2: LICENCIAS EMITIDAS */}
      {activeAdminTab === "licenses" && (
        <div className="bg-white rounded-b-2xl rounded-t-none border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Titulares, Municipalidades y Empresas Registradas</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {filteredSessions.length} cuentas
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada titular administra su propia cartera de obras y su equipo de trabajo con permisos y firmas independientes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Filter by Entity Type */}
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">Todas las Entidades</option>
                <option value="municipalidad">🏛️ Municipalidades</option>
                <option value="gobierno_regional">🏢 Gobiernos Regionales</option>
                <option value="empresa">🏢 Empresas Contratistas</option>
                <option value="consorcio">🤝 Consorcios</option>
                <option value="consultor_supervisor">📐 Consultorías / Supervisión</option>
              </select>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por RUC, titular o clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Titular / Entidad</th>
                  <th className="py-3 px-4">Clave de Licencia</th>
                  <th className="py-3 px-4">Equipo de Trabajo</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones de Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((sess) => {
                  const isMasterAdmin = sess.role === "admin" || sess.userEmail === ADMIN_MASTER_EMAIL;
                  const teamCount = sess.teamMembers?.length || 0;
                  const maxTeam = sess.maxTeamMembers || 10;
                  const isPublic = sess.entityType === "municipalidad" || sess.entityType === "gobierno_regional" || sess.entityType === "ministerio";

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{sess.companyName}</span>
                              {sess.entityType === "municipalidad" && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                  🏛️ MUNICIPALIDAD
                                </span>
                              )}
                              {sess.entityType === "gobierno_regional" && (
                                <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                  🏢 GORE
                                </span>
                              )}
                              {sess.entityType === "empresa" && (
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                                  🏢 EMPRESA
                                </span>
                              )}
                              {sess.entityType === "consorcio" && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                  🤝 CONSORCIO
                                </span>
                              )}
                              {isMasterAdmin && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  ADMIN MASTER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              Titular: {sess.userName} • <span className="font-mono text-slate-500">RUC: {sess.ruc}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{sess.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded border border-slate-200 select-all">
                            {sess.licenseKey}
                          </span>
                          <button
                            onClick={() => handleCopyKey(sess.licenseKey)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                            title="Copiar clave"
                          >
                            {copiedKey === sess.licenseKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyInviteMessage(sess)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                            title="Copiar credenciales completas para WhatsApp"
                          >
                            {copiedInvite === sess.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setInspectTeamLicense(sess)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Ver y administrar colaboradores de este titular"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{teamCount} / {maxTeam} Colaboradores</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{sess.expiresAt}</div>
                        <div className="text-[10px] text-slate-400">Creada: {sess.createdAt}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {sess.status === "active" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Activa
                          </span>
                        )}
                        {sess.status === "suspended" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Ban className="w-3 h-3 mr-1" /> Suspendida
                          </span>
                        )}
                        {sess.status === "expired" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Expirada
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isMasterAdmin ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            {sess.status === "active" ? (
                              <button
                                onClick={() => handleStatusToggle(sess.id, sess.status)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                title="Suspender acceso temporalmente"
                              >
                                Suspender
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusToggle(sess.id, sess.status)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                title="Reactivar licencia"
                              >
                                Reactivar
                              </button>
                            )}

                            <button
                              onClick={() => handleExtend(sess.id, 90)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-medium transition cursor-pointer"
                              title="+90 Días de prórroga"
                            >
                              +90d
                            </button>

                            <button
                              onClick={() => handleDelete(sess)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Eliminar licencia definitivamente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Cuenta Maestra Protegida
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Issued License Success Modal */}
      {issuedLicenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-emerald-700 font-bold text-base">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2>¡Licencia Emitida y Habilitada!</h2>
                <p className="text-xs text-slate-500 font-normal">
                  La clave ha sido activada en la nube y está lista para ser usada.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Titular:</span>
                <span className="font-bold text-slate-900">{issuedLicenseModal.userName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Empresa:</span>
                <span className="font-bold text-slate-900">{issuedLicenseModal.companyName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Correo:</span>
                <span className="text-slate-800">{issuedLicenseModal.userEmail}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Vigencia:</span>
                <span className="font-semibold text-emerald-700">Hasta {issuedLicenseModal.expiresAt}</span>
              </div>
              <div className="pt-2">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clave de Licencia (Key):
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-sm font-bold bg-white p-2.5 rounded-lg border border-blue-300 text-blue-800 select-all">
                    {issuedLicenseModal.licenseKey}
                  </span>
                  <button
                    onClick={() => handleCopyKey(issuedLicenseModal.licenseKey)}
                    className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === issuedLicenseModal.licenseKey ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>Copiar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => handleCopyInviteMessage(issuedLicenseModal)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Copiar Mensaje para WhatsApp</span>
              </button>
              <button
                onClick={() => setIssuedLicenseModal(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. Team Management Inspector Modal for Admin */}
      {inspectTeamLicense && (
        <TeamManagementModal
          session={inspectTeamLicense}
          onClose={() => setInspectTeamLicense(null)}
          onUpdateSession={(updatedSession) => {
            onAddSession(updatedSession);
            setInspectTeamLicense(updatedSession);
          }}
        />
      )}
    </div>
  );
};
