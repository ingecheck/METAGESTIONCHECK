import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  LogOut,
  Mail,
  User,
  Hash,
  Phone,
  HelpCircle,
  FileText,
  ShieldAlert,
  Users,
  HardHat,
  Award,
  ChevronRight,
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  LicenseSession,
  TeamMember,
  ADMIN_MASTER_EMAIL,
  INITIAL_DEFAULT_SESSIONS,
  EntityType,
} from "../types/auth";
import { auth, googleProvider, isUserAdmin } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  verifyLicenseKeyFromCloud,
  fetchFirebaseLicenses,
  submitLicenseRequest,
} from "../services/firebaseSync";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (session: LicenseSession) => void;
  availableSessions: LicenseSession[];
  onRequestLicense?: (details: {
    userName: string;
    userEmail: string;
    companyName: string;
    ruc: string;
    intendedUse?: string;
    phone?: string;
  }) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  availableSessions,
  onRequestLicense,
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "collaborator" | "request">("login");
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Collaborator direct login state
  const [collabDniOrEmail, setCollabDniOrEmail] = useState("");
  const [collabPin, setCollabPin] = useState("");
  const [showCollabPin, setShowCollabPin] = useState(false);
  const [collabSearchQuery, setCollabSearchQuery] = useState("");
  const [selectedEntityForCollab, setSelectedEntityForCollab] = useState<LicenseSession | null>(null);
  const [collabMode, setCollabMode] = useState<"direct" | "byEntity">("direct");

  // Team member selection state after key validation
  const [validatedLicense, setValidatedLicense] = useState<LicenseSession | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Form for requesting license from Admin
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqCompany, setReqCompany] = useState("");
  const [reqRuc, setReqRuc] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqIntendedUse, setReqIntendedUse] = useState("Formulación y Armado de Ofertas Técnicas OSCE");
  const [reqSuccess, setReqSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoadingGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || "").trim().toLowerCase();

      // 1. Check if user is the Master Admin
      if (isUserAdmin(userEmail)) {
        const adminSession: LicenseSession = {
          id: `admin-${user.uid}`,
          userId: user.uid,
          userName: user.displayName || "Administrador Principal",
          userEmail: user.email || ADMIN_MASTER_EMAIL,
          companyName: "ORGANISMO SUPERVISOR / ADMIN MASTER",
          ruc: "20100000001",
          licenseKey: "ADMIN-OSCE-MASTER-2026",
          role: "admin",
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
          expiresAt: "2035-12-31",
          maxTenders: 99999,
          currentTendersCount: 0,
          issuedBy: "Firebase Master Auth",
          notes: "Autenticado con Google como Administrador Principal.",
          firebaseSynced: true,
        };
        onLogin(adminSession);
        return;
      }

      // 2. Check if there is an existing authorized license in local state
      let matched = availableSessions.find(
        (s) => s.userEmail && s.userEmail.trim().toLowerCase() === userEmail
      );

      // If not in local state, fetch from Cloud Firestore
      if (!matched) {
        const cloudLicenses = await fetchFirebaseLicenses();
        matched = cloudLicenses.find(
          (s) => s.userEmail && s.userEmail.trim().toLowerCase() === userEmail
        );
      }

      if (matched) {
        if (matched.status === "suspended") {
          setErrorMsg("Su cuenta se encuentra suspendida. Contacte al Administrador para su reactivación.");
          return;
        }
        if (matched.status === "expired") {
          setErrorMsg("Su licencia ha expirado. El Administrador debe renovar su periodo de vigencia.");
          return;
        }

        // If this license has team members, offer selection
        if (matched.teamMembers && matched.teamMembers.length > 0) {
          setValidatedLicense({ ...matched, userId: user.uid, firebaseSynced: true });
        } else {
          onLogin({ ...matched, userId: user.uid, firebaseSynced: true });
        }
      } else {
        // REJECT ACCESS: User is not authorized/created by the admin!
        setErrorMsg(
          `Acceso denegado: El correo "${userEmail}" no cuenta con una licencia autorizada por el Administrador. Solicite su registro en la pestaña "Solicitar Licencia".`
        );
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(err.message || "Error al autenticar con Google.");
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Normalize license key: remove extra spaces, uppercase
    const rawKey = licenseKeyInput.trim();
    const cleanKey = rawKey.replace(/\s+/g, "").toUpperCase();

    if (!cleanKey) {
      setErrorMsg("Por favor ingrese su Clave de Licencia otorgada por el Administrador.");
      return;
    }

    setIsValidatingKey(true);

    try {
      // 1. Check Master Admin Key
      if (
        cleanKey === "ADMIN-OSCE-MASTER-2026" ||
        cleanKey === "ADMIN-OSCE-2026" ||
        cleanKey === "ADMINOSCEMASTER2026"
      ) {
        const adminSession = INITIAL_DEFAULT_SESSIONS[0];
        onLogin(adminSession);
        return;
      }

      // 2. Match session by license key in local availableSessions
      let foundSession = availableSessions.find((s) => {
        if (!s.licenseKey) return false;
        const targetClean = s.licenseKey.replace(/\s+/g, "").toUpperCase();
        return targetClean === cleanKey;
      });

      // 3. If not found locally, query Cloud Firestore
      if (!foundSession) {
        foundSession = await verifyLicenseKeyFromCloud(rawKey);
      }

      // 4. Fallback: fetch all cloud licenses in case of formatting variations
      if (!foundSession) {
        const allCloud = await fetchFirebaseLicenses();
        foundSession =
          allCloud.find((s) => {
            if (!s.licenseKey) return false;
            const targetClean = s.licenseKey.replace(/\s+/g, "").toUpperCase();
            return targetClean === cleanKey;
          }) || null;
      }

      if (!foundSession) {
        setErrorMsg(
          "Clave de licencia no encontrada o inválida. Verifique que coincida exactamente con la clave que le proporcionó el Administrador o solicite una nueva en la pestaña 'Solicitar Licencia'."
        );
        return;
      }

      if (foundSession.status === "suspended") {
        setErrorMsg("Esta licencia ha sido suspendida por el Administrador. Comuníquese para su reactivación.");
        return;
      }

      if (foundSession.status === "expired") {
        setErrorMsg("Esta licencia ha expirado. El Administrador debe renovar el periodo de vigencia.");
        return;
      }

      // If license has team members configured, show team selection screen
      if (foundSession.teamMembers && foundSession.teamMembers.length > 0) {
        setValidatedLicense(foundSession);
        setSelectedMember(null);
        setPinInput("");
        setPinError(null);
      } else {
        // Direct login
        onLogin(foundSession);
      }
    } catch (err: any) {
      console.error("License validation error:", err);
      setErrorMsg("Error al conectar con el servidor para validar la licencia.");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleMemberSelect = (member: TeamMember) => {
    setSelectedMember(member);
    setPinInput("");
    setPinError(null);

    // If member has no PIN required, proceed to login directly
    if (!member.accessPin || member.accessPin.trim() === "") {
      if (validatedLicense) {
        onLogin({
          ...validatedLicense,
          activeMemberId: member.id,
        });
      }
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedLicense || !selectedMember) return;

    const expectedPin = selectedMember.accessPin?.trim();
    if (expectedPin && pinInput.trim() !== expectedPin) {
      setPinError("El PIN ingresado es incorrecto. Verifique con el Titular de la Licencia.");
      return;
    }

    onLogin({
      ...validatedLicense,
      activeMemberId: selectedMember.id,
    });
  };

  const handleEnterAsTitular = () => {
    if (!validatedLicense) return;
    onLogin({
      ...validatedLicense,
      activeMemberId: undefined, // Titular main workspace
    });
  };

  // Direct Collaborator Login via DNI / Email + PIN
  const handleCollabDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const query = collabDniOrEmail.trim();
    if (!query) {
      setErrorMsg("Ingrese su DNI o Correo Electrónico institucional.");
      return;
    }

    setIsValidatingKey(true);

    try {
      // 1. Gather all local sessions and cloud licenses
      let allSessions = [...availableSessions];
      try {
        const cloudLicenses = await fetchFirebaseLicenses();
        const map = new Map<string, LicenseSession>();
        allSessions.forEach((s) => map.set(s.licenseKey.toUpperCase(), s));
        cloudLicenses.forEach((s) => map.set(s.licenseKey.toUpperCase(), s));
        allSessions = Array.from(map.values());
      } catch (e) {
        // use local
      }

      // 2. Search for the team member across all entities
      let targetSession: LicenseSession | null = null;
      let targetMember: TeamMember | null = null;

      const cleanQuery = query.toLowerCase();
      const cleanDigits = query.replace(/\D/g, "");
      const normalizeStr = (s?: string) =>
        (s || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
      const normalizedQuery = normalizeStr(query);
      const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

      for (const sess of allSessions) {
        if (!sess.teamMembers || sess.teamMembers.length === 0) continue;
        
        for (const member of sess.teamMembers) {
          const matchDni = member.dni && cleanDigits && member.dni.replace(/\D/g, "") === cleanDigits;
          const matchEmail = member.email && member.email.trim().toLowerCase() === cleanQuery;
          const matchCip = member.cip && member.cip.toLowerCase().replace(/\s+/g, "") === cleanQuery.replace(/\s+/g, "");
          const normName = normalizeStr(member.name);
          const matchNameDirect = normName.includes(normalizedQuery);
          const matchNameWords = queryWords.length > 0 && queryWords.every((word) => normName.includes(word));
          const matchCargo = member.cargoText && normalizeStr(member.cargoText).includes(normalizedQuery);

          if (matchDni || matchEmail || matchCip || matchNameDirect || matchNameWords || matchCargo) {
            targetSession = sess;
            targetMember = member;
            break;
          }
        }
        if (targetMember) break;
      }

      if (!targetSession || !targetMember) {
        setErrorMsg(
          `No se encontró ningún colaborador con el DNI/Correo "${query}". Verifique que su Titular lo haya registrado previamente en "Gestionar Mi Equipo" o seleccione su Entidad en la pestaña de abajo.`
        );
        return;
      }

      if (targetSession.status === "suspended") {
        setErrorMsg("La licencia de su entidad está suspendida. Comuníquese con el Titular o Administrador.");
        return;
      }

      if (targetSession.status === "expired") {
        setErrorMsg("La licencia de su entidad ha expirado. El Titular debe renovarla.");
        return;
      }

      // Check status of member
      if (targetMember.status === "inactive") {
        setErrorMsg("Su perfil de colaborador está marcado como inactivo. Solicite su activación al Titular.");
        return;
      }

      // Check PIN
      const expectedPin = (targetMember.accessPin || "").trim();
      if (expectedPin && collabPin.trim() !== expectedPin) {
        setErrorMsg(`El PIN de acceso ingresado es incorrecto para ${targetMember.name}. Verifique con el Titular.`);
        return;
      }

      // Validated! Log into collaborator's clean workspace
      onLogin({
        ...targetSession,
        activeMemberId: targetMember.id,
      });
    } catch (err: any) {
      console.error("Collab login error:", err);
      setErrorMsg("Error al autenticar colaborador. Por favor intente nuevamente.");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reqName.trim() || !reqEmail.trim() || !reqCompany.trim() || !reqRuc.trim()) {
      setErrorMsg("Por favor complete todos los campos obligatorios de la solicitud.");
      return;
    }

    if (reqRuc.trim().length !== 11) {
      setErrorMsg("El número de RUC debe tener exactamente 11 dígitos numéricos.");
      return;
    }

    setIsSubmittingReq(true);
    try {
      // 1. Submit to Firebase Cloud Firestore
      await submitLicenseRequest({
        userName: reqName.trim(),
        userEmail: reqEmail.trim().toLowerCase(),
        companyName: reqCompany.trim(),
        ruc: reqRuc.trim(),
        phone: reqPhone.trim(),
        intendedUse: reqIntendedUse.trim(),
      });

      // 2. Call optional parent hook
      if (onRequestLicense) {
        onRequestLicense({
          userName: reqName.trim(),
          userEmail: reqEmail.trim().toLowerCase(),
          companyName: reqCompany.trim(),
          ruc: reqRuc.trim(),
          phone: reqPhone.trim(),
          intendedUse: reqIntendedUse.trim(),
        });
      }

      setReqSuccess(true);
    } catch (err: any) {
      console.error("Error submitting license request:", err);
      setErrorMsg("Ocurrió un inconveniente al enviar la solicitud. Por favor intente nuevamente.");
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleResetRequestForm = () => {
    setReqSuccess(false);
    setReqName("");
    setReqEmail("");
    setReqCompany("");
    setReqRuc("");
    setReqPhone("");
    setActiveTab("login");
  };

  const getEntityIcon = (entityType?: EntityType) => {
    switch (entityType) {
      case "municipalidad":
      case "gobierno_regional":
      case "ministerio":
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case "empresa":
      case "consorcio":
        return <Briefcase className="w-5 h-5 text-indigo-400" />;
      case "consultor_supervisor":
        return <HardHat className="w-5 h-5 text-emerald-400" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "titular":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-300">Titular Responsable</span>;
      case "residente":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 border border-blue-300">Ing. Residente</span>;
      case "supervisor":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-300">Supervisor / Inspector</span>;
      case "especialista_costos":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-300">Especialista Costos & Val.</span>;
      case "gestor_licitaciones":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 border border-purple-300">Gestor Licitaciones SEACE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Colaborador</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md text-base">
              MGC
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                METAGESTIONCHECK
              </h2>
              <p className="text-xs text-slate-400">
                Portal Privado de Licitaciones SEACE & Control de Obras
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Sistema con aislamiento de cartera y mesa de trabajo individual</span>
          </div>
        </div>

        {/* If team member selection screen is active */}
        {validatedLicense ? (
          <div className="p-5 space-y-4">
            {/* Entity Header Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  {getEntityIcon(validatedLicense.entityType)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {validatedLicense.companyName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    RUC: {validatedLicense.ruc} • Clave: {validatedLicense.licenseKey}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValidatedLicense(null);
                  setSelectedMember(null);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-slate-200 transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Cambiar</span>
              </button>
            </div>

            {!selectedMember ? (
              /* Step A: Select Team Member or Titular */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Seleccione su Perfil de Trabajo
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cada colaborador ingresa a su propia mesa de trabajo limpia.
                    </p>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                    {validatedLicense.teamMembers?.length || 0} Colaboradores
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {/* Option 1: Direct Titular Workspace */}
                  <button
                    type="button"
                    onClick={handleEnterAsTitular}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        👑
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                          <span>{validatedLicense.userName}</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">Titular Principal</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Mesa de trabajo maestra • Control global y licitaciones
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
                  </button>

                  {/* Option 2..N: Team Members */}
                  {validatedLicense.teamMembers?.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleMemberSelect(member)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                              {member.name}
                            </span>
                            {getRoleBadge(member.role)}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {member.cargoText || member.email}
                            {member.cip ? ` • ${member.cip}` : ""}
                            {member.dni ? ` • DNI: ${member.dni}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        {member.accessPin && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono" title="Requiere PIN de acceso">
                            🔒 PIN
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Step B: Enter PIN for selected member */
              <form onSubmit={handlePinSubmit} className="space-y-4 animate-in fade-in zoom-in-95">
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {selectedMember.name}
                    </div>
                    <div className="text-[11px] text-blue-800">
                      {selectedMember.cargoText || selectedMember.role}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedMember.email}
                    </div>
                  </div>
                </div>

                {pinError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ingrese su PIN de Acceso (4 a 6 dígitos)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPin ? "text" : "password"}
                      placeholder="****"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setPinError(null);
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {selectedMember.accessPin && (
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                      <span>PIN asignado por el Titular</span>
                      <span className="font-mono text-slate-500">Demo PIN: <strong>{selectedMember.accessPin}</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Volver a la lista
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ingresar a mi Mesa</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Normal Tab Switchers & Form */
          <>
            {/* Tab switchers */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 text-center transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  activeTab === "login"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Titular / Licencia</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("collaborator");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 text-center transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  activeTab === "collaborator"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Colaborador / PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("request");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 text-center transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  activeTab === "request"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Solicitar</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {activeTab === "login" ? (
                <div className="space-y-4">
                  {/* 1. Google Sign-In Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoadingGoogle}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2.5 shadow-xs transition hover:border-slate-400 cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {isLoadingGoogle
                          ? "Verificando cuenta con Google..."
                          : "Iniciar Sesión con Google"}
                      </span>
                    </button>
                    <div className="flex items-center my-3.5">
                      <div className="flex-1 border-t border-slate-200"></div>
                      <span className="px-3 text-[10px] text-slate-400 uppercase font-semibold">
                        o con tu clave de licencia
                      </span>
                      <div className="flex-1 border-t border-slate-200"></div>
                    </div>
                  </div>

                  {/* 2. License Key Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Clave de Licencia del Titular o Entidad
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Ej: LIC-MUNI-RIOJA-2026 ó LIC-JHON-FRANKLIN-2026"
                          value={licenseKeyInput}
                          onChange={(e) => setLicenseKeyInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Ingrese la clave otorgada por el Administrador. Si pertenece a un equipo, podrá seleccionar su usuario y PIN en el siguiente paso.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isValidatingKey}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
                    >
                      {isValidatingKey ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verificando Licencia con el Servidor...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Validar Licencia e Ingresar</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Collaborator Shortcut Banner */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-blue-950">¿Eres Colaborador o Ingeniero?</div>
                        <div className="text-[11px] text-blue-800 truncate">Ingresa directamente con tu DNI / Correo y PIN.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("collaborator");
                        setErrorMsg(null);
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <span>Ingreso Equipo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-100">
                    <p className="text-[11px] text-slate-500">
                      ¿No tienes una clave de licencia activa?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("request")}
                        className="text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Solicítala aquí
                      </button>
                    </p>
                  </div>
                </div>
              ) : activeTab === "collaborator" ? (
                /* Dedicated Collaborator Login Tab */
                <div className="space-y-4">
                  {/* Mode switch: Direct by DNI/Email vs Pick by Entity */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCollabMode("direct");
                        setErrorMsg(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                        collabMode === "direct"
                          ? "bg-white text-blue-700 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Acceso Rápido con DNI / PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCollabMode("byEntity");
                        setErrorMsg(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                        collabMode === "byEntity"
                          ? "bg-white text-blue-700 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Seleccionar por Entidad
                    </button>
                  </div>

                  {collabMode === "direct" ? (
                    /* Direct DNI + PIN Form */
                    <form onSubmit={handleCollabDirectSubmit} className="space-y-3 animate-in fade-in zoom-in-95">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          DNI, Correo Electrónico o CIP del Colaborador
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            placeholder="Ej: 44290188 ó wtafur@munirioja.gob.pe"
                            value={collabDniOrEmail}
                            onChange={(e) => setCollabDniOrEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            autoFocus
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Ingrese el DNI o correo con el que su Titular lo registró en el equipo.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          PIN de Acceso Personal (4 a 6 dígitos)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type={showCollabPin ? "text" : "password"}
                            placeholder="****"
                            maxLength={6}
                            value={collabPin}
                            onChange={(e) => setCollabPin(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-widest"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCollabPin(!showCollabPin)}
                            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showCollabPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PIN confidencial asignado para su mesa de trabajo técnica.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isValidatingKey}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
                      >
                        {isValidatingKey ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Autenticando Colaborador...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Entrar a mi Mesa de Trabajo</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Pick Entity & Team Member View */
                    <div className="space-y-3 animate-in fade-in zoom-in-95">
                      {!selectedEntityForCollab ? (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Seleccione su Entidad / Empresa
                            </label>
                            <span className="text-[10px] text-slate-400">
                              Haga clic en su institución
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar entidad (ej: Rioja, Consorcio, Jhon...)"
                              value={collabSearchQuery}
                              onChange={(e) => setCollabSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {availableSessions
                              .filter((sess) => {
                                if (sess.role === "admin") return false;
                                if (!collabSearchQuery) return true;
                                const q = collabSearchQuery.toLowerCase();
                                return (
                                  sess.companyName.toLowerCase().includes(q) ||
                                  sess.userName.toLowerCase().includes(q) ||
                                  sess.ruc.includes(q) ||
                                  sess.licenseKey.toLowerCase().includes(q)
                                );
                              })
                              .map((sess) => (
                                <button
                                  key={sess.id}
                                  type="button"
                                  onClick={() => setSelectedEntityForCollab(sess)}
                                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition flex items-center justify-between group cursor-pointer shadow-2xs"
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                      {getEntityIcon(sess.entityType)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                                        {sess.companyName}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {sess.userName} • {sess.teamMembers?.length || 0} miembros
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5 shrink-0" />
                                </button>
                              ))}
                          </div>
                        </>
                      ) : (
                        /* Entity chosen: show its members */
                        <div className="space-y-3 animate-in fade-in">
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {selectedEntityForCollab.companyName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-blue-950 truncate">
                                  {selectedEntityForCollab.companyName}
                                </div>
                                <div className="text-[10px] text-blue-700 font-mono">
                                  RUC: {selectedEntityForCollab.ruc}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedEntityForCollab(null)}
                              className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-blue-200 rounded-lg font-semibold shrink-0 cursor-pointer"
                            >
                              Cambiar
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {selectedEntityForCollab.teamMembers && selectedEntityForCollab.teamMembers.length > 0 ? (
                              selectedEntityForCollab.teamMembers.map((member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => {
                                    setValidatedLicense(selectedEntityForCollab);
                                    handleMemberSelect(member);
                                  }}
                                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between group cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                      {member.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                                        {member.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {member.cargoText || member.role} {member.cip ? `• ${member.cip}` : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    {getRoleBadge(member.role)}
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="text-center py-4 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Esta entidad no tiene colaboradores registrados aún. El Titular debe agregarlos en "Gestionar Mi Equipo".
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                    💡 <strong>Aislamiento de Trabajo:</strong> Cada colaborador ingresa a su propia mesa de trabajo con sus permisos técnicos específicos (Residente, Supervisor, Especialista en Costos o Asistente).
                  </div>
                </div>
              ) : reqSuccess ? (
                /* Request Success Screen - Pending approval */
                <div className="space-y-4 py-2 animate-in fade-in zoom-in-95">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900">
                        ¡Solicitud Enviada con Éxito!
                      </h3>
                      <p className="text-xs text-emerald-700 mt-1">
                        Estado: <span className="font-bold uppercase tracking-wider bg-emerald-200/80 px-2 py-0.5 rounded text-[10px]">Pendiente de Aprobación</span>
                      </p>
                    </div>
                    <div className="text-left bg-white p-3 rounded-xl border border-emerald-100 text-[11px] text-slate-600 space-y-1">
                      <div><span className="font-semibold text-slate-800">Titular:</span> {reqName}</div>
                      <div><span className="font-semibold text-slate-800">Correo:</span> {reqEmail}</div>
                      <div><span className="font-semibold text-slate-800">Empresa:</span> {reqCompany} (RUC: {reqRuc})</div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                      El Administrador Principal (<strong>{ADMIN_MASTER_EMAIL}</strong>) ha recibido su solicitud en su Panel de Control. Una vez aprobada, le entregará su <strong>Clave de Licencia oficial</strong> para que pueda ingresar y registrar a su equipo de trabajo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetRequestForm}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Volver a la Pantalla de Ingreso
                  </button>
                </div>
              ) : (
                /* Request new license form */
                <form onSubmit={handleSendRequest} className="space-y-3.5">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Solicitud de Registro de Licencia</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Complete los datos para que el Administrador ({ADMIN_MASTER_EMAIL}) revise y apruebe su licencia:
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nombre del Ingeniero / Responsable *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ej: Ing. Jorge Ramirez"
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="correo@constructora.pe"
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Constructora S.A.C."
                        value={reqCompany}
                        onChange={(e) => setReqCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        RUC (11 dígitos) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        placeholder="2060..."
                        value={reqRuc}
                        onChange={(e) => setReqRuc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          placeholder="999 888 777"
                          value={reqPhone}
                          onChange={(e) => setReqPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Uso Estimado
                      </label>
                      <select
                        value={reqIntendedUse}
                        onChange={(e) => setReqIntendedUse(e.target.value)}
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Armado de Ofertas Técnicas OSCE">Armado de Ofertas OSCE</option>
                        <option value="Control de Obras y Valorizaciones">Control de Obras & Valorizaciones</option>
                        <option value="Consultoría y Supervisión de Obras">Consultoría y Supervisión</option>
                        <option value="Suite Completa Corporativa">Suite Completa Corporativa</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="flex-1 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReq}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {isSubmittingReq ? (
                        <span>Enviando...</span>
                      ) : (
                        <span>Enviar Solicitud al Admin</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
