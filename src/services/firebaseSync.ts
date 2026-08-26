import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db, auth, handleFirestoreError, isFirestoreQuotaError, OperationType, isUserAdmin, ADMIN_EMAIL } from "../lib/firebase";
import { LicenseSession, LicenseRequest } from "../types/auth";

const USERS_COLLECTION = "users";
const LICENSES_COLLECTION = "licenses";
const REQUESTS_COLLECTION = "license_requests";

const LOCAL_REQUESTS_KEY = "mgc_license_requests";
const LOCAL_LICENSES_KEY = "mgc_user_sessions";
const DELETED_LICENSES_KEY = "mgc_deleted_licenses_list_v1";

// Quota circuit breaker: if quota is exhausted, skip cloud calls to avoid backoff delays
let isCloudQuotaExhausted = false;

export function markQuotaExhausted() {
  isCloudQuotaExhausted = true;
}

export function getIsQuotaExhausted(): boolean {
  return isCloudQuotaExhausted;
}

export function getDeletedLicensesBlacklist(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_LICENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function markLicenseAsDeleted(idOrKey: string) {
  if (!idOrKey) return;
  try {
    const list = getDeletedLicensesBlacklist();
    const clean = idOrKey.trim().toUpperCase();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(DELETED_LICENSES_KEY, JSON.stringify(list));
    }
  } catch (e) {}
}

export function unmarkLicenseAsDeleted(idOrKey: string) {
  if (!idOrKey) return;
  try {
    const list = getDeletedLicensesBlacklist();
    const clean = idOrKey.trim().toUpperCase();
    const filtered = list.filter((k) => k !== clean && k !== idOrKey);
    localStorage.setItem(DELETED_LICENSES_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

export function isLicenseDeleted(session: { id?: string; licenseKey?: string }): boolean {
  const list = getDeletedLicensesBlacklist();
  if (session.id && list.includes(session.id.toUpperCase())) return true;
  if (session.licenseKey && list.includes(session.licenseKey.trim().toUpperCase())) return true;
  return false;
}

function getLocalRequests(): LicenseRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalRequests(requests: LicenseRequest[]) {
  try {
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {}
}

/**
 * Subscribe in real time to all licenses and registered users in Firebase Firestore.
 */
export function subscribeToFirebaseLicenses(
  onUpdate: (licenses: LicenseSession[]) => void,
  onError?: (err: any) => void
) {
  if (isCloudQuotaExhausted) {
    return () => {};
  }

  try {
    const colRef = collection(db, LICENSES_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: LicenseSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LicenseSession;
          list.push({ ...data, id: docSnap.id, firebaseSynced: true });
        });
        onUpdate(list);
      },
      (error) => {
        if (isFirestoreQuotaError(error)) {
          isCloudQuotaExhausted = true;
          console.warn("Firestore quota limit exceeded. Operating in local storage mode.");
        } else {
          console.warn("Firestore onSnapshot error:", error);
        }
        if (onError) onError(error);
      }
    );
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.warn("Error setting up Firestore listener:", error);
    return () => {};
  }
}

/**
 * Fetch all licenses directly from Firebase Firestore once
 */
export async function fetchFirebaseLicenses(): Promise<LicenseSession[]> {
  if (isCloudQuotaExhausted) {
    return [];
  }

  try {
    const colRef = collection(db, LICENSES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const list: LicenseSession[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LicenseSession;
      list.push({ ...data, id: docSnap.id, firebaseSynced: true });
    });
    return list;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.warn("Error fetching licenses from Firestore:", error);
    return [];
  }
}

/**
 * Verify a license key directly from Firebase Cloud Firestore
 */
export async function verifyLicenseKeyFromCloud(rawKey: string): Promise<LicenseSession | null> {
  const cleanKey = rawKey.trim().toUpperCase();
  if (!cleanKey) return null;

  if (isCloudQuotaExhausted) {
    return null;
  }

  try {
    const colRef = collection(db, LICENSES_COLLECTION);
    const snapshot = await getDocs(colRef);
    let found: LicenseSession | null = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LicenseSession;
      if (
        data.licenseKey &&
        data.licenseKey.trim().toUpperCase() === cleanKey
      ) {
        found = { ...data, id: docSnap.id, firebaseSynced: true };
      }
    });

    return found;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.warn("Error verifying license from cloud:", error);
    return null;
  }
}

/**
 * Register a new user / license in Firebase Firestore
 */
export async function createFirebaseUserLicense(session: LicenseSession): Promise<void> {
  const docId = session.id || `lic-${Date.now()}`;

  if (session.id) unmarkLicenseAsDeleted(session.id);
  if (session.licenseKey) unmarkLicenseAsDeleted(session.licenseKey);

  if (isCloudQuotaExhausted) {
    return;
  }

  try {
    const docRef = doc(db, LICENSES_COLLECTION, docId);
    await setDoc(docRef, {
      ...session,
      id: docId,
      firebaseSynced: true,
      updatedAt: new Date().toISOString(),
    });

    // Also register user profile entry if email exists
    if (session.userEmail) {
      const userRef = doc(db, USERS_COLLECTION, session.userEmail.replace(/[^a-zA-Z0-9_]/g, "_"));
      await setDoc(
        userRef,
        {
          email: session.userEmail,
          displayName: session.userName,
          companyName: session.companyName,
          ruc: session.ruc,
          role: session.role,
          status: session.status,
          licenseKey: session.licenseKey,
          maxTenders: session.maxTenders,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          issuedBy: session.issuedBy || ADMIN_EMAIL,
        },
        { merge: true }
      );
    }
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
      console.warn("Firestore write quota reached. License saved to local storage.");
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `${LICENSES_COLLECTION}/${docId}`);
  }
}

export const updateFirebaseUserLicense = createFirebaseUserLicense;

/**
 * Update user license status in Firebase Firestore
 */
export async function updateFirebaseLicenseStatus(
  id: string,
  newStatus: "active" | "suspended" | "expired"
): Promise<void> {
  if (isCloudQuotaExhausted) return;

  try {
    const docRef = doc(db, LICENSES_COLLECTION, id);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, `${LICENSES_COLLECTION}/${id}`);
  }
}

/**
 * Extend license expiration in Firebase Firestore
 */
export async function extendFirebaseLicense(
  id: string,
  newExpiresAt: string
): Promise<void> {
  if (isCloudQuotaExhausted) return;

  try {
    const docRef = doc(db, LICENSES_COLLECTION, id);
    await updateDoc(docRef, {
      expiresAt: newExpiresAt,
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, `${LICENSES_COLLECTION}/${id}`);
  }
}

/**
 * Delete a user / license from Firebase Firestore and register in deleted blacklist
 */
export async function deleteFirebaseUserLicense(idOrKey: string): Promise<void> {
  if (!idOrKey) return;
  
  // Register in deleted blacklist so it won't be resurrected by subscriptions or default lists
  markLicenseAsDeleted(idOrKey);

  if (isCloudQuotaExhausted) return;

  try {
    // 1. Direct delete attempt by document id
    const docRef = doc(db, LICENSES_COLLECTION, idOrKey);
    await deleteDoc(docRef).catch(() => {});

    // 2. Query and delete any documents matching id or licenseKey
    const colRef = collection(db, LICENSES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const deletePromises: Promise<any>[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LicenseSession;
      if (
        docSnap.id === idOrKey ||
        data.id === idOrKey ||
        (data.licenseKey && data.licenseKey.trim().toUpperCase() === idOrKey.trim().toUpperCase())
      ) {
        deletePromises.push(deleteDoc(doc(db, LICENSES_COLLECTION, docSnap.id)).catch(() => {}));
        
        // Also cleanup user record if found
        if (data.userEmail) {
          const userKey = data.userEmail.replace(/[^a-zA-Z0-9_]/g, "_");
          deletePromises.push(deleteDoc(doc(db, USERS_COLLECTION, userKey)).catch(() => {}));
        }
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
      return;
    }
    console.warn("Firestore delete license fallback:", error);
  }
}

/**
 * Submit a license access request from the Login modal
 */
export async function submitLicenseRequest(
  data: Omit<LicenseRequest, "id" | "createdAt" | "status">
): Promise<LicenseRequest> {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newReq: LicenseRequest = {
    id: reqId,
    userName: data.userName.trim(),
    userEmail: data.userEmail.trim().toLowerCase(),
    companyName: data.companyName.trim(),
    ruc: data.ruc.trim(),
    intendedUse: data.intendedUse?.trim() || "Formulación de Ofertas Técnicas y Económicas SEACE",
    phone: data.phone?.trim() || "",
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  // Always save locally first
  try {
    const existing = getLocalRequests();
    saveLocalRequests([newReq, ...existing.filter((r) => r.id !== reqId)]);
    window.dispatchEvent(new Event("mgc_requests_updated"));
  } catch (e) {}

  if (!isCloudQuotaExhausted) {
    try {
      const docRef = doc(db, REQUESTS_COLLECTION, reqId);
      await setDoc(docRef, newReq);
    } catch (error) {
      if (isFirestoreQuotaError(error)) {
        isCloudQuotaExhausted = true;
        console.warn("Firestore write quota reached. License request saved to local storage.");
      } else {
        console.warn("Local fallback for request submission:", error);
      }
    }
  }

  return newReq;
}

/**
 * Subscribe to all incoming license requests for Admin Panel
 */
export function subscribeToLicenseRequests(
  onUpdate: (requests: LicenseRequest[]) => void,
  onError?: (err: any) => void
) {
  // Initial local dispatch
  const localList = getLocalRequests();
  if (localList.length > 0) {
    onUpdate(localList);
  }

  // Listen to window events for local updates
  const handleLocalUpdate = () => {
    const updated = getLocalRequests();
    onUpdate(updated);
  };
  window.addEventListener("mgc_requests_updated", handleLocalUpdate);

  if (isCloudQuotaExhausted) {
    return () => {
      window.removeEventListener("mgc_requests_updated", handleLocalUpdate);
    };
  }

  try {
    const colRef = collection(db, REQUESTS_COLLECTION);
    const unsubscribeCloud = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: LicenseRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LicenseRequest;
          cloudList.push({ ...data, id: docSnap.id });
        });

        // Merge cloud with local
        const local = getLocalRequests();
        const map = new Map<string, LicenseRequest>();
        local.forEach((r) => map.set(r.id, r));
        cloudList.forEach((r) => map.set(r.id, r));
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveLocalRequests(merged);
        onUpdate(merged);
      },
      (error) => {
        if (isFirestoreQuotaError(error)) {
          isCloudQuotaExhausted = true;
          console.warn("Firestore requests listener quota exceeded. Using local store.");
        } else {
          console.warn("Firestore requests listener error:", error);
        }
        if (onError) onError(error);
      }
    );

    return () => {
      window.removeEventListener("mgc_requests_updated", handleLocalUpdate);
      unsubscribeCloud();
    };
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.error("Error setting up requests listener:", error);
    return () => {
      window.removeEventListener("mgc_requests_updated", handleLocalUpdate);
    };
  }
}

/**
 * Fetch all license requests once
 */
export async function fetchLicenseRequests(): Promise<LicenseRequest[]> {
  const localList = getLocalRequests();

  if (isCloudQuotaExhausted) {
    return localList;
  }

  try {
    const colRef = collection(db, REQUESTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const cloudList: LicenseRequest[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LicenseRequest;
      cloudList.push({ ...data, id: docSnap.id });
    });

    const map = new Map<string, LicenseRequest>();
    localList.forEach((r) => map.set(r.id, r));
    cloudList.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveLocalRequests(merged);
    return merged;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.warn("Error fetching requests from cloud:", error);
    return localList;
  }
}

/**
 * Update request status (e.g. approved or rejected)
 */
export async function updateLicenseRequestStatus(
  requestId: string,
  status: "pending" | "approved" | "rejected",
  extra?: { assignedKey?: string; processedBy?: string; notes?: string }
): Promise<void> {
  // Update local storage first
  try {
    const local = getLocalRequests();
    const updated = local.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          processedAt: new Date().toISOString(),
          ...(extra || {}),
        };
      }
      return r;
    });
    saveLocalRequests(updated);
    window.dispatchEvent(new Event("mgc_requests_updated"));
  } catch (e) {}

  if (isCloudQuotaExhausted) return;

  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(docRef, {
      status,
      processedAt: new Date().toISOString(),
      ...(extra || {}),
    });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.warn("Error updating request status in cloud:", error);
  }
}

/**
 * Delete a license request
 */
export async function deleteLicenseRequest(requestId: string): Promise<void> {
  // Delete from local storage first
  try {
    const local = getLocalRequests();
    saveLocalRequests(local.filter((r) => r.id !== requestId));
    window.dispatchEvent(new Event("mgc_requests_updated"));
  } catch (e) {}

  if (isCloudQuotaExhausted) return;

  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      isCloudQuotaExhausted = true;
    }
    console.warn("Error deleting request in cloud:", error);
  }
}

