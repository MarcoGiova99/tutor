import { auth, db } from "./firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

/**
 * getMyStudentId
 * * Helper asincrono per recuperare l'ID del documento Firestore della collezione 'students'
 * * associato all'utente attualmente autenticato.
 * * * ARCHITETTURA IBRIDA:
 * L'ID restituito punta al documento studente che contiene:
 * 1. Il campo 'roadmapId' ('accounting' o 'cloud') che determina il corso attivo.
 * 2. L'array 'seenQuestions' e i progressi (per entrambi i corsi).
 * * * @returns {Promise<string|null>} L'ID del documento studente (es. "7f8a9...") o null.
 */
export async function getMyStudentId() {
  const uid = auth.currentUser?.uid;
  
  // Se l'utente non è loggato, non possiamo cercare nulla
  if (!uid) return null;

  try {
    // Cerchiamo nella collezione 'students' il documento collegato a questo UID
    // Nota: Si presuppone che un utente abbia un solo profilo studente attivo per volta.
    const q = query(
      collection(db, "students"),
      where("studentUid", "==", uid),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) return null;

    // Restituiamo l'ID del documento trovato
    return snap.docs[0].id;
    
  } catch (error) {
    console.error("Errore recupero Student ID:", error);
    return null;
  }
}