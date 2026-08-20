import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { LicenseSession, ADMIN_MASTER_EMAIL } from "../types/auth";
import {
  createFirebaseUserLicense,
  updateFirebaseLicenseStatus,
  extendFirebaseLicense,
  deleteFirebaseUserLicense,
} from "../services/firebaseSync";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New License Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newRuc, setNewRuc] = useState("");
  const [newRole, setNewRole] = useState<"postor" | "consultor">("postor");
  const [newMaxTenders, setNewMaxTenders] = useState(30);
  const [newExpiryDays, setNewExpiryDays] = useState(90);
  const [newNotes, setNewNotes] = useState("");

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyInviteMessage = (sess: LicenseSession) => {
    const message = `🏛️ *METAGESTIONCHECK - CREDENCIALES DE ACCESO*
Hola *${sess.userName}*, se ha emitido tu licencia oficial para la empresa *${sess.companyName}* (RUC: ${sess.ruc}):

🔑 *Clave de Licencia:* \`${sess.licenseKey}\`
👤 *Usuario Registrado:* ${sess.userEmail}
📅 *Vigencia hasta:* ${sess.expiresAt}
📑 *Límite de Expedientes:* ${sess.maxTenders}

Ingresa al sistema y coloca tu Clave de Licencia para comenzar a armar tus propuestas técnicas y económicas conforme a la normativa OSCE.`;

    navigator.clipboard.writeText(message);
    setCopiedInvite(sess.id);
    setTimeout(() => setCopiedInvite(null), 3000);
  };

  const handleGenerateCustomLicense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName || !newCompanyName || !newRuc) {
      alert("Por favor complete los campos obligatorios (*).");
      return;
    }

    setIsSaving(true);
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanCompanyTag = newCompanyName
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 6)
        .toUpperCase();
      const generatedKey = `LIC-${cleanCompanyTag}-2026-${randomSuffix}`;

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + newExpiryDays);

      const newSession: LicenseSession = {
        id: `lic-${Date.now()}`,
        userName: newUserName,
        userEmail: newUserEmail || `${newRuc}@licitaciones.pe`,
        companyName: newCompanyName,
        ruc: newRuc,
        licenseKey: generatedKey,
        role: newRole,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
        expiresAt: expDate.toISOString().split("T")[0],
        maxTenders: newMaxTenders,
        currentTendersCount: 0,
        issuedBy: adminUser.userEmail || ADMIN_MASTER_EMAIL,
        notes: newNotes,
        firebaseSynced: false,
      };

      // Try saving to Firebase in background without blocking
      try {
        await createFirebaseUserLicense(newSession);
        newSession.firebaseSynced = true;
      } catch (err) {
        console.log("Local mode active - session saved securely in browser storage:", err);
      }

      // Add to state & local storage
      onAddSession(newSession);

      setSaveSuccessMsg(`¡Usuario ${newUserName} registrado exitosamente! Clave generada: ${generatedKey}`);
      setTimeout(() => setSaveSuccessMsg(null), 5000);

      // Reset Form
      setNewUserName("");
      setNewUserEmail("");
      setNewCompanyName("");
      setNewRuc("");
      setNewNotes("");
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Error creating license:", err);
      alert("Error al registrar licencia: " + (err.message || "Verifique los datos"));
    } finally {
      setIsSaving(false);
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar definitivamente el usuario y licencia de "${name}"?`)) {
      return;
    }
    try {
      await deleteFirebaseUserLicense(id);
    } catch (e) {
      // Local fallback
    }
    onDeleteSession(id);
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

  const filteredSessions = sessions.filter(
    (s) =>
      s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ruc.includes(searchTerm) ||
      s.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Modo 100% Gratuito y Seguro (Costo $0.00)
            </span>
          </div>
          <h1 className="text-xl font-bold mt-2">
            Registro y Control de Licencias para Postores
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Como Administrador ({ADMIN_MASTER_EMAIL}), usted emite las claves para los postores. Todo se gestiona de forma local y segura en su navegador sin costos de servidor.
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
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showCreateForm ? "Cerrar Formulario" : "Registrar Nuevo Usuario"}</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Usuarios & Licencias Registradas</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{sessions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Almacenadas de forma segura y permanente</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
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
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm mb-4">
            <Key className="w-4 h-4" />
            <span>Registrar Nuevo Usuario y Emitir Licencia Gratuita</span>
          </div>

          <form onSubmit={handleGenerateCustomLicense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Titular / Ingeniero Responsable *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ing. Carlos Mendoza Ramos"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico del Usuario *
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@constructora.pe"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razón Social de la Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: CONSULTORES & CONTRATISTAS DEL PERÚ S.A.C."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RUC de la Empresa (11 Dígitos) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="20601234567"
                  value={newRuc}
                  onChange={(e) => setNewRuc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
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
                  <option value={365}>365 Días (1 Año Corporativo)</option>
                  <option value={1825}>5 Años (Licencia Ilimitada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Límite de Expedientes / Licitaciones
                </label>
                <input
                  type="number"
                  value={newMaxTenders}
                  onChange={(e) => setNewMaxTenders(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notas Administrativas / Observaciones
              </label>
              <input
                type="text"
                placeholder="Ej: Licencia autorizada con soporte técnico para SEACE"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
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
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Generar y Activar Licencia</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Table of Licenses & Registered Users */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Usuarios y Licencias Emitidas</span>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {filteredSessions.length} cuentas
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administre las claves, suspenda o autorice el acceso de cada postor en tiempo real.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por RUC, nombre o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Postor / Titular</th>
                <th className="py-3 px-4">Clave de Licencia (Key)</th>
                <th className="py-3 px-4">Empresa & RUC</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones de Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((sess) => {
                const isMasterAdmin = sess.role === "admin" || sess.userEmail === ADMIN_MASTER_EMAIL;
                return (
                  <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {sess.userName}
                        {isMasterAdmin && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            ADMIN MASTER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{sess.userEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-1 rounded border border-slate-200 select-all">
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
                          title="Copiar mensaje de bienvenida para WhatsApp"
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
                      <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {sess.companyName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">RUC: {sess.ruc}</div>
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
                            onClick={() => handleDelete(sess.id, sess.userName)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Eliminar licencia"
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
    </div>
  );
};
