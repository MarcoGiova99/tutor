import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/**
 * ProtectedRoute (Guardia di Sicurezza)
 * * Componente "Wrapper" che protegge le rotte sensibili.
 * * Aggiornato per gestire il routing ibrido e la pagina di scelta ruolo.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permError, setPermError] = useState(null);

  // --- CONTROLLO STATO E RUOLO ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Caso 1: Utente non loggato
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        setPermError(null);
        return;
      }

      setUser(currentUser);
      setPermError(null);

      try {
        // Caso 2: Utente loggato -> Recuperiamo il ruolo dal DB
        const ref = doc(db, "users", currentUser.uid);
        const FIRESTORE_ROLE_TIMEOUT_MS = 7000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firestore role timeout")), FIRESTORE_ROLE_TIMEOUT_MS)
        );

        const snap = await Promise.race([getDoc(ref), timeoutPromise]);
        
        if (snap.exists()) {
          setRole(snap.data().role); // "student", "tutor" o null
        } else {
          setRole(null); // Utente registrato ma senza ruolo (nuovo)
        }
      } catch (e) {
        console.error("Errore verifica permessi:", e);
        setRole(null);
        setPermError("Connessione a Firebase non disponibile. Riprova tra qualche secondo.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- RENDER: 1. STATO DI CARICAMENTO ---
  if (loading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        color: "#64748b", 
        fontSize: "1.2rem",
        fontWeight: 500
      }}>
        Verifica permessi in corso...
      </div>
    );
  }

  if (permError) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          maxWidth: 520,
          width: "100%",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
          background: "#fff",
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            Problema di connessione a Firebase
          </div>
          <div style={{ color: "#475569", marginBottom: 16 }}>
            {permError}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: "#0ea5e9",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Riprova
            </button>
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                } finally {
                  window.location.href = "/login";
                }
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Esci
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: 2. NON AUTENTICATO ---
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- RENDER: 3. CONTROLLO RUOLO (Authorization) ---
  
  // Se l'utente non ha ancora un ruolo, DEVE andare a sceglierlo (tranne se siamo già lì, ma questa rotta protegge le dashboard)
  if (!role && allowedRole && !permError) {
    return <Navigate to="/choose-role" replace />;
  }

  // Se la rotta richiede un ruolo specifico e l'utente ne ha uno diverso:
  if (allowedRole && role !== allowedRole) {
    
    // Se sei uno Studente che prova ad accedere area Tutor -> Vai a Student Home
    if (role === "student") {
      return <Navigate to="/student" replace />;
    }
    
    // Se sei un Tutor che prova ad accedere area Studente -> Vai a Tutor Dashboard
    if (role === "tutor") {
      return <Navigate to="/" replace />;
    }
    
    // Fallback di sicurezza
    return <Navigate to="/choose-role" replace />;
  }

  // --- RENDER: 4. ACCESSO CONSENTITO ---
  return children;
}