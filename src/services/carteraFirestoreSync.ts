import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, isFirestoreQuotaError, OperationType } from "../lib/firebase";
import { ProyectoCartera } from "../types/seguimientoCartera";

const CARTERA_COLLECTION = "cartera_obras";

export interface CarteraSyncPayload {
  entityId: string;
  proyectos: ProyectoCartera[];
  lastUpdated: string;
  updatedBy: string;
  updatedByEmail?: string;
  source: "excel_upload" | "manual_edit" | "checklist_sync" | "encargado_change" | "estado_change" | "delete_obra";
}

/**
 * Clean data to prevent Firestore errors on `undefined` fields
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Save the entire portfolio for an entity to Firestore.
 * Triggers real-time onSnapshot listeners for all connected team members of that municipality.
 */
export async function saveCarteraToFirestore(
  entityId: string,
  proyectos: ProyectoCartera[],
  updatedByName: string,
  updatedByEmail?: string,
  source: "excel_upload" | "manual_edit" | "checklist_sync" | "encargado_change" | "estado_change" | "delete_obra" = "manual_edit"
): Promise<boolean> {
  const cleanKey = entityId.trim().toUpperCase() || "DEFAULT_ENTITY";
  const docRef = doc(db, CARTERA_COLLECTION, cleanKey);

  const payload: CarteraSyncPayload = {
    entityId: cleanKey,
    proyectos: sanitizeForFirestore(proyectos),
    lastUpdated: new Date().toISOString(),
    updatedBy: updatedByName || "Usuario Municipal",
    updatedByEmail: updatedByEmail || "",
    source,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    // Also update local storage as immediate fallback cache
    try {
      localStorage.setItem(`mgc_cartera_${cleanKey.toLowerCase()}_proyectos_v4`, JSON.stringify(proyectos));
    } catch (e) {
      console.warn("Local storage cache write warning:", e);
    }
    return true;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      console.warn("Firestore quota reached. Saved locally in browser storage.");
      return false;
    }
    handleFirestoreError(error, OperationType.WRITE, `/${CARTERA_COLLECTION}/${cleanKey}`);
    return false;
  }
}

/**
 * One-time fetch of the entity's public works portfolio from Firestore
 */
export async function loadCarteraFromFirestore(
  entityId: string
): Promise<CarteraSyncPayload | null> {
  const cleanKey = entityId.trim().toUpperCase() || "DEFAULT_ENTITY";
  const docRef = doc(db, CARTERA_COLLECTION, cleanKey);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CarteraSyncPayload;
      if (Array.isArray(data.proyectos) && data.proyectos.length > 0) {
        return data;
      }
    }
    return null;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      return null;
    }
    console.warn(`Could not fetch cloud cartera for ${cleanKey}:`, error);
    return null;
  }
}

/**
 * Subscribe to real-time changes for a specific municipality / entity.
 * When Pilco, Luis, Jhon, or anyone in the municipality uploads an Excel or edits a project,
 * ALL other members currently logged into that entity receive the update instantly.
 * Other entities are completely isolated and never receive this listener's events.
 */
export function subscribeToCartera(
  entityId: string,
  onRemoteUpdate: (payload: CarteraSyncPayload) => void,
  onError?: (err: Error) => void
): () => void {
  const cleanKey = entityId.trim().toUpperCase() || "DEFAULT_ENTITY";
  const docRef = doc(db, CARTERA_COLLECTION, cleanKey);

  try {
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as CarteraSyncPayload;
        if (data && Array.isArray(data.proyectos)) {
          onRemoteUpdate(data);
        }
      },
      (error) => {
        if (!isFirestoreQuotaError(error)) {
          console.warn(`Real-time subscription error for entity ${cleanKey}:`, error);
          if (onError) onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn("Error setting up real-time listener:", e);
    return () => {};
  }
}
