import React, { useState } from "react";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Users,
  HardHat,
  ChevronRight,
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  LicenseSession,
  TeamMember,
  ADMIN_MASTER_EMAIL,
  INITIAL_DEFAULT_SESSIONS,
  EntityType,
  ACTIVE_USER_STORAGE_KEY,
  mergeLicenseSessionWithExisting,
} from "../types/auth";
import { auth, googleProvider, isUserAdmin } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  fetchFirebaseLicenses,
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
}) => {
  // Tabs: ONLY "email" and "collaborator" (No "solicitar", No "clave de licencia")
  const [activeTab, setActiveTab] = useState<"email" | "collaborator">("email");

  // Email login state - Pre-filled from localStorage if previously remembered
  const [emailInput, setEmailInput] = useState(() => {
    return localStorage.getItem("osce_saved_login_email") || "";
  });
  const [passwordInput, setPasswordInput] = useState(() => {
    return localStorage.getItem("osce_saved_login_pin") || "";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(() => {
    return localStorage.getItem("osce_keep_session_active") !== "false";
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collaborator login state
  const [collabEmail, setCollabEmail] = useState(() => {
    return localStorage.getItem("osce_saved_collab_email") || "";
  });
  const [collabPin, setCollabPin] = useState(() => {
    return localStorage.getItem("osce_saved_collab_pin") || "";
  });
  const [showCollabPin, setShowCollabPin] = useState(false);
  const [collabSearchQuery, setCollabSearchQuery] = useState("");
  const [selectedEntityForCollab, setSelectedEntityForCollab] = useState<LicenseSession | null>(null);
  const [collabMode, setCollabMode] = useState<"direct" | "byEntity">("direct");

  // Selected member for PIN entry when choosing by entity
  const [validatedLicense, setValidatedLicense] = useState<LicenseSession | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [entityMemberPin, setEntityMemberPin] = useState("");
  const [showEntityMemberPin, setShowEntityMemberPin] = useState(false);
  const [entityMemberPinError, setEntityMemberPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Persist session credentials helper
  const persistSessionCredentials = (email: string, pin: string, session: LicenseSession) => {
    if (rememberSession) {
      localStorage.setItem("osce_keep_session_active", "true");
      localStorage.setItem("osce_saved_login_email", email.trim().toLowerCase());
      if (pin) {
        localStorage.setItem("osce_saved_login_pin", pin.trim());
      }
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.setItem("osce_keep_session_active", "false");
      localStorage.removeItem("osce_saved_login_email");
      localStorage.removeItem("osce_saved_login_pin");
    }
  };

  // Google Sign-In with popup
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
        persistSessionCredentials(userEmail, "", adminSession);
        onLogin(adminSession);
        return;
      }

      // Gather local + cloud licenses
      let allSessions = [...availableSessions];
      try {
        const cloudLicenses = await fetchFirebaseLicenses();
        const map = new Map<string, LicenseSession>();
        allSessions.forEach((s) => map.set(s.licenseKey.toUpperCase(), s));
        cloudLicenses.forEach((s) => {
          const key = s.licenseKey.toUpperCase();
          const existing = map.get(key);
          map.set(key, mergeLicenseSessionWithExisting(existing, s));
        });
        allSessions = Array.from(map.values());
      } catch (e) {
        // use local
      }

      // 2. Check if matches any collaborator's email
      for (const sess of allSessions) {
        if (!sess.teamMembers) continue;
        for (const m of sess.teamMembers) {
          if (m.email && m.email.trim().toLowerCase() === userEmail) {
            const collabSession = { ...sess, activeMemberId: m.id, firebaseSynced: true };
            persistSessionCredentials(userEmail, m.accessPin || "", collabSession);
            onLogin(collabSession);
            return;
          }
        }
      }

      // 3. Check if matches any titular license
      const matchedTitular = allSessions.find(
        (s) => s.userEmail && s.userEmail.trim().toLowerCase() === userEmail
      );
      if (matchedTitular) {
        if (matchedTitular.status === "suspended") {
          setErrorMsg("Su cuenta institucional ha sido suspendida. Comuníquese con el Administrador.");
          return;
        }
        if (matchedTitular.status === "expired") {
          setErrorMsg("Su periodo de vigencia ha expirado. Comuníquese con el Administrador.");
          return;
        }
        const sessionWithUser = { ...matchedTitular, userId: user.uid, firebaseSynced: true };
        persistSessionCredentials(userEmail, "", sessionWithUser);
        onLogin(sessionWithUser);
        return;
      }

      // If not recognized:
      setErrorMsg(
        `Acceso no registrado: El correo de Google "${userEmail}" no figura en la base de datos de usuarios autorizados. Verifique con el Administrador o con el Titular de su Entidad.`
      );
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(err.message || "Error al autenticar con Google.");
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Main Email + PIN/Password Login Form
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rawEmail = emailInput.trim();
    if (!rawEmail) {
      setErrorMsg("Por favor ingrese su correo electrónico.");
      return;
    }

    const cleanEmail = rawEmail.toLowerCase();
    setIsSubmitting(true);

    try {
      // 1. Check Master Admin
      if (
        isUserAdmin(cleanEmail) ||
        cleanEmail === ADMIN_MASTER_EMAIL.toLowerCase() ||
        cleanEmail === "admin@osce.gob.pe" ||
        cleanEmail === "admin"
      ) {
        const adminSession = INITIAL_DEFAULT_SESSIONS[0];
        persistSessionCredentials(cleanEmail, passwordInput, adminSession);
        onLogin(adminSession);
        return;
      }

      // 2. Fetch cloud licenses combined with local sessions
      let allSessions = [...availableSessions];
      try {
        const cloudLicenses = await fetchFirebaseLicenses();
        const map = new Map<string, LicenseSession>();
        allSessions.forEach((s) => map.set(s.licenseKey.toUpperCase(), s));
        cloudLicenses.forEach((s) => {
          const key = s.licenseKey.toUpperCase();
          const existing = map.get(key);
          map.set(key, mergeLicenseSessionWithExisting(existing, s));
        });
        allSessions = Array.from(map.values());
      } catch (e) {
        // fallback to local
      }

      // 3. Search for Collaborator by email
      let matchedSession: LicenseSession | null = null;
      let matchedMember: TeamMember | null = null;

      for (const sess of allSessions) {
        if (!sess.teamMembers) continue;
        for (const m of sess.teamMembers) {
          if (m.email && m.email.trim().toLowerCase() === cleanEmail) {
            matchedSession = sess;
            matchedMember = m;
            break;
          }
        }
        if (matchedMember) break;
      }

      if (matchedSession && matchedMember) {
        if (matchedSession.status === "suspended") {
          setErrorMsg("La cuenta de su Entidad o Empresa se encuentra suspendida.");
          return;
        }
        if (matchedMember.status === "inactive") {
          setErrorMsg("Su perfil de colaborador está inactivo. Solicite la activación a su Titular.");
          return;
        }

        // Validate PIN if configured
        const expectedPin = (matchedMember.accessPin || "").trim();
        if (expectedPin && passwordInput.trim() && passwordInput.trim() !== expectedPin) {
          setErrorMsg(`El PIN de acceso ingresado es incorrecto para ${matchedMember.name}.`);
          return;
        }

        const sessionToLogin: LicenseSession = {
          ...matchedSession,
          activeMemberId: matchedMember.id,
        };
        persistSessionCredentials(cleanEmail, passwordInput, sessionToLogin);
        onLogin(sessionToLogin);
        return;
      }

      // 4. Search for Titular by userEmail
      const matchedTitular = allSessions.find(
        (s) => s.userEmail && s.userEmail.trim().toLowerCase() === cleanEmail
      );

      if (matchedTitular) {
        if (matchedTitular.status === "suspended") {
          setErrorMsg("Esta cuenta ha sido suspendida. Comuníquese con el Administrador.");
          return;
        }
        if (matchedTitular.status === "expired") {
          setErrorMsg("Esta cuenta ha expirado. El periodo de vigencia debe ser renovado.");
          return;
        }

        // If titular has team members, check if titular member has a PIN
        const titularMember = matchedTitular.teamMembers?.find(
          (m) => m.role === "titular" || (m.email && m.email.trim().toLowerCase() === cleanEmail)
        );
        const expectedPin = titularMember?.accessPin?.trim();
        if (expectedPin && passwordInput.trim() && passwordInput.trim() !== expectedPin) {
          setErrorMsg("El PIN o contraseña ingresada es incorrecta para el Titular.");
          return;
        }

        persistSessionCredentials(cleanEmail, passwordInput, matchedTitular);
        onLogin(matchedTitular);
        return;
      }

      // 5. Friendly fallback: Check if user pasted a collaborator name or DNI into the email field
      const cleanDigits = rawEmail.replace(/\D/g, "");
      for (const sess of allSessions) {
        if (!sess.teamMembers) continue;
        for (const m of sess.teamMembers) {
          const matchDni = m.dni && cleanDigits && m.dni.replace(/\D/g, "") === cleanDigits;
          const matchName = m.name.toLowerCase().includes(cleanEmail);
          if (matchDni || matchName) {
            matchedSession = sess;
            matchedMember = m;
            break;
          }
        }
        if (matchedMember) break;
      }

      if (matchedSession && matchedMember) {
        const expectedPin = (matchedMember.accessPin || "").trim();
        if (expectedPin && passwordInput.trim() && passwordInput.trim() !== expectedPin) {
          setErrorMsg(`PIN incorrecto para ${matchedMember.name}.`);
          return;
        }
        const sessionToLogin: LicenseSession = {
          ...matchedSession,
          activeMemberId: matchedMember.id,
        };
        persistSessionCredentials(matchedMember.email || rawEmail, passwordInput, sessionToLogin);
        onLogin(sessionToLogin);
        return;
      }

      // Not found
      setErrorMsg(
        `No se encontró ninguna cuenta registrada con el correo "${rawEmail}". Verifique que su correo coincida con el registrado en su equipo o entidad.`
      );
    } catch (err: any) {
      console.error("Email login error:", err);
      setErrorMsg("Error al conectar con el servidor. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated Collaborator PIN direct submit
  const handleCollabPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const query = collabEmail.trim();
    if (!query) {
      setErrorMsg("Ingrese el correo electrónico del colaborador.");
      return;
    }

    setIsSubmitting(true);
    try {
      let allSessions = [...availableSessions];
      try {
        const cloudLicenses = await fetchFirebaseLicenses();
        const map = new Map<string, LicenseSession>();
        allSessions.forEach((s) => map.set(s.licenseKey.toUpperCase(), s));
        cloudLicenses.forEach((s) => {
          const key = s.licenseKey.toUpperCase();
          const existing = map.get(key);
          map.set(key, mergeLicenseSessionWithExisting(existing, s));
        });
        allSessions = Array.from(map.values());
      } catch (e) {}

      let targetSession: LicenseSession | null = null;
      let targetMember: TeamMember | null = null;
      const cleanQuery = query.toLowerCase();

      for (const sess of allSessions) {
        if (!sess.teamMembers) continue;
        for (const m of sess.teamMembers) {
          if (
            (m.email && m.email.trim().toLowerCase() === cleanQuery) ||
            m.name.toLowerCase().includes(cleanQuery)
          ) {
            targetSession = sess;
            targetMember = m;
            break;
          }
        }
        if (targetMember) break;
      }

      if (!targetSession || !targetMember) {
        setErrorMsg(
          `No se encontró ningún colaborador con el correo "${query}". Verifique con su Titular o seleccione su Entidad abajo.`
        );
        return;
      }

      const expectedPin = (targetMember.accessPin || "").trim();
      if (expectedPin && collabPin.trim() !== expectedPin) {
        setErrorMsg(`El PIN de acceso es incorrecto para ${targetMember.name}.`);
        return;
      }

      const sessionToLogin: LicenseSession = {
        ...targetSession,
        activeMemberId: targetMember.id,
      };

      if (rememberSession) {
        localStorage.setItem("osce_keep_session_active", "true");
        localStorage.setItem("osce_saved_collab_email", query);
        localStorage.setItem("osce_saved_collab_pin", collabPin.trim());
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(sessionToLogin));
      }

      onLogin(sessionToLogin);
    } catch (err: any) {
      console.error("Collab pin submit error:", err);
      setErrorMsg("Error al autenticar el colaborador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit PIN for member chosen via entity list
  const handleEntityMemberPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedLicense || !selectedMember) return;

    setEntityMemberPinError(null);
    const expectedPin = (selectedMember.accessPin || "").trim();
    if (expectedPin && entityMemberPin.trim() !== expectedPin) {
      setEntityMemberPinError(`El PIN de acceso es incorrecto para ${selectedMember.name}.`);
      return;
    }

    const sessionToLogin: LicenseSession = {
      ...validatedLicense,
      activeMemberId: selectedMember.id,
    };

    if (rememberSession) {
      localStorage.setItem("osce_keep_session_active", "true");
      if (selectedMember.email) {
        localStorage.setItem("osce_saved_login_email", selectedMember.email);
        localStorage.setItem("osce_saved_login_pin", entityMemberPin.trim());
      }
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(sessionToLogin));
    }

    onLogin(sessionToLogin);
  };

  const handleEnterAsTitular = () => {
    if (!validatedLicense) return;
    const sessionToLogin: LicenseSession = {
      ...validatedLicense,
      activeMemberId: undefined,
    };
    if (rememberSession) {
      localStorage.setItem("osce_keep_session_active", "true");
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(sessionToLogin));
    }
    onLogin(sessionToLogin);
  };

  const getEntityIcon = (entityType?: EntityType) => {
    switch (entityType) {
      case "municipalidad":
      case "gobierno_regional":
      case "ministerio":
        return <Building2 className="w-5 h-5 text-blue-500" />;
      case "empresa":
      case "consorcio":
        return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case "consultor_supervisor":
        return <HardHat className="w-5 h-5 text-emerald-500" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-500" />;
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 shadow-md text-base">
              MGC
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                METAGESTIONCHECK
              </h2>
              <p className="text-xs text-amber-400 font-medium">
                Sistema de Control de Obras & Seguimiento de Cartera
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Inicio de sesión seguro • Solo tu correo y PIN de acceso</span>
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
                    RUC: {validatedLicense.ruc}
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
                    {validatedLicense.teamMembers?.length || 0} Miembros
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {/* Titular Workspace Option */}
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
                          {validatedLicense.userEmail} • Control global
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
                  </button>

                  {/* Collaborators List */}
                  {validatedLicense.teamMembers?.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(member);
                        setEntityMemberPin("");
                        setEntityMemberPinError(null);
                      }}
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
                            {member.email || member.cargoText}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        {member.accessPin && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
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
              <form onSubmit={handleEntityMemberPinSubmit} className="space-y-4 animate-in fade-in zoom-in-95">
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

                {entityMemberPinError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{entityMemberPinError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ingrese su PIN de Acceso (4 a 6 dígitos)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showEntityMemberPin ? "text" : "password"}
                      id="entity-member-pin"
                      name="password"
                      autoComplete="current-password"
                      placeholder="****"
                      maxLength={6}
                      value={entityMemberPin}
                      onChange={(e) => {
                        setEntityMemberPin(e.target.value);
                        setEntityMemberPinError(null);
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowEntityMemberPin(!showEntityMemberPin)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showEntityMemberPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          /* Normal Login View: ONLY 2 TABS (Acceso con Correo & Colaborador PIN) */
          <>
            {/* Tabs Bar: No Solicitar, No Clave de Licencia */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("email");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 text-center transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  activeTab === "email"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Acceso con Correo</span>
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
                <span>Colaborador (PIN)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {activeTab === "email" ? (
                /* Tab 1: Acceso rápido con Correo (Autocompletado del navegador + PIN/Password) */
                <div className="space-y-4">
                  {/* Google One-Click Login */}
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
                          ? "Verificando con Google..."
                          : "Continuar con Google"}
                      </span>
                    </button>
                    <div className="flex items-center my-3.5">
                      <div className="flex-1 border-t border-slate-200"></div>
                      <span className="px-3 text-[10px] text-slate-400 uppercase font-semibold">
                        o con tu correo institucional
                      </span>
                      <div className="flex-1 border-t border-slate-200"></div>
                    </div>
                  </div>

                  {/* Standard Fast Form with HTML Autocomplete */}
                  <form onSubmit={handleEmailLoginSubmit} autoComplete="on" className="space-y-3.5">
                    <div>
                      <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          id="login-email"
                          name="email"
                          type="email"
                          autoComplete="email username"
                          required
                          placeholder="tu.correo@institucion.gob.pe o correo@empresa.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        El navegador sugerirá automáticamente tu correo institucional o personal.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="login-password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          PIN de Acceso o Contraseña
                        </label>
                        <span className="text-[10px] text-slate-400">
                          (PIN 4-6 dígitos del equipo)
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          id="login-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Checkbox: Mantener sesión iniciada siempre */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberSession}
                          onChange={(e) => setRememberSession(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800">
                          Mantener sesión siempre iniciada
                        </span>
                      </label>
                      {emailInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmailInput("");
                            setPasswordInput("");
                            localStorage.removeItem("osce_saved_login_email");
                            localStorage.removeItem("osce_saved_login_pin");
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          Limpiar datos
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 -mt-1 leading-tight">
                      Solo ingresas tus credenciales la primera vez; luego el sistema conservará tu sesión abierta permanentemente.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer mt-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verificando credenciales...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Iniciar Sesión</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Quick Shortcut to Collaborator PIN */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-blue-950">¿Eres Colaborador o Ingeniero?</div>
                        <div className="text-[11px] text-blue-800 truncate">Ingresa con tu correo y PIN directo o por tu Entidad.</div>
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
                      <span>Ingreso PIN</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preloaded Demo Accounts Quick Info for Instant Testing */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Cuentas de demostración disponibles:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-[10px] font-mono text-slate-600">
                      <div>• Admin Master: <strong>admin@osce.gob.pe</strong> (PIN: 2026)</div>
                      <div>• Muni Rioja Titular: <strong>infraestructura@munirioja.gob.pe</strong> (PIN: 1122)</div>
                      <div>• Muni Rioja OEI (Pilco): <strong>jpilco@munirioja.gob.pe</strong> (PIN: 1234)</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Colaborador (PIN) */
                <div className="space-y-4">
                  {/* Mode switch: Direct by Email vs Pick by Entity */}
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
                      Acceso Rápido con Correo y PIN
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
                    /* Direct Email + PIN Form (No DNI, No CIP) */
                    <form onSubmit={handleCollabPinSubmit} autoComplete="on" className="space-y-3.5 animate-in fade-in zoom-in-95">
                      <div>
                        <label htmlFor="collab-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Correo del Colaborador
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            id="collab-email"
                            name="email"
                            type="email"
                            autoComplete="email username"
                            required
                            placeholder="jpilco@munirioja.gob.pe o tu.correo@institucion.gob.pe"
                            value={collabEmail}
                            onChange={(e) => setCollabEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            autoFocus
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          El navegador sugerirá automáticamente tu correo habitual.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="collab-pin" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          PIN de Acceso Personal (4 a 6 dígitos)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            id="collab-pin"
                            name="password"
                            type={showCollabPin ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            placeholder="****"
                            maxLength={6}
                            value={collabPin}
                            onChange={(e) => setCollabPin(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-widest"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCollabPin(!showCollabPin)}
                            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showCollabPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PIN asignado por el Titular de tu entidad para tu mesa de trabajo.
                        </p>
                      </div>

                      {/* Checkbox Mantener sesión iniciada */}
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none pt-1">
                        <input
                          type="checkbox"
                          checked={rememberSession}
                          onChange={(e) => setRememberSession(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800">
                          Mantener sesión siempre iniciada en este dispositivo
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
                      >
                        {isSubmitting ? (
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
                              placeholder="Buscar entidad (ej: Rioja, Consorcio...)"
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
                                  sess.ruc.includes(q)
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
                                    setSelectedMember(member);
                                    setEntityMemberPin("");
                                    setEntityMemberPinError(null);
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
                                        {member.email || member.cargoText || member.role}
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
                    💡 <strong>Aislamiento de Trabajo:</strong> Cada colaborador ingresa a su propia mesa de trabajo limpia con sus permisos técnicos específicos (Residente, Supervisor, Especialista en Costos o Asistente).
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
