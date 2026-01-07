import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
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

  // --- CONTROLLO STATO E RUOLO ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Caso 1: Utente non loggato
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        // Caso 2: Utente loggato -> Recuperiamo il ruolo dal DB
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          setRole(snap.data().role); // "student", "tutor" o null
        } else {
          setRole(null); // Utente registrato ma senza ruolo (nuovo)
        }
      } catch (e) {
        console.error("Errore verifica permessi:", e);
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

  // --- RENDER: 2. NON AUTENTICATO ---
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- RENDER: 3. CONTROLLO RUOLO (Authorization) ---
  
  // Se l'utente non ha ancora un ruolo, DEVE andare a sceglierlo (tranne se siamo già lì, ma questa rotta protegge le dashboard)
  if (!role && allowedRole) {
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