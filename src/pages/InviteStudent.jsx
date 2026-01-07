import { useMemo, useState } from "react";
import { 
  collection, 
  getDocs, 
  getDoc, // Aggiunto per leggere il roadmapId
  limit, 
  query, 
  updateDoc, 
  where, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Componente InviteStudent
 * * Permette al Tutor di collegare un account utente reale (Auth) a un documento Studente (DB).
 * * Aggiornato per sincronizzare anche il corso (roadmapId) nel profilo utente.
 */
export default function InviteStudent({ studentId }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, msg: null });

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleLinkStudent = async () => {
    if (!studentId) return;
    if (!cleanEmail) {
      setFeedback({ type: "error", msg: "Inserisci un indirizzo email." });
      return;
    }

    setBusy(true);
    setFeedback({ type: null, msg: null });

    try {
      // 1. CERCHIAMO L'UTENTE NEL DB
      const q = query(
        collection(db, "users"),
        where("email", "==", cleanEmail),
        where("role", "==", "student"),
        limit(1)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setFeedback({ 
            type: "error", 
            msg: "Nessun account 'Studente' trovato con questa email. Assicurati che l'utente si sia registrato." 
        });
        return;
      }

      // 2. RECUPERIAMO DATI UTENTE E STUDENTE
      const targetUserDoc = snap.docs[0];
      const realStudentUid = targetUserDoc.id;

      // Leggiamo il documento studente (creato dal Tutor) per sapere che corso gli è stato assegnato
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        throw new Error("Documento studente non trovato");
      }
      
      // Default 'accounting' per retrocompatibilità
      const assignedRoadmapId = studentSnap.data().roadmapId || 'accounting';

      // 3. AGGIORNIAMO IL DOCUMENTO STUDENTE (Link UID)
      await updateDoc(studentRef, {
        studentUid: realStudentUid,
        linkedAt: serverTimestamp(),
      });

      // 4. AGGIORNIAMO IL DOCUMENTO UTENTE (Sync Corso)
      // È importante che anche il documento 'users' sappia quale corso sta seguendo l'utente
      // (utile per ChooseRole, redirect e permessi)
      const userRef = doc(db, "users", realStudentUid);
      await updateDoc(userRef, {
        roadmapId: assignedRoadmapId
      });

      // Feedback Dinamico
      const courseLabel = assignedRoadmapId === 'cloud' ? "Cloud Computing" : "Contabilità";
      setEmail("");
      setFeedback({ type: "success", msg: `✅ Utente collegato con successo al corso ${courseLabel}!` });

    } catch (e) {
      console.error("Errore link studente:", e);
      setFeedback({ type: "error", msg: "Errore tecnico durante il collegamento." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="sectionTitle">Invita / Collega studente</div>
      <p className="muted" style={{ marginTop: 0 }}>
        Inserisci l'email con cui lo studente si è registrato all'app per assegnargli il corso.
      </p>

      {feedback.msg && (
          <div 
            className="toastErr" 
            style={{ 
                borderColor: feedback.type === 'success' ? '#10b981' : 'var(--border)', 
                background: feedback.type === 'success' ? '#ecfdf5' : 'rgba(15,23,42,0.03)', 
                color: feedback.type === 'success' ? '#064e3b' : 'var(--text)' 
            }}
          >
            {feedback.msg}
          </div>
      )}

      <div className="row" style={{ marginTop: 10 }}>
        <input
          className="input"
          placeholder="Email studente (es. mario.rossi@gmail.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
        <button className="btn btnPrimary" onClick={handleLinkStudent} disabled={busy}>
          {busy ? "Collego..." : "Collega"}
        </button>
      </div>
    </div>
  );
}