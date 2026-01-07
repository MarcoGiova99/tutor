import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/**
 * StudentLayout Component
 * * Layout principale per l'area Studente.
 * * Aggiornato per adattarsi al contesto del corso (Contabilità o Cloud).
 */
export default function StudentLayout() {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState("accounting"); // Default
  const [loading, setLoading] = useState(true);

  // --- 1. RECUPERO CONTESTO CORSO ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Cerchiamo il documento studente per leggere il roadmapId
        const q = query(
          collection(db, "students"),
          where("studentUid", "==", user.uid),
          limit(1)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setCourseId(data.roadmapId || "accounting");
        }
      } catch (e) {
        console.error("Errore layout:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // --- 2. LOGOUT ---
  const handleLogout = async () => {
    try {
        await signOut(auth);
        navigate("/login");
    } catch (error) {
        console.error("Errore logout:", error);
    }
  };

  // --- 3. THEME HELPERS ---
  const isCloud = courseId === 'cloud';
  const themeColor = isCloud ? '#2563eb' : '#10b981'; // Blu vs Verde (Student Theme)
  const courseLabel = isCloud ? 'CLOUD CMP' : 'CONTABILITÀ';
  const courseIcon = isCloud ? '☁️' : '🎓';

  // Stile dinamico per i link attivi
  const getLinkStyle = ({ isActive }) => ({
    color: isActive ? themeColor : 'var(--muted)',
    borderBottom: isActive ? `2px solid ${themeColor}` : '2px solid transparent',
    fontWeight: isActive ? 700 : 500,
    padding: '10px 4px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontSize: '14px'
  });

  return (
    <div className="layout-wrapper" style={{ minHeight: "100vh", paddingBottom: 40, background: "#f8fafc" }}>
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          
          {/* Brand / Logo Dinamico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{courseIcon}</span>
            <span style={{ 
                fontSize: 12, fontWeight: 900, letterSpacing: 1, 
                color: themeColor, textTransform: 'uppercase' 
            }}>
              {courseLabel}
            </span>
          </div>

          {/* Menu di Navigazione (Tabs) */}
          <div style={{ display: 'flex', gap: 24 }}>
            <NavLink to="/student/dashboard" style={getLinkStyle}>
              Dashboard
            </NavLink>
            
            <NavLink to="/student/materials" style={getLinkStyle}>
              Materiali
            </NavLink>
            
            <NavLink to="/student/practice" style={getLinkStyle}>
              Esercizi
            </NavLink>
          </div>

          {/* Pulsante Logout */}
          <button 
            onClick={handleLogout} 
            className="btn btnGhost" 
            style={{ padding: "6px 12px", fontSize: 12, color: "#64748b" }}
            title="Disconnetti account"
          >
            Esci 
          </button>
        </div>
      </div>

      {/* --- CONTENUTO DINAMICO --- */}
      <div style={{ paddingTop: 20 }}>
        <Outlet />
      </div>
      
    </div>
  );
}