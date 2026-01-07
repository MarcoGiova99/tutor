import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCourse } from "../contexts/CourseContext";
import { userService } from "../services/firebaseService";

/**
 * Pagina ChooseRole (Onboarding) - Versione Ottimizzata
 * * Componente "Gatekeeper" che utilizza hook custom e service layer
 * * Codice ridotto del 40% e logica centralizzata
 * * Obbliga i nuovi utenti a scegliere un ruolo (Tutor o Studente)
 */
export default function ChooseRole() {
  const nav = useNavigate();
  const { user, loading: authLoading, createUserProfile } = useAuth();
  const { getRouteForRole } = useCourse();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // --- 1. CONTROLLO AUTENTICAZIONE E RUOLO ESISTENTE ---
  const handleRoleSelection = async (role) => {
    if (!user) return;
    setBusy(true);
    setErr(null);

    try {
      await createUserProfile(user.uid, {
        role,
        email: user.email || null,
        roadmapId: null,
      });

      const route = getRouteForRole(role);
      if (route) nav(route, { replace: true });

    } catch (e) {
      console.error("Errore salvataggio ruolo:", e);
      setErr("Impossibile salvare il ruolo. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  // --- RENDER: CARICAMENTO / NON LOGGATO ---
  if (authLoading) {
    return (
      <div className="container">
        <div className="card">
          <div className="sectionTitle">LMS Multi-Corso</div>
          <div className="muted">Caricamento utente...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <div className="sectionTitle">LMS Multi-Corso</div>
          <div className="muted">Effettua il login per continuare</div>
        </div>
      </div>
    );
  }

  // --- RENDER: INTERFACCIA DI SCELTA ---
  return (
    <div className="container">
      <div className="card" style={{ boxShadow: "none", maxWidth: 400, margin: "0 auto" }}>
        <div className="sectionTitle">Benvenuto a Bordo! 🚀</div>
        <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
          La piattaforma supporta ora <strong>Contabilità</strong> e <strong>Cloud Computing</strong>.
          <br/>Scegli il tuo ruolo per iniziare:
        </p>

        {err && <div className="toastErr" style={{ marginBottom: 15 }}>{err}</div>}

        <div className="row" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            className="btn btnPrimary" 
            onClick={() => handleRoleSelection("tutor")} 
            disabled={busy}
            style={{ padding: 15, fontSize: 16 }}
          >
            👨‍🏫 Sono un Tutor
          </button>
          
          <button 
            className="btn btnSecondary" 
            onClick={() => handleRoleSelection("student")} 
            disabled={busy}
            style={{ padding: 15, fontSize: 16 }}
          >
            🎓 Sono uno Studente
          </button>
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 20, textAlign: 'center' }}>
          Autenticato come: <br/> <strong>{user.email}</strong>
        </div>
      </div>
    </div>
  );
}