import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Sotto-componenti per la gestione dettagliata
import Lessons from "./Lessons.jsx";
import Materials from "./Materials.jsx";
import InviteStudent from "./InviteStudent.jsx";
import Messages from "./Messages.jsx";

// Utility per popolare velocemente un piano di studi standard (Solo Contabilità)
import { seedCoreAccounting } from "../lib/seedCoreAccounting";

/**
 * Pagina Students (Registro Tutor)
 * * Questa è l'area di gestione principale per il Tutor.
 * * Aggiornata per supportare la creazione di studenti Multi-Corso.
 */
export default function Students() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Form Creazione
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [baseline, setBaseline] = useState(5);
  // MODIFICA: Stato per il corso
  const [course, setCourse] = useState("accounting"); 

  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // --- 1. CARICAMENTO LISTA STUDENTI (REALTIME) ---
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    const q = query(
      collection(db, "students"),
      where("tutorUid", "==", u.uid), // Assumiamo tutorUid come standard
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStudents(rows);
        setError(null);

        setSelectedId((prev) => {
          if (rows.length === 0) return null;
          if (prev && rows.some((s) => s.id === prev)) return prev;
          return rows[0].id;
        });
      },
      (e) => {
        console.error("Errore caricamento studenti:", e);
        // Fallback: riprova con userId se tutorUid fallisce (retrocompatibilità)
        if (e.code === 'failed-precondition' || e.message.includes('index')) {
             setError("Indice mancante o errore query. Controlla la console.");
        }
      }
    );

    return () => unsub();
  }, []);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId) || null,
    [students, selectedId]
  );

  // --- 2. CREAZIONE NUOVO STUDENTE ---
  const handleCreateStudent = async () => {
    const u = auth.currentUser;
    if (!u) return;

    const nm = name.trim();
    if (!nm) {
      setError("Inserisci un nome per lo studente.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "students"), {
        tutorUid: u.uid, // Standardizziamo su tutorUid
        userId: u.uid,   // Manteniamo per sicurezza/legacy
        name: nm,
        goal: goal.trim() || "Migliorare voti",
        baseline: Number(baseline),
        // MODIFICA: Salviamo il corso selezionato
        roadmapId: course, 
        createdAt: serverTimestamp(),
        completedLevels: [],
        sharedNotes: [] 
      });

      // Reset Form
      setName("");
      setGoal("");
      setBaseline(5);
      setCourse("accounting"); // Reset al default
      setSelectedId(docRef.id);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Errore durante la creazione dello studente.");
    }
  };

  // --- 3. UTILITY: SEED AUTOMATICO ---
  const handleSeedCore = async () => {
    if (!selectedId) return;
    if(!confirm("Vuoi generare automaticamente il piano di studi base per questo studente?")) return;

    try {
      setSeeding(true);
      await seedCoreAccounting(selectedId);
      setError(null);
      alert("✅ Piano di studi base generato.");
    } catch (e) {
      console.error(e);
      setError("Errore durante il seeding dei dati.");
    } finally {
      setSeeding(false);
    }
  };

  // Helper per Badge
  const getCourseBadge = (cId) => {
      if (cId === 'cloud') return { label: 'CLOUD', bg: '#eff6ff', col: '#2563eb', border: '#bfdbfe' };
      return { label: 'CONTA', bg: '#f0fdf4', col: '#166534', border: '#bbf7d0' };
  };

  // --- RENDER ---
  return (
    <div>
      
      {/* BOX CREAZIONE */}
      <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
        <div className="sectionTitle">Aggiungi Studente</div>

        <div className="field">
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            
            {/* Input Nome */}
            <input
              className="input"
              placeholder="Nome (es. Marco Rossi)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flex: 2, minWidth: 150 }}
            />

            {/* Select Corso (NUOVO) */}
            <select 
                className="input"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                style={{ flex: 1, minWidth: 140, fontWeight: 'bold' }}
            >
                <option value="accounting">📚 Contabilità</option>
                <option value="cloud">☁️ Cloud Comp.</option>
            </select>

            <input
              className="input"
              placeholder="Obiettivo"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{ flex: 2, minWidth: 150 }}
            />

            <div className="row" style={{ flex: 1, minWidth: 100 }}>
              <input
                className="input"
                type="number"
                min="0"
                max="10"
                value={baseline}
                onChange={(e) => setBaseline(Number(e.target.value))}
                style={{ width: 60 }}
              />
              <span className="muted" style={{fontSize: 11}}>Start Voto</span>
            </div>
          </div>

          <button 
            className="btn btnPrimary" 
            onClick={handleCreateStudent}
            style={{ marginTop: 10, width: '100%' }}
          >
            Crea Scheda Studente
          </button>

          {error && <div className="toastErr" style={{marginTop: 10}}>⚠️ {error}</div>}
        </div>
      </div>

      <div className="sep" style={{ margin: "30px 0" }} />

      {/* LAYOUT A DUE COLONNE */}
      <div className="layout" style={{ display: 'grid', gridTemplateColumns: "300px 1fr", gap: 24 }}>
        
        {/* COLONNA SINISTRA: LISTA STUDENTI */}
        <div className="card" style={{ boxShadow: "none", height: 'fit-content', border: "1px solid var(--border)", padding: 0, overflow: 'hidden' }}>
          <div className="sectionTitle" style={{ padding: "15px 15px 5px 15px" }}>I tuoi Studenti</div>

          {students.length === 0 ? (
            <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Nessuno studente ancora.</div>
          ) : (
            <div className="list" style={{ display: 'flex', flexDirection: 'column' }}>
              {students.map((s) => {
                const active = s.id === selectedId;
                const badge = getCourseBadge(s.roadmapId);

                return (
                  <button
                    type="button"
                    key={s.id}
                    className="btn"
                    onClick={() => setSelectedId(s.id)}
                    style={{ 
                        width: "100%", 
                        textAlign: "left",
                        background: active ? "#f8fafc" : "transparent",
                        borderLeft: active ? "4px solid var(--accent)" : "4px solid transparent",
                        borderBottom: "1px solid #f1f5f9",
                        borderRadius: 0,
                        padding: "12px 16px"
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: active ? 800 : 600, color: "var(--text)", fontSize: 15 }}>
                          {s.name}
                        </span>
                        
                        {/* Badge Corso nella Lista */}
                        <span style={{ 
                            fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                            backgroundColor: badge.bg, color: badge.col, border: `1px solid ${badge.border}`
                        }}>
                            {badge.label}
                        </span>
                    </div>

                    <div className="muted" style={{ fontSize: 12 }}>
                      🎯 {s.goal || "Nessun obiettivo"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* COLONNA DESTRA: DETTAGLIO SELEZIONATO */}
        <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border)", minHeight: 500 }}>
          {selectedStudent ? (
            <>
              {/* Header Studente */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 15, marginBottom: 20 }}>
                <div>
                    <div style={{display:'flex', alignItems:'center', gap: 10}}>
                        <div className="sectionTitle" style={{fontSize: 24, margin: 0}}>{selectedStudent.name}</div>
                        {/* Badge Grande nel Dettaglio */}
                        <span style={{
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                            backgroundColor: getCourseBadge(selectedStudent.roadmapId).bg,
                            color: getCourseBadge(selectedStudent.roadmapId).col,
                            padding: '4px 8px', borderRadius: 6
                        }}>
                            {selectedStudent.roadmapId === 'cloud' ? 'Cloud Computing' : 'Contabilità'}
                        </span>
                    </div>
                    <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
                        Baseline: <strong>{selectedStudent.baseline}/10</strong> • Iscritto il: {selectedStudent.createdAt?.toDate().toLocaleDateString()}
                    </p>
                </div>
                
                {/* Tasto Seed (Mostrato SOLO per Contabilità per ora) */}
                {selectedStudent.roadmapId !== 'cloud' && (
                    <button 
                        className="btn" 
                        onClick={handleSeedCore} 
                        disabled={seeding}
                        style={{ fontSize: 11, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                        title="Genera lezioni automatiche (Legacy)"
                    >
                    {seeding ? "Generazione..." : "⚡ Popola Dati"}
                    </button>
                )}
              </div>

              {/* Grid Strumenti */}
              <div style={{ display: "grid", gap: 30 }}>
                
                {/* 1. Collega Account Reale */}
                <InviteStudent studentId={selectedId} />
                
                {/* 2. Chat / Messaggi */}
                <Messages studentId={selectedId} />

                <hr style={{ borderColor: '#f1f5f9' }}/>

                {/* 3. Registro Lezioni */}
                <Lessons studentId={selectedId} baseline={selectedStudent.baseline} />
                
                {/* 4. Materiali Condivisi */}
                <Materials studentId={selectedId} />
              </div>

              {error && (
                <div className="toastErr" style={{ marginTop: 12 }}>
                  Errore: {error}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              👈 Seleziona uno studente dalla lista a sinistra per iniziare.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}