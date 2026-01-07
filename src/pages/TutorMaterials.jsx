import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp, getDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase"; 

/**
 * Componente TutorMaterials
 * * Gestisce la condivisione di materiale didattico tra Tutor e Studente.
 * * Aggiornato per riflettere il tema del corso (Cloud o Contabilità).
 */
export default function TutorMaterials({ studentId }) {
  const [materials, setMaterials] = useState([]);
  const [courseId, setCourseId] = useState("accounting"); // 'accounting' | 'cloud'
  
  // Stati del Form
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState(""); 

  // --- 1. RECUPERO CONTESTO CORSO ---
  useEffect(() => {
    if (!studentId) return;
    const fetchContext = async () => {
      try {
        const snap = await getDoc(doc(db, "students", studentId));
        if (snap.exists()) {
          setCourseId(snap.data().roadmapId || "accounting");
        }
      } catch (e) { console.error("Errore fetch corso:", e); }
    };
    fetchContext();
  }, [studentId]);

  // --- 2. LETTURA MATERIALI (REALTIME) ---
  useEffect(() => {
    if (!studentId) return;
    
    const q = query(
        collection(db, "students", studentId, "materials"), 
        orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [studentId]);

  // --- 3. AGGIUNTA LINK ---
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkUrl || !title) return;

    try {
      await addDoc(collection(db, "students", studentId, "materials"), {
        title: title,
        url: linkUrl, 
        type: "link", 
        courseId: courseId, // Salviamo anche il contesto per sicurezza
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setLinkUrl("");
    } catch (error) {
      console.error(error);
      alert("Errore salvataggio: " + error.message);
    }
  };

  // --- 4. ELIMINAZIONE ---
  const handleDelete = async (id) => {
    if (!confirm("Sei sicuro di voler rimuovere questo materiale dalla lista dello studente?")) return;
    try {
      await deleteDoc(doc(db, "students", studentId, "materials", id));
    } catch (e) {
      console.error(e);
      alert("Impossibile eliminare il materiale.");
    }
  };

  // --- THEME HELPERS ---
  const isCloud = courseId === 'cloud';
  const themeColor = isCloud ? '#2563eb' : 'var(--accent)'; // Blu o Rosso/Verde
  const themeBadgeBg = isCloud ? '#eff6ff' : '#fff7ed';
  const themeBadgeText = isCloud ? '#1e40af' : '#c2410c';

  return (
    <div>
      {/* --- FORM DI INSERIMENTO --- */}
      <div className="card" style={{ marginBottom: 20, border: `2px solid ${themeColor}` }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
            <h4 style={{ margin: 0 }}>Nuova Risorsa Didattica</h4>
            <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                background: themeBadgeBg, color: themeBadgeText,
                padding: '2px 6px', borderRadius: 4
            }}>
                {isCloud ? 'CLOUD COMPUTING' : 'CONTABILITÀ'}
            </span>
        </div>
        
        <div style={{fontSize: 13, color: "var(--muted)", marginBottom: 15, lineHeight: 1.4}}>
          ℹ️ <b>Come fare:</b> Carica il PDF o il video su Google Drive, rendilo "chiunque abbia il link", copia l'URL e incollalo qui sotto.
        </div>
        
        <form onSubmit={handleAddLink}>
          <div className="field">
            <input 
              className="input" 
              placeholder={isCloud ? "Titolo (es. Slide EC2 vs Lambda)" : "Titolo (es. Schema Partita Doppia)"}
              value={title} 
              onChange={e => setTitle(e.target.value)}
              required
            />
            
            <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  className="input"
                  type="url"
                  placeholder="Incolla qui il link (https://...)" 
                  value={linkUrl} 
                  onChange={e => setLinkUrl(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button 
                    type="submit" 
                    className="btn btnPrimary" 
                    style={{ whiteSpace: 'nowrap', background: isCloud ? themeColor : undefined }}
                >
                  🔗 Aggiungi
                </button>
            </div>
          </div>
        </form>
      </div>

      {/* --- LISTA MATERIALI ESISTENTI --- */}
      <div style={{ display: "grid", gap: 10 }}>
        {materials.length === 0 && <div className="muted" style={{ textAlign: 'center', padding: 20 }}>Nessun materiale condiviso con questo studente.</div>}
        
        {materials.map(m => (
          <div key={m.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
            {/* Info Materiale */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24 }}>📄</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{m.title}</div>
                <a 
                  href={m.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="muted" 
                  style={{ fontSize: 12, textDecoration: "underline", color: "var(--accent2)", display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Apri Collegamento ↗
                </a>
              </div>
            </div>

            {/* Tasto Elimina */}
            <button 
              className="btn btnDanger" 
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => handleDelete(m.id)}
              title="Rimuovi materiale"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}