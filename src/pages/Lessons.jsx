import React, { useState, useEffect, useMemo } from "react";
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc 
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
// MODIFICA: Importiamo le costanti dei tag per entrambi i corsi
import { 
  DEFAULT_ERROR_TAGS, DEFAULT_TOPIC_TAGS, 
  DEFAULT_CLOUD_ERRORS, DEFAULT_CLOUD_TOPICS 
} from "../lib/userSettings";

// --- Componente Chip (Tag) ---
function Chip({ label, active, onClick, colorTheme = "green" }) {
  // Gestione colori dinamici in base al tema (verde default, blu per cloud se necessario)
  const activeBg = colorTheme === "blue" ? "rgba(37, 99, 235, 0.1)" : "rgba(34,197,94,0.1)";
  const activeText = colorTheme === "blue" ? "#1e40af" : "var(--accent2)";
  const activeBorder = colorTheme === "blue" ? "#2563eb" : "var(--accent)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "6px 12px",
        borderRadius: "20px",
        border: active ? `1px solid ${activeBorder}` : "1px solid var(--border2)",
        backgroundColor: active ? activeBg : "#fff",
        color: active ? activeText : "var(--text)",
        fontSize: "12px",
        fontWeight: active ? 700 : 500,
        transition: "all 0.2s"
      }}
    >
      {label}
    </button>
  );
}

export default function Lessons({ studentId, baseline }) {
  const [lessons, setLessons] = useState([]);
  const [err, setErr] = useState(null);
  
  // MODIFICA: Stato per il corso corrente ('accounting' o 'cloud')
  const [courseContext, setCourseContext] = useState("accounting"); 

  // Stati per il form
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Dati del form
  const [topic, setTopic] = useState("");
  const [score, setScore] = useState(6);
  const [notes, setNotes] = useState("");
  const [topicTag, setTopicTag] = useState("");
  const [errorTags, setErrorTags] = useState([]);

  // Dati Edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 1) Determinazione del Corso & Caricamento Lezioni
  useEffect(() => {
    if (!studentId) return;

    // A. Recuperiamo il profilo studente per sapere il corso (roadmapId)
    const fetchStudentContext = async () => {
      try {
        const snap = await getDoc(doc(db, "students", studentId));
        if (snap.exists()) {
          const data = snap.data();
          // Se roadmapId manca, fallback su accounting
          setCourseContext(data.roadmapId || "accounting");
        }
      } catch (e) {
        console.error("Errore fetch contesto studente:", e);
      }
    };
    fetchStudentContext();

    // B. Listener Lezioni
    const q = query(
      collection(db, "students", studentId, "lessons"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (e) => setErr(e.message));
    
    return () => unsub();
  }, [studentId]);

  // --- SELEZIONE LISTE TAG IN BASE AL CORSO ---
  const isCloud = courseContext === "cloud";
  
  // Se cloud usa le costanti Cloud, altrimenti quelle contabilità
  const availableTopicTags = isCloud ? DEFAULT_CLOUD_TOPICS : DEFAULT_TOPIC_TAGS;
  const availableErrorTags = isCloud ? DEFAULT_CLOUD_ERRORS : DEFAULT_ERROR_TAGS;

  // Colore tema per i chip
  const chipTheme = isCloud ? "blue" : "green";

  // Helpers
  const toggleErrorTag = (t, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => {
        const currentTags = prev.errorTags || [];
        const newTags = currentTags.includes(t) 
          ? currentTags.filter(x => x !== t) 
          : [...currentTags, t];
        return { ...prev, errorTags: newTags };
      });
    } else {
      setErrorTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    }
  };

  const createLesson = async () => {
    if (!topic.trim()) { alert("Inserisci un argomento"); return; }
    try {
      await addDoc(collection(db, "students", studentId, "lessons"), {
        userId: auth.currentUser.uid,
        topic: topic.trim(),
        score: Number(score),
        notes: notes.trim(),
        topicTag: topicTag || null,
        errorTags: errorTags,
        createdAt: serverTimestamp(),
        // Salviamo anche il contesto per riferimento futuro
        courseId: courseContext 
      });
      // Reset form
      setTopic(""); setScore(6); setNotes(""); setTopicTag(""); setErrorTags([]);
      setShowAddForm(false);
    } catch (e) { console.error(e); setErr("Errore salvataggio"); }
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setEditForm({ ...l, errorTags: l.errorTags || [] });
  };

  const saveEdit = async (id) => {
    try {
      await updateDoc(doc(db, "students", studentId, "lessons", id), {
        topic: editForm.topic,
        score: Number(editForm.score),
        notes: editForm.notes,
        topicTag: editForm.topicTag || null,
        errorTags: editForm.errorTags
      });
      setEditingId(null);
    } catch(e) { console.error(e); }
  };

  const deleteLesson = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa lezione per sempre?")) return;
    try {
      await deleteDoc(doc(db, "students", studentId, "lessons", id));
    } catch(e) { console.error(e); alert("Errore eliminazione"); }
  };

  // Statistiche
  const stats = useMemo(() => {
    const validScores = lessons.map(l => l.score).filter(s => typeof s === 'number');
    if (!validScores.length) return null;
    const avg = validScores.reduce((a,b)=>a+b,0) / validScores.length;
    const recent = validScores.slice(0, 5);
    const avgRecent = recent.reduce((a,b)=>a+b,0) / recent.length;
    return { avg: avg.toFixed(1), recent: avgRecent.toFixed(1), count: validScores.length };
  }, [lessons]);

  return (
    <div>
      {/* KPI Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ padding: 10, textAlign: "center" }}>
            <div className="muted" style={{ fontSize: 11 }}>LEZIONI</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{stats.count}</div>
          </div>
          <div className="card" style={{ padding: 10, textAlign: "center" }}>
            <div className="muted" style={{ fontSize: 11 }}>MEDIA TOT</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{stats.avg}</div>
          </div>
          <div className="card" style={{ padding: 10, textAlign: "center" }}>
            <div className="muted" style={{ fontSize: 11 }}>ULTIME 5</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "var(--accent2)" }}>{stats.recent}</div>
          </div>
        </div>
      )}

      {/* HEADER + BOTTONE NUOVA LEZIONE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontWeight: 800 }}>Storico Lezioni</h3>
        <button 
          className="btn btnPrimary" 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ padding: "8px 16px" }}
        >
          {showAddForm ? "Chiudi" : "➕ Nuova Lezione"}
        </button>
      </div>

      {/* FORM AGGIUNTA (ACCORDION) */}
      {showAddForm && (
        <div className="card" style={{ border: `2px solid ${isCloud ? '#2563eb' : 'var(--accent)'}`, marginBottom: 24, animation: "slideDown 0.2s" }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h4 style={{ marginTop: 0 }}>Nuova Lezione</h4>
            <span style={{fontSize: 10, fontWeight: 700, background: isCloud ? '#eff6ff' : '#ecfdf5', color: isCloud ? '#1e40af' : '#064e3b', padding: '2px 6px', borderRadius: 4}}>
               {isCloud ? 'CLOUD COMPUTING' : 'CONTABILITÀ'}
            </span>
          </div>
          
          <div className="field">
            <input 
              className="input" 
              placeholder={isCloud ? "Argomento (es. S3 Lifecycle Policies)" : "Argomento (es. Ratei e Risconti)"}
              value={topic} onChange={e => setTopic(e.target.value)}
            />
            
            <div className="row">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Voto (0-10)</label>
                <input 
                  type="number" className="input" min="0" max="10" 
                  value={score} onChange={e => setScore(e.target.value)} 
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Tag Argomento</label>
                <select className="input" value={topicTag} onChange={e => setTopicTag(e.target.value)}>
                  <option value="">-- Seleziona --</option>
                  {availableTopicTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <textarea 
              className="textarea" 
              placeholder="Note, cosa migliorare, errori specifici..." 
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ minHeight: 80 }}
            />

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Tag Errori:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {availableErrorTags.map(t => (
                  <Chip 
                    key={t} 
                    label={t} 
                    active={errorTags.includes(t)} 
                    onClick={() => toggleErrorTag(t)} 
                    colorTheme={chipTheme}
                  />
                ))}
              </div>
            </div>

            <button className="btn btnPrimary" style={{ marginTop: 10, width: "100%" }} onClick={createLesson}>
              Salva Lezione
            </button>
          </div>
        </div>
      )}

      {/* LISTA LEZIONI */}
      <div style={{ display: "grid", gap: 12 }}>
        {lessons.length === 0 && <div className="muted">Nessuna lezione registrata.</div>}

        {lessons.map(l => {
          const isEditing = editingId === l.id;
          
          // --- MODALITÀ MODIFICA ---
          if (isEditing) {
            return (
              <div key={l.id} className="card" style={{ border: "2px solid var(--accent2)", padding: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 12 }}>Modifica Lezione</div>
                
                <div className="field">
                  <input 
                    className="input" 
                    value={editForm.topic} 
                    onChange={e => setEditForm({...editForm, topic: e.target.value})} 
                    placeholder="Argomento"
                  />
                  <div className="row">
                    <label style={{fontSize: 12, fontWeight: 700}}>Voto:</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={editForm.score} 
                      onChange={e => setEditForm({...editForm, score: e.target.value})} 
                      style={{width: 80}} 
                    />
                  </div>

                  <label style={{fontSize: 12, fontWeight: 700}}>Note:</label>
                  <textarea 
                    className="textarea"
                    value={editForm.notes} 
                    onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                    style={{ minHeight: 80 }}
                  />

                  <div>
                     <label style={{fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6}}>Modifica Errori:</label>
                     <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {availableErrorTags.map(t => (
                          <Chip 
                            key={t} 
                            label={t} 
                            active={editForm.errorTags?.includes(t)} 
                            onClick={() => toggleErrorTag(t, true)} 
                            colorTheme={chipTheme}
                          />
                        ))}
                     </div>
                  </div>

                  <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                       <button className="btn btnPrimary" onClick={() => saveEdit(l.id)}>Salva Modifiche</button>
                       <button className="btn btnGhost" onClick={() => setEditingId(null)}>Annulla</button>
                    </div>
                    <button className="btn btnDanger" onClick={() => deleteLesson(l.id)}>🗑️ Elimina</button>
                  </div>
                </div>
              </div>
            );
          }

          // --- VISUALIZZAZIONE NORMALE ---
          return (
            <div key={l.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                    {l.topic || "Senza titolo"}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="badge" style={{ backgroundColor: "#f1f5f9" }}>
                      Voto: <strong>{l.score}</strong>
                    </span>
                    {l.topicTag && <span className="badge" style={{ backgroundColor: isCloud ? "#eff6ff" : "#fff7ed", color: isCloud ? "#1e40af" : "#c2410c" }}>{l.topicTag}</span>}
                  </div>
                </div>
                <button className="btn btnGhost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => startEdit(l)}>
                  ✏️ Modifica
                </button>
              </div>

              {(l.notes || (l.errorTags && l.errorTags.length > 0)) && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border2)" }}>
                  {l.notes && <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 8, whiteSpace: "pre-wrap" }}>{l.notes}</div>}
                  
                  {l.errorTags && l.errorTags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {l.errorTags.map(t => (
                        <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: isCloud ? "#dbeafe" : "#fee2e2", color: isCloud ? "#1e3a8a" : "#991b1b", fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}