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
import { db, auth, handleFirestoreError, OperationType, isUserAdmin, ADMIN_EMAIL } from "../lib/firebase";
import { LicenseSession } from "../types/auth";

const USERS_COLLECTION = "users";
const LICENSES_COLLECTION = "licenses";

/**
 * Subscribe in real time to all licenses and registered users in Firebase Firestore.
 */
export function subscribeToFirebaseLicenses(
  onUpdate: (licenses: LicenseSession[]) => void,
  onError?: (err: any) => void
) {
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
        console.warn("Firestore onSnapshot error:", error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error("Error setting up Firestore listener:", error);
    return () => {};
  }
}

/**
 * Register a new user / license in Firebase Firestore
 */
export async function createFirebaseUserLicense(session: LicenseSession): Promise<void> {
  const docId = session.id || `lic-${Date.now()}`;
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
    handleFirestoreError(error, OperationType.WRITE, `${LICENSES_COLLECTION}/${docId}`);
  }
}

/**
 * Update user license status in Firebase Firestore
 */
export async function updateFirebaseLicenseStatus(
  id: string,
  newStatus: "active" | "suspended" | "expired"
): Promise<void> {
  try {
    const docRef = doc(db, LICENSES_COLLECTION, id);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
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
  try {
    const docRef = doc(db, LICENSES_COLLECTION, id);
    await updateDoc(docRef, {
      expiresAt: newExpiresAt,
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${LICENSES_COLLECTION}/${id}`);
  }
}

/**
 * Delete a user / license from Firebase Firestore
 */
export async function deleteFirebaseUserLicense(id: string): Promise<void> {
  try {
    const docRef = doc(db, LICENSES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${LICENSES_COLLECTION}/${id}`);
  }
}
