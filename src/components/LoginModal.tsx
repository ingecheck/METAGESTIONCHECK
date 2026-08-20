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
} from "lucide-react";
import { LicenseSession, ADMIN_MASTER_EMAIL } from "../types/auth";
import { auth, googleProvider, isUserAdmin } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (session: LicenseSession) => void;
  availableSessions: LicenseSession[];
  onRequestLicense: (details: { name: string; email: string; company: string; ruc: string }) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  availableSessions,
  onRequestLicense,
  onClose,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRequestModal, setIsRequestModal] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Form for requesting license from Admin
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqCompany, setReqCompany] = useState("");
  const [reqRuc, setReqRuc] = useState("");
  const [reqSuccess, setReqSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoadingGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = user.email || "";

      // Check if user is the Master Admin
      if (isUserAdmin(userEmail)) {
        const adminSession: LicenseSession = {
          id: `admin-${user.uid}`,
          userId: user.uid,
          userName: user.displayName || "Administrador Principal",
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
          issuedBy: "Firebase Master Auth",
          notes: "Autenticado con Google como Administrador Principal de Firebase.",
          firebaseSynced: true,
        };
        onLogin(adminSession);
        return;
      }

      // Check if there is an existing license for this email in availableSessions
      const matched = availableSessions.find(
        (s) => s.userEmail.toLowerCase() === userEmail.toLowerCase()
      );

      if (matched) {
        if (matched.status === "suspended") {
          setErrorMsg("Su cuenta se encuentra suspendida. Contacte al administrador.");
          return;
        }
        onLogin({ ...matched, userId: user.uid });
      } else {
        // User logged in with Google but not yet registered with a license
        const newPostorSession: LicenseSession = {
          id: `user-${user.uid}`,
          userId: user.uid,
          userName: user.displayName || userEmail.split("@")[0],
          userEmail: userEmail,
          companyName: "POSTOR EN PROCESO DE REGISTRO",
          ruc: "20000000000",
          licenseKey: `LIC-GOOG-${user.uid.substring(0, 6).toUpperCase()}`,
          role: "postor",
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          maxTenders: 10,
          currentTendersCount: 0,
          issuedBy: ADMIN_MASTER_EMAIL,
          firebaseSynced: true,
        };
        onLogin(newPostorSession);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(err.message || "Error al iniciar sesión con Google.");
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedKey = licenseKeyInput.trim();

    if (!trimmedKey) {
      setErrorMsg("Ingrese su Clave de Licencia otorgada por el Administrador.");
      return;
    }

    // Match session by license key
    const foundSession = availableSessions.find(
      (s) => s.licenseKey.toLowerCase() === trimmedKey.toLowerCase()
    );

    if (!foundSession) {
      setErrorMsg("Clave de licencia no encontrada o inválida. Verifique con el Administrador.");
      return;
    }

    if (foundSession.status === "suspended") {
      setErrorMsg("Esta licencia ha sido suspendida por el Administrador. Comuníquese para reactivarla.");
      return;
    }

    if (foundSession.status === "expired") {
      setErrorMsg("Esta licencia ha expirado. El Administrador debe renovar el plazo.");
      return;
    }

    // Success login
    onLogin(foundSession);
  };

  const handleQuickLogin = (session: LicenseSession) => {
    onLogin(session);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqEmail || !reqCompany || !reqRuc) {
      setErrorMsg("Por favor complete todos los campos de solicitud.");
      return;
    }
    onRequestLicense({
      name: reqName,
      email: reqEmail,
      company: reqCompany,
      ruc: reqRuc,
    });
    setReqSuccess(true);
    setTimeout(() => {
      setReqSuccess(false);
      setIsRequestModal(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              MGC
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Acceso a METAGESTIONCHECK
              </h2>
              <p className="text-xs text-slate-400">
                Suite de Licitaciones SEACE & Control de Obras Públicas
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!isRequestModal ? (
            <>
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* 1. Google Sign-In Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoadingGoogle}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2.5 shadow-xs transition hover:border-slate-400 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      ? "Conectando con Google..."
                      : "Iniciar Sesión con Google (Firebase Auth)"}
                  </span>
                </button>
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-slate-200"></div>
                  <span className="px-3 text-[11px] text-slate-400 uppercase font-semibold">
                    o con clave de licencia
                  </span>
                  <div className="flex-1 border-t border-slate-200"></div>
                </div>
              </div>

              {/* 2. License Key Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clave de Licencia del Postor / Administrador
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Ej: ADMIN-OSCE-MASTER-2026 o LIC-ANDINA-2026-PRO"
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Validar Licencia e Ingresar</span>
                </button>
              </form>

              {/* Quick Access Profiles */}
              {availableSessions.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Cuentas Disponibles</span>
                    <span className="text-blue-600 font-semibold">Seleccionar</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableSessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => handleQuickLogin(sess)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between hover:scale-[1.01] ${
                          sess.role === "admin"
                            ? "border-amber-300 bg-amber-50/60 hover:bg-amber-100/70"
                            : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              sess.role === "admin"
                                ? "bg-amber-600 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {sess.role === "admin" ? "ADM" : "POST"}
                          </div>
                          <div className="truncate text-left">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {sess.userName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              {sess.licenseKey} • {sess.companyName || sess.userEmail}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-blue-600 font-semibold flex items-center ml-2 shrink-0">
                          Entrar <ArrowRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-center flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsRequestModal(true)}
                  className="text-xs text-slate-600 hover:text-blue-600 font-medium underline cursor-pointer"
                >
                  Solicitar registro de licencia
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                  >
                    Continuar como invitado
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Request new license form */
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-1">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Solicitud de Nueva Licencia de Postor</span>
              </div>
              <p className="text-xs text-slate-500">
                Llene los datos de su empresa para que el Administrador ({ADMIN_MASTER_EMAIL}) active su clave en Firebase:
              </p>

              {reqSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Solicitud enviada al Administrador con éxito!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Responsable / Ingeniero
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ing. Jorge Ramirez"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="correo@empresa.pe"
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Empresa S.A.C."
                    value={reqCompany}
                    onChange={(e) => setReqCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RUC (11 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="2060..."
                    value={reqRuc}
                    onChange={(e) => setReqRuc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRequestModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Enviar al Administrador
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
