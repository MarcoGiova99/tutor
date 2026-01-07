import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

/**
 * Pagina Login / Registrazione
 * * Gestisce l'accesso alla piattaforma LMS.
 * * Funziona da "Hub Centrale" per smistare Utenti (Tutor) e Studenti nelle rispettive dashboard.
 * * Aggiornato per supportare il flusso ibrido (Contabilità/Cloud).
 */
export default function Login() {
  // --- STATO DEL FORM ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Toggle: false = Login, true = Registrazione
  const [isRegistering, setIsRegistering] = useState(false);
  
  const navigate = useNavigate();

  // --- GESTIONE AUTENTICAZIONE ---
  const handleAuth = async (e) => {
    e.preventDefault(); 
    setError(null);
    setLoading(true);

    try {
      let user;

      if (isRegistering) {
        // --- CASO 1: NUOVA REGISTRAZIONE ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        
        // Creiamo il documento utente di base SENZA ruolo predefinito.
        // L'utente verrà reindirizzato a /choose-role per scegliere se è Tutor o Studente.
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: null, // Sarà 'tutor' o 'student' dopo il ChooseRole
          roadmapId: null,
          createdAt: serverTimestamp()
        });
      } else {
        // --- CASO 2: LOGIN ESISTENTE ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }

      // --- LOGICA DI REINDIRIZZAMENTO (Routing Hub) ---
      
      // 1. Verifichiamo se è uno STUDENTE COLLEGATO (Priorità alta)
      // Se il suo UID è presente in un documento della collezione 'students', è sicuramente uno studente attivo.
      const qStudent = query(collection(db, "students"), where("studentUid", "==", user.uid), limit(1));
      const snapStudent = await getDocs(qStudent);

      if (!snapStudent.empty) {
        navigate("/student/dashboard"); // Dashboard Studente
        return;
      }

      // 2. Verifichiamo il RUOLO nel documento 'users'
      // Se non è collegato come studente, controlliamo il suo profilo utente.
      const userRef = doc(db, "users", user.uid);
      const snapUser = await getDoc(userRef);
      
      if (snapUser.exists()) {
        const userData = snapUser.data();
        
        if (userData.role === "tutor") {
          navigate("/"); // Dashboard Tutor
          return;
        } 
        
        if (userData.role === "student") {
          // Caso raro: ha il ruolo ma non è ancora stato collegato dal tutor.
          // Lo mandiamo comunque alla dashboard studente (che mostrerà uno stato "in attesa").
          navigate("/student/dashboard");
          return;
        }
      }

      // 3. FALLBACK: NESSUN RUOLO
      // Se siamo qui, l'utente è registrato ma non ha un ruolo o un collegamento.
      navigate("/choose-role");

    } catch (err) {
      console.error("Errore Autenticazione:", err);
      
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Credenziali non valide.");
          break;
        case "auth/email-already-in-use":
          setError("Email già registrata.");
          break;
        case "auth/weak-password":
          setError("Password troppo debole (min 6 caratteri).");
          break;
        default:
          setError("Errore di connessione. Riprova.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 40, borderTop: "4px solid var(--accent)" }}>
        
        {/* HEADER */}
        <h1 style={{ textAlign: "center", marginTop: 0, fontSize: 28 }}>
          {isRegistering ? "Crea Account" : "Bentornata 👋"}
        </h1>
        <p className="muted" style={{ textAlign: "center", marginBottom: 30 }}>
          {isRegistering ? "Unisciti alla piattaforma LMS" : "Accedi per continuare i tuoi studi"}
        </p>

        {/* FORM */}
        <form onSubmit={handleAuth}>
          <div className="field">
            <label style={{fontWeight: 700, fontSize: 12, color: "var(--text-light)"}}>EMAIL</label>
            <input 
              className="input" 
              type="email" 
              placeholder="nome@esempio.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label style={{fontWeight: 700, fontSize: 12, color: "var(--text-light)"}}>PASSWORD</label>
            <input 
              className="input" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* BOX ERRORI */}
          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* BOTTONE AZIONE */}
          <button 
            type="submit" 
            className="btn btnPrimary" 
            style={{ width: "100%", padding: 14, fontSize: 16, marginTop: 10 }}
            disabled={loading}
          >
            {loading ? "Caricamento..." : (isRegistering ? "Registrati Ora" : "Accedi")}
          </button>
        </form>

        {/* FOOTER / TOGGLE */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          {isRegistering ? "Hai già un account? " : "Non hai un account? "}
          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--accent)", 
              fontWeight: "bold", 
              cursor: "pointer", 
              textDecoration: "underline",
              fontSize: 14
            }}
          >
            {isRegistering ? "Fai Login" : "Registrati qui"}
          </button>
        </div>

      </div>
    </div>
  );
}