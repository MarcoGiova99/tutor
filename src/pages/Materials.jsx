import { useEffect, useState, useMemo } from "react";
import { 
  collection, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, deleteDoc, serverTimestamp, where 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/**
 * Pagina Materials (Vista Studente)
 * * Mostra le risorse didattiche assegnate dal Tutor.
 * * Aggiornato per adattarsi al tema del corso (Contabilità o Cloud).
 */
export default function Materials() {
  const [studentId, setStudentId] = useState(null);
  const [courseId, setCourseId] = useState("accounting"); // 'accounting' o 'cloud'
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState({}); // Mappa ID -> true/false
  const [loading, setLoading] = useState(true);

  // --- 1. IDENTIFICAZIONE STUDENTE & CORSO ---
  useEffect(() => {
    const fetchStudentProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      try {
        const q = query(
          collection(db, "students"), 
          where("studentUid", "==", uid), 
          limit(1)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const docData = snap.docs[0];
          setStudentId(docData.id);
          // Recuperiamo il corso assegnato (fallback su 'accounting')
          setCourseId(docData.data().roadmapId || "accounting");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Errore recupero profilo:", error);
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, []);

  // --- 2. SINCRONIZZAZIONE DATI (REALTIME) ---
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);

    // A. Lista Materiali
    const qMaterials = query(
      collection(db, "students", studentId, "materials"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubMaterials = onSnapshot(qMaterials, (snap) => {
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // B. Stato Progressi
    const qProgress = query(collection(db, "students", studentId, "materialProgress"));
    
    const unsubProgress = onSnapshot(qProgress, (snap) => {
      const progressMap = {};
      snap.docs.forEach(d => { progressMap[d.id] = true; });
      setProgress(progressMap);
    });

    return () => { unsubMaterials(); unsubProgress(); };
  }, [studentId]);

  // --- 3. GESTIONE COMPLETAMENTO ---
  const toggleDone = async (m) => {
    if (!studentId) return;
    
    const isDone = !!progress[m.id];
    const ref = doc(db, "students", studentId, "materialProgress", m.id);
    
    try {
      if (isDone) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { 
            materialId: m.id, 
            doneAt: serverTimestamp() 
        });
      }
    } catch (error) {
      console.error("Errore aggiornamento stato:", error);
    }
  };

  // KPI
  const doneCount = useMemo(() => {
    return materials.filter(m => progress[m.id]).length;
  }, [materials, progress]);

  // --- THEME HELPERS ---
  const isCloud = courseId === 'cloud';
  const themeColor = isCloud ? '#2563eb' : '#991b1b'; // Blu o Rosso
  const themeBg = isCloud ? '#eff6ff' : '#fef2f2';

  // --- RENDER ---
  if (loading) return <div className="container muted" style={{paddingTop:40}}>Caricamento risorse...</div>;
  
  if (!studentId) {
    return (
        <div className="container toastErr" style={{marginTop: 40}}>
            Profilo studente non trovato. Chiedi al tuo Tutor di collegarti!
        </div>
    );
  }

  return (
    <div className="container">
      {/* HEADER */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="bigTitle" style={{ margin: 0 }}>Materiali Didattici</h1>
            {/* Badge Corso */}
            <span style={{ 
                fontSize: 10, fontWeight: 800, letterSpacing: 1,
                color: themeColor, background: themeBg,
                padding: '4px 8px', borderRadius: 6, border: `1px solid ${themeColor}`
            }}>
                {isCloud ? 'CLOUD COMPUTING' : 'CONTABILITÀ'}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Dispense e link condivisi dal tuo tutor.
          </p>
        </div>
        
        {/* Progress Badge */}
        <div className="badge" style={{ background: themeBg, color: themeColor, border: `1px solid ${themeColor}` }}>
            {doneCount} / {materials.length} Completati
        </div>
      </div>

      {/* LISTA MATERIALI */}
      {materials.length === 0 ? (
        <div className="card muted" style={{textAlign: 'center', padding: 40}}>
            Nessun materiale disponibile al momento.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {materials.map(m => {
            const isDone = !!progress[m.id];
            
            return (
              <div 
                key={m.id} 
                className="card" 
                style={{ 
                  padding: 16, 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  borderLeft: isDone ? `4px solid ${themeColor}` : "1px solid transparent",
                  background: isDone ? "#fdfdfd" : "#fff",
                  transition: "all 0.2s"
                }}
              >
                
                {/* Info Materiale */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24 }}>🔗</div>
                  <div>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: 16, 
                      textDecoration: isDone ? "line-through" : "none", 
                      color: isDone ? "var(--muted)" : "var(--text)" 
                    }}>
                      {m.title}
                    </div>
                    
                    {/* Link Esterno */}
                    <a 
                      href={m.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btnGhost" 
                      style={{ fontSize: 11, padding: "4px 8px", marginTop: 4, display: "inline-block" }}
                    >
                      Apri Risorsa ↗
                    </a>
                  </div>
                </div>

                {/* Checkbox Azione */}
                <button 
                  onClick={() => toggleDone(m)} 
                  className="btn"
                  title={isDone ? "Segna come da fare" : "Segna come fatto"}
                  style={{ 
                    background: isDone ? themeColor : "#f1f5f9", 
                    color: isDone ? "#fff" : "#94a3b8", 
                    border: "none", 
                    width: 40, height: 40, 
                    borderRadius: "50%", 
                    padding: 0, 
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isDone ? "0 2px 5px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  {isDone ? "✓" : "○"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}