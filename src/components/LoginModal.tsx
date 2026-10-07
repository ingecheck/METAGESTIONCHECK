import React, { useState } from "react";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import {
  LicenseSession,
  TeamMember,
  ADMIN_MASTER_EMAIL,
  INITIAL_DEFAULT_SESSIONS,
  ACTIVE_USER_STORAGE_KEY,
  mergeLicenseSessionWithExisting,
} from "../types/auth";
import { auth, googleProvider, isUserAdmin } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { fetchFirebaseLicenses } from "../services/firebaseSync";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (session: LicenseSession) => void;
  availableSessions: LicenseSession[];
  onRequestLicense?: (details: any) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  availableSessions,
}) => {
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
          setErrorMsg("Su cuenta ha expirado. El periodo de vigencia debe ser renovado.");
          return;
        }
        persistSessionCredentials(userEmail, "", matchedTitular);
        onLogin(matchedTitular);
        return;
      }

      // Not found in any entity
      setErrorMsg(
        `La cuenta ${userEmail} no está vinculada a ninguna entidad ni colaborador registrado.`
      );
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg("Error al conectar con Google: " + (err.message || "Intente nuevamente"));
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Main Email Direct Login Form (Solo Correo, sin requerir PIN)
  const handleEmailLoginSubmit = async (e?: React.FormEvent, directEmail?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const rawEmail = (directEmail !== undefined ? directEmail : emailInput).trim();
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
        persistSessionCredentials(cleanEmail, "", adminSession);
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

      // 3. Search for Collaborator by email (Acceso directo sin requerir PIN)
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

        const sessionToLogin: LicenseSession = {
          ...matchedSession,
          activeMemberId: matchedMember.id,
        };
        persistSessionCredentials(cleanEmail, "", sessionToLogin);
        onLogin(sessionToLogin);
        return;
      }

      // 4. Search for Titular by userEmail (Acceso directo sin requerir PIN)
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

        persistSessionCredentials(cleanEmail, "", matchedTitular);
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
        const sessionToLogin: LicenseSession = {
          ...matchedSession,
          activeMemberId: matchedMember.id,
        };
        persistSessionCredentials(matchedMember.email || rawEmail, "", sessionToLogin);
        onLogin(sessionToLogin);
        return;
      }

      setErrorMsg(
        "No encontramos ninguna cuenta o colaborador registrado con ese correo. Verifique su dirección o contacte a su administrador."
      );
    } catch (err: any) {
      setErrorMsg("Ocurrió un error al procesar el ingreso: " + (err.message || "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
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
            <span>Acceso al Sistema • Solo tu correo electrónico (sin PIN ni contraseñas)</span>
          </div>
        </div>

        {/* Modal Body: Acceso directo exclusivo con correo */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Formulario de Acceso Directo Exclusivo con Correo Electrónico */}
          <form onSubmit={handleEmailLoginSubmit} autoComplete="on" className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico de Acceso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email username"
                  required
                  placeholder="tu.correo@institucion.gob.pe o correo@empresa.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Acceso directo para Titular o Colaborador: digita tu correo y accede de inmediato.</span>
              </p>
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
                  Recordar mi acceso en este equipo
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
                  Limpiar correo
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando correo y accediendo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
