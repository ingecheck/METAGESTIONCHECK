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
} from "lucide-react";
import { LicenseSession, ADMIN_MASTER_EMAIL, INITIAL_DEFAULT_SESSIONS } from "../types/auth";
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
  const [activeTab, setActiveTab] = useState<"login" | "request">("login");
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

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
        onLogin({ ...matched, userId: user.uid, firebaseSynced: true });
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

      // Success login into user's isolated workspace
      onLogin(foundSession);
    } catch (err: any) {
      console.error("License validation error:", err);
      setErrorMsg("Error al conectar con el servidor para validar la licencia.");
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md text-lg">
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

          <div className="mt-4 flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Acceso estrictamente restringido a usuarios con licencia</span>
          </div>
        </div>

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
            <span>Ingresar con Licencia</span>
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
            <span>Solicitar Licencia</span>
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
                    Clave de Licencia del Postor
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Ej: LIC-ANDINA-2026-PRO"
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ingrese la clave otorgada por el Administrador al registrar su empresa.
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
                  El Administrador Principal (<strong>{ADMIN_MASTER_EMAIL}</strong>) ha recibido su solicitud en su Panel de Control. Una vez aprobada, le entregará su <strong>Clave de Licencia oficial</strong> para que pueda ingresar de inmediato.
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
      </div>
    </div>
  );
};
