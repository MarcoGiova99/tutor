import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function ensureUserDoc(u) {
  if (!u?.uid) return;

  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  const email = (u.email || "").toLowerCase();

  // CASO 1: L'utente non esiste nel DB (Primo Login)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      email,
      role: null, // <- Verrà scelto in /choose-role o assegnato manualmente
      
      // MODIFICA: Inizializzazione del campo corso.
      // Questo campo supporterà 'accounting' (Contabilità) o 'cloud' (Cloud Computing).
      // Lo impostiamo a null inizialmente; verrà popolato quando lo studente viene collegato.
      roadmapId: null, 
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // CASO 2: L'utente esiste, controlliamo se dobbiamo aggiornare l'email
  const data = snap.data() || {};
  if (email && data.email !== email) {
    await setDoc(ref, { email, updatedAt: serverTimestamp() }, { merge: true });
  }
}