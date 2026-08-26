import React, { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Key,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  Edit2,
  Copy,
  Check,
  HardHat,
  Briefcase,
  Layers,
  Award,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  X,
  Send,
  AlertCircle,
  FileCheck2,
  Lock,
  MessageCircle,
  Share2,
  ExternalLink,
} from "lucide-react";
import { LicenseSession, TeamMember, TeamMemberRole, EntityType } from "../../types/auth";

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: LicenseSession;
  onUpdateSession: (updatedSession: LicenseSession) => void;
  onSwitchActiveMember?: (memberId: string) => void;
}

const ROLE_DEFINITIONS: Record<
  TeamMemberRole,
  { label: string; icon: any; color: string; bg: string; border: string; desc: string }
> = {
  titular: {
    label: "Titular / Administrador",
    icon: Building2,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    desc: "Control total de la entidad/empresa, administración de licencias y proyectos.",
  },
  residente: {
    label: "Ingeniero Residente de Obra",
    icon: HardHat,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    desc: "Firma de cuaderno de obra, valorizaciones mensuales, control de partidas y metrados.",
  },
  supervisor: {
    label: "Supervisor / Inspector de Obra",
    icon: ShieldCheck,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    desc: "Revisión y aprobación de valorizaciones, control de calidad, peritaje e informes.",
  },
  especialista_costos: {
    label: "Especialista en Costos y Valorizaciones",
    icon: Layers,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    desc: "Fórmulas polinómicas, reajustes K, deducciones de adelantos y curva S.",
  },
  gestor_licitaciones: {
    label: "Especialista en Licitaciones SEACE",
    icon: Briefcase,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    desc: "Análisis de Bases OSCE, armado de propuestas técnicas y económicas, Anexo 8.",
  },
  auditor: {
    label: "Auditor Técnico / Perito de Liquidación",
    icon: FileCheck2,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    desc: "Auditoría pericial, cotejo Excel vs Escaneado, liquidación técnico-financiera.",
  },
  admin_contratos: {
    label: "Administrador de Contratos y Legal",
    icon: Award,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    desc: "Ampliaciones de plazo, adicionales de obra, penalidades y controversias OSCE.",
  },
  asistente: {
    label: "Asistente Técnico de Ingeniería",
    icon: Users,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-300",
    desc: "Carga de metrados, foliación de expedientes y soporte de gabinete.",
  },
};

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateSession,
  onSwitchActiveMember,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [copiedWhatsAppText, setCopiedWhatsAppText] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // WhatsApp Modal State
  const [whatsAppModalMember, setWhatsAppModalMember] = useState<TeamMember | null>(null);
  const [whatsAppTargetPhone, setWhatsAppTargetPhone] = useState("");
  const [justSavedMember, setJustSavedMember] = useState<TeamMember | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDni, setFormDni] = useState("");
  const [formCip, setFormCip] = useState("");
  const [formRole, setFormRole] = useState<TeamMemberRole>("residente");
  const [formCargo, setFormCargo] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPin, setFormPin] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [formModuleScope, setFormModuleScope] = useState<"all" | "obras" | "ofertador">("all");
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const teamMembers = currentUser.teamMembers || [];
  const maxMembers = currentUser.maxTeamMembers || 10;
  const isQuotaFull = teamMembers.length >= maxMembers;
  const activeMemberId = currentUser.activeMemberId;
  const activeMember = teamMembers.find((m) => m.id === activeMemberId) || null;

  const generateRandomPin = () => {
    return String(Math.floor(1000 + Math.random() * 9000));
  };

  const buildWhatsAppMessage = (member: TeamMember) => {
    const appUrl = window.location.origin;
    const roleLabel = member.cargoText || ROLE_DEFINITIONS[member.role]?.label || "Colaborador Técnico";
    
    return `🏛️ *METAGESTIONCHECK - ACCESO AL EQUIPO TÉCNICO*
Hola estimado(a) *${member.name}*, se ha habilitado tu acceso individual a la plataforma de gestión SEACE y control de obras:

🏢 *Entidad / Empresa:* ${currentUser.companyName} (RUC: ${currentUser.ruc})
👷 *Cargo / Especialidad:* ${roleLabel}
${member.dni ? `🪪 *DNI Registrado:* ${member.dni}\n` : ""}${member.cip ? `📐 *Colegiatura:* ${member.cip}\n` : ""}━━━━━━━━━━━━━━━━━━━━━
🔑 *TUS DATOS DE ACCESO:*
• *Clave Institucional:* \`${currentUser.licenseKey}\`
• *PIN Privado de Acceso:* \`${member.accessPin || "1234"}\`
• *Usuario / Correo:* ${member.email}
━━━━━━━━━━━━━━━━━━━━━
📲 *CÓMO INGRESAR AL SISTEMA:*
1️⃣ Ingresa al portal: ${appUrl}
2️⃣ Haz clic en la pestaña *👥 Colaborador / PIN*
3️⃣ Digita tu DNI (${member.dni || member.email}) y tu PIN *${member.accessPin || "1234"}*
4️⃣ ¡Listo! Ingresarás directamente a tu mesa de trabajo técnica individual con aislamiento de expedientes y trazabilidad OSCE.

💡 *Seguridad:* Tu PIN de acceso es personal e intransferible.`;
  };

  const handleOpenWhatsAppDirect = (member: TeamMember, customPhone?: string) => {
    const text = buildWhatsAppMessage(member);
    const rawPhone = (customPhone || member.phone || "").replace(/\D/g, "");
    let phoneParam = "";
    if (rawPhone) {
      phoneParam = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone;
    }

    const encoded = encodeURIComponent(text);
    const waUrl = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, "_blank");
  };

  const handleCopyWhatsAppText = (member: TeamMember) => {
    const message = buildWhatsAppMessage(member);
    navigator.clipboard.writeText(message);
    setCopiedInviteId(member.id);
    setCopiedWhatsAppText(true);
    setTimeout(() => {
      setCopiedInviteId(null);
      setCopiedWhatsAppText(false);
    }, 3000);
  };

  const handleOpenWhatsAppModal = (member: TeamMember) => {
    setWhatsAppModalMember(member);
    setWhatsAppTargetPhone(member.phone || "");
  };

  const handleOpenAddForm = () => {
    if (isQuotaFull) {
      alert(`Ha alcanzado el cupo máximo de ${maxMembers} colaboradores para su licencia. Contacte al Administrador si necesita ampliar su cupo.`);
      return;
    }
    setEditingMemberId(null);
    setFormName("");
    setFormEmail("");
    setFormDni("");
    setFormCip("");
    setFormRole("residente");
    setFormCargo("Ingeniero Residente de Obra");
    setFormPhone("");
    setFormPin(generateRandomPin());
    setFormModuleScope("all");
    setFormError(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormDni(member.dni || "");
    setFormCip(member.cip || "");
    setFormRole(member.role);
    setFormCargo(member.cargoText || "");
    setFormPhone(member.phone || "");
    setFormPin(member.accessPin || generateRandomPin());
    setFormModuleScope(
      member.allowedModules?.includes("all")
        ? "all"
        : member.allowedModules?.includes("obras")
        ? "obras"
        : "ofertador"
    );
    setFormError(null);
    setShowAddForm(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formEmail.trim()) {
      setFormError("Por favor ingrese el Nombre Completo y Correo Electrónico del colaborador.");
      return;
    }

    const currentList = [...teamMembers];

    if (editingMemberId) {
      // Update existing
      let updatedObj: TeamMember | null = null;
      const updatedList = currentList.map((m) => {
        if (m.id === editingMemberId) {
          updatedObj = {
            ...m,
            name: formName.trim(),
            email: formEmail.trim().toLowerCase(),
            dni: formDni.trim() || undefined,
            cip: formCip.trim() || undefined,
            role: formRole,
            cargoText: formCargo.trim() || ROLE_DEFINITIONS[formRole].label,
            phone: formPhone.trim() || undefined,
            accessPin: formPin.trim() || "1234",
            allowedModules: formModuleScope === "all" ? ["all"] : [formModuleScope],
          };
          return updatedObj;
        }
        return m;
      });

      const updatedSession: LicenseSession = {
        ...currentUser,
        teamMembers: updatedList,
      };
      onUpdateSession(updatedSession);
      setShowAddForm(false);
      setEditingMemberId(null);
      if (updatedObj) {
        setJustSavedMember(updatedObj);
      }
    } else {
      // Add new
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        dni: formDni.trim() || undefined,
        cip: formCip.trim() || undefined,
        role: formRole,
        cargoText: formCargo.trim() || ROLE_DEFINITIONS[formRole].label,
        phone: formPhone.trim() || undefined,
        accessPin: formPin.trim() || "1234",
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
        allowedModules: formModuleScope === "all" ? ["all"] : [formModuleScope],
      };

      const updatedSession: LicenseSession = {
        ...currentUser,
        teamMembers: [...currentList, newMember],
      };
      onUpdateSession(updatedSession);
      setShowAddForm(false);
      setJustSavedMember(newMember);
    }
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (!confirm(`¿Está seguro de eliminar a "${memberName}" del equipo de trabajo?`)) return;
    const updatedList = teamMembers.filter((m) => m.id !== memberId);
    const updatedSession: LicenseSession = {
      ...currentUser,
      teamMembers: updatedList,
      activeMemberId: currentUser.activeMemberId === memberId ? undefined : currentUser.activeMemberId,
    };
    onUpdateSession(updatedSession);
  };

  const handleToggleMemberStatus = (memberId: string) => {
    const updatedList = teamMembers.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          status: m.status === "active" ? ("inactive" as const) : ("active" as const),
        };
      }
      return m;
    });
    onUpdateSession({
      ...currentUser,
      teamMembers: updatedList,
    });
  };

  const handleCopyInvitation = (member: TeamMember) => {
    const appUrl = window.location.origin;
    const roleInfo = ROLE_DEFINITIONS[member.role];
    const message = `🏛️ *INVITACIÓN AL EQUIPO DE TRABAJO - METAGESTIONCHECK*
Hola *${member.name}*, se te ha asignado acceso como *${member.cargoText || roleInfo.label}* en la cartera de:
🏢 *Entidad / Empresa:* ${currentUser.companyName} (RUC: ${currentUser.ruc})

🔑 *Clave de Licencia Institucional:* \`${currentUser.licenseKey}\`
🔢 *Tu PIN de Acceso Colaborador:* \`${member.accessPin || "1234"}\`
👤 *Usuario Registrado:* ${member.email}
🌐 *Acceso al Sistema:* ${appUrl}

Ingresa con la Clave Institucional y tu PIN para acceder a la mesa de trabajo limpia, gestionar tus valorizaciones, partidas y propuestas técnicas conforme a la normativa OSCE.`;

    navigator.clipboard.writeText(message);
    setCopiedInviteId(member.id);
    setTimeout(() => setCopiedInviteId(null), 3000);
  };

  const toggleShowPin = (memberId: string) => {
    setShowPins((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const getEntityBadge = (type?: EntityType) => {
    switch (type) {
      case "municipalidad":
        return { label: "Municipalidad / Entidad Local", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "gobierno_regional":
        return { label: "Gobierno Regional (GORE)", color: "bg-blue-100 text-blue-800 border-blue-300" };
      case "ministerio":
        return { label: "Ministerio / Entidad Nacional", color: "bg-purple-100 text-purple-800 border-purple-300" };
      case "empresa":
        return { label: "Empresa Contratista", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
      case "consorcio":
        return { label: "Consorcio Ejecutor", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "consultor_supervisor":
        return { label: "Consultoría & Supervisión", color: "bg-rose-100 text-rose-800 border-rose-300" };
      default:
        return { label: "Organización Registrada", color: "bg-slate-100 text-slate-800 border-slate-300" };
    }
  };

  const entityBadge = getEntityBadge(currentUser.entityType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${entityBadge.color}`}>
                {entityBadge.label}
              </span>
              <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded">
                RUC: {currentUser.ruc}
              </span>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Licencia: {currentUser.licenseKey}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Equipo de Trabajo & Colaboradores de {currentUser.companyName}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Cada colaborador registrado tiene su propio perfil de acceso con firma CIP, rol técnico y mesa de trabajo sincronizada para operar expedientes y obras.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Bar & Quotas */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Cupo de Miembros del Equipo:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-black font-mono ${
                  isQuotaFull ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {teamMembers.length} de {maxMembers} colaboradores
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mesa de trabajo limpia e independiente por titular • Control de acceso por PIN y rol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                type="button"
                onClick={handleOpenAddForm}
                disabled={isQuotaFull}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Agregar Colaborador</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ADD / EDIT FORM MODAL-IN-PLACE */}
          {showAddForm && (
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <UserCheck className="w-4 h-4" />
                  <span>{editingMemberId ? "Editar Datos del Colaborador" : "Registrar Nuevo Miembro en el Equipo"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveMember} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nombre Completo *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej. Ing. Carlos Santisteban"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Correo Electrónico *</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Rol Técnico Base *</label>
                    <select
                      value={formRole}
                      onChange={(e) => {
                        const newRole = e.target.value as TeamMemberRole;
                        setFormRole(newRole);
                        if (!formCargo || Object.values(ROLE_DEFINITIONS).some(r => r.label === formCargo)) {
                          setFormCargo(ROLE_DEFINITIONS[newRole].label);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                    >
                      {Object.entries(ROLE_DEFINITIONS).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Cargo Específico / Especialidad (Escribir libremente o elegir) *
                      </label>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Editable y personalizable
                      </span>
                    </div>
                    <input
                      type="text"
                      list="team-specialist-suggestions"
                      value={formCargo}
                      onChange={(e) => setFormCargo(e.target.value)}
                      placeholder="Ej. Especialista en Estructuras / Mecánica de Suelos / SSOMA..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-semibold text-slate-900"
                      required
                    />
                    <datalist id="team-specialist-suggestions">
                      <option value="Ingeniero Residente de Obra" />
                      <option value="Supervisor Principal de Obra" />
                      <option value="Jefe de Supervisión de Obra" />
                      <option value="Especialista en Estructuras" />
                      <option value="Especialista en Mecánica de Suelos, Pavimentos y Geotecnia" />
                      <option value="Especialista en Seguridad, Salud en el Trabajo y Medio Ambiente (SSOMA)" />
                      <option value="Especialista en Costos, Presupuestos, Metrados y Valorizaciones" />
                      <option value="Especialista en Liquidación y Cierre de Obras" />
                      <option value="Especialista en Impacto Ambiental (PMA / PAC)" />
                      <option value="Especialista en Instalaciones Sanitarias" />
                      <option value="Especialista en Instalaciones Eléctricas y Electromecánicas" />
                      <option value="Especialista en Hidrología, Hidráulica y Drenaje" />
                      <option value="Especialista en Geología y Geotecnia" />
                      <option value="Especialista en Topografía, Geodesia y Trazo" />
                      <option value="Especialista en Aseguramiento y Control de Calidad (QA/QC)" />
                      <option value="Especialista en Gestión de Riesgos en la Ejecución de Obras" />
                      <option value="Especialista BIM / Modelador de Infraestructura" />
                      <option value="Especialista en Pavimentos y Obras de Arte" />
                      <option value="Jefe de Oficina Técnica" />
                      <option value="Asistente Técnico del Residente de Obra" />
                      <option value="Asistente de Supervisión de Obra" />
                    </datalist>

                    {/* Quick suggestion tags for 1-click filling while keeping full typing freedom */}
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Sugerencias rápidas:</span>
                      {[
                        "Esp. en Estructuras",
                        "Esp. en Suelos y Pavimentos",
                        "Esp. en SSOMA",
                        "Esp. en Costos y Valorizaciones",
                        "Esp. en Sanitarias",
                        "Esp. en Electromecánica",
                        "Esp. Ambiental",
                        "Esp. BIM",
                        "Jefe de Oficina Técnica",
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            const fullMap: Record<string, string> = {
                              "Esp. en Estructuras": "Especialista en Estructuras",
                              "Esp. en Suelos y Pavimentos": "Especialista en Mecánica de Suelos, Pavimentos y Geotecnia",
                              "Esp. en SSOMA": "Especialista en Seguridad, Salud en el Trabajo y Medio Ambiente (SSOMA)",
                              "Esp. en Costos y Valorizaciones": "Especialista en Costos, Presupuestos y Valorizaciones",
                              "Esp. en Sanitarias": "Especialista en Instalaciones Sanitarias",
                              "Esp. en Electromecánica": "Especialista en Instalaciones Eléctricas y Electromecánicas",
                              "Esp. Ambiental": "Especialista en Impacto Ambiental",
                              "Esp. BIM": "Especialista BIM",
                              "Jefe de Oficina Técnica": "Jefe de Oficina Técnica",
                            };
                            setFormCargo(fullMap[sug] || sug);
                            if (sug.includes("Costos") || sug.includes("Valorizaciones")) {
                              setFormRole("especialista_costos");
                            } else if (sug.includes("Esp.")) {
                              setFormRole("especialista");
                            } else if (sug.includes("Oficina")) {
                              setFormRole("asistente");
                            }
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-md text-[10px] text-slate-600 hover:text-indigo-700 transition cursor-pointer font-medium"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">DNI (Opcional)</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={formDni}
                      onChange={(e) => setFormDni(e.target.value.replace(/\D/g, ""))}
                      placeholder="8 dígitos"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">N° CIP / Colegiatura</label>
                    <input
                      type="text"
                      value={formCip}
                      onChange={(e) => setFormCip(e.target.value)}
                      placeholder="Ej. CIP 189432"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">PIN de Acceso Rápido *</label>
                      <button
                        type="button"
                        onClick={() => setFormPin(generateRandomPin())}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        Generar PIN
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      placeholder="4-6 dígitos"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Alcance de Módulos</label>
                    <select
                      value={formModuleScope}
                      onChange={(e) => setFormModuleScope(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                    >
                      <option value="all">Todos los Módulos (Licitaciones & Obras)</option>
                      <option value="obras">Solo Control de Obras & Valorizaciones</option>
                      <option value="ofertador">Solo Ofertador & Licitaciones SEACE</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingMemberId ? "Guardar Cambios" : "Registrar Colaborador"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACTIVE MEMBER BAR */}
          {activeMember && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl font-bold shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 block">
                    Perfil Activo en la Mesa de Trabajo
                  </span>
                  <span className="font-bold text-emerald-950 text-xs">
                    {activeMember.name} • {activeMember.cargoText || ROLE_DEFINITIONS[activeMember.role].label}
                  </span>
                </div>
              </div>

              {onSwitchActiveMember && (
                <button
                  type="button"
                  onClick={() => onSwitchActiveMember("")}
                  className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold transition"
                >
                  Cambiar a Titular General
                </button>
              )}
            </div>
          )}

          {/* MEMBERS LIST */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>Colaboradores Registrados ({teamMembers.length})</span>
            </h3>

            {teamMembers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Aún no ha registrado colaboradores en su equipo</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Agregue a su Ingeniero Residente, Supervisor de Obra o Especialistas para que accedan con su clave y PIN a la cartera compartida.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition inline-flex items-center gap-1.5 mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Agregar Primer Miembro</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamMembers.map((member) => {
                  const roleConfig = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.asistente;
                  const RoleIcon = roleConfig.icon;
                  const isCurrentActive = currentUser.activeMemberId === member.id;
                  const isPinVisible = !!showPins[member.id];

                  return (
                    <div
                      key={member.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isCurrentActive
                          ? "bg-indigo-50/40 border-indigo-400 ring-2 ring-indigo-200"
                          : member.status === "active"
                          ? "bg-white border-slate-200 hover:border-indigo-300"
                          : "bg-slate-50/60 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Member Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-xl border ${roleConfig.bg} ${roleConfig.border} ${roleConfig.color} shrink-0`}>
                              <RoleIcon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                {member.cip && (
                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-medium">
                                    {member.cip}
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-500">
                                {member.cargoText || roleConfig.label}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              member.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {member.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                          <div className="flex items-center gap-1 truncate font-mono">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.phone ? (
                            <div className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{member.phone}</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 font-mono text-[10px]">
                              {member.dni ? `DNI: ${member.dni}` : "Sin teléfono"}
                            </div>
                          )}
                        </div>

                        {/* PIN & Credentials / WhatsApp Actions Bar */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-slate-600 font-medium">PIN:</span>
                              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                {isPinVisible ? member.accessPin || "1234" : "••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPin(member.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                                title={isPinVisible ? "Ocultar PIN" : "Ver PIN"}
                              >
                                {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <span className="text-[10px] text-slate-400 font-medium">
                              Ingreso con DNI / PIN
                            </span>
                          </div>

                          {/* WhatsApp Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsAppDirect(member)}
                              className="flex-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                              title="Abrir WhatsApp para enviar credenciales directamente"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-100 fill-emerald-100" />
                              <span>Enviar por WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenWhatsAppModal(member)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition cursor-pointer"
                              title="Ver mensaje completo de WhatsApp y ajustar teléfono"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyWhatsAppText(member)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition cursor-pointer"
                              title="Copiar texto con formato de WhatsApp"
                            >
                              {copiedInviteId === member.id && copiedWhatsAppText ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        {onSwitchActiveMember && (
                          <button
                            type="button"
                            onClick={() => onSwitchActiveMember(member.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isCurrentActive
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isCurrentActive ? "Perfil Actual" : "Operar como este usuario"}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(member)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleMemberStatus(member.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition text-[11px] font-mono"
                            title={member.status === "active" ? "Desactivar" : "Activar"}
                          >
                            {member.status === "active" ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            {currentUser.companyName} • {teamMembers.length} Miembros activos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar Panel de Equipo
          </button>
        </div>
      </div>

      {/* WHATSAPP DETAIL & PREVIEW MODAL */}
      {whatsAppModalMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/30 rounded-xl border border-emerald-400/40">
                  <MessageCircle className="w-5 h-5 text-emerald-200 fill-emerald-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Enviar Credenciales por WhatsApp</span>
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    {whatsAppModalMember.name} • {whatsAppModalMember.cargoText || ROLE_DEFINITIONS[whatsAppModalMember.role].label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalMember(null)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              {/* Phone target input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Número de WhatsApp del Colaborador (Perú / Internacional):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs font-semibold">🇵🇪 +51</span>
                    <input
                      type="text"
                      placeholder="987654321"
                      value={whatsAppTargetPhone}
                      onChange={(e) => setWhatsAppTargetPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                      className="w-full pl-16 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  * Si no ingresas número, WhatsApp te permitirá seleccionar el contacto o grupo directamente.
                </p>
              </div>

              {/* Message Simulation Bubble */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Vista Previa del Mensaje Oficial:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyWhatsAppText(whatsAppModalMember)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedInviteId === whatsAppModalMember.id && copiedWhatsAppText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¡Texto Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-[#eef7ee] border border-emerald-200 rounded-2xl text-[11px] font-sans text-slate-800 space-y-2 whitespace-pre-wrap shadow-inner leading-relaxed select-text">
                  {buildWhatsAppMessage(whatsAppModalMember)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setWhatsAppModalMember(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppText(whatsAppModalMember)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenWhatsAppDirect(whatsAppModalMember, whatsAppTargetPhone);
                    setWhatsAppModalMember(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Abrir WhatsApp Ahora</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST-SAVE CONFIRMATION TOAST / PROMPT */}
      {justSavedMember && (
        <div className="fixed bottom-6 right-6 z-60 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 max-w-sm animate-in slide-in-from-bottom-5 duration-200 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Colaborador Guardado Correctamente</span>
            </div>
            <button
              onClick={() => setJustSavedMember(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300">
            Se registraron las credenciales y el PIN de acceso para <strong className="text-white">{justSavedMember.name}</strong>. ¿Deseas enviarle su acceso por WhatsApp ahora?
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                handleOpenWhatsAppDirect(justSavedMember);
                setJustSavedMember(null);
              }}
              className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleOpenWhatsAppModal(justSavedMember);
                setJustSavedMember(null);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Ver Mensaje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
