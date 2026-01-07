import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/**
 * Componente Pill (Etichetta visuale)
 * * Rappresenta un singolo tag con il pulsante "X" per rimuoverlo.
 */
function Pill({ label, onRemove, colorTheme = "green" }) {
  // Stili dinamici in base al tema
  const bg = colorTheme === "blue" ? "#dbeafe" : "#e2e8f0";
  const text = colorTheme === "blue" ? "#1e40af" : "#334155";
  const border = colorTheme === "blue" ? "#bfdbfe" : "#cbd5e1";

  return (
    <div 
      className="pill" 
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 20,
        backgroundColor: bg, color: text,
        fontSize: 13, fontWeight: 500, border: `1px solid ${border}`
      }}
    >
      <span>{label}</span>
      <button 
        type="button" 
        onClick={onRemove} 
        aria-label={`Rimuovi ${label}`}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: colorTheme === "blue" ? "#60a5fa" : "#94a3b8", 
          fontWeight: "bold", fontSize: 14,
          padding: 0, lineHeight: 1, display: "flex"
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Pagina UserTags (Impostazioni)
 * * Permette al Tutor di gestire le categorie per Errori e Argomenti.
 * * Aggiornato per supportare Multi-Corso (Contabilità e Cloud).
 */
export default function UserTags() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // MODIFICA: Stato per selezionare il contesto (Contabilità o Cloud)
  const [activeCourse, setActiveCourse] = useState("accounting"); 

  // Stati Liste Tag (Contiene TUTTI i dati dal DB)
  const [data, setData] = useState({});

  // Stati Input
  const [newErrorTag, setNewErrorTag] = useState("");
  const [newTopicTag, setNewTopicTag] = useState("");

  const uid = auth.currentUser?.uid;

  // --- 1. CARICAMENTO DATI (REALTIME) ---
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "userSettings", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? snap.data() : {});
        setError(null);
        setLoading(false);
      },
      (e) => {
        console.error("Errore userSettings:", e);
        setError("Impossibile caricare le impostazioni.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  // Memoizzazione riferimento al documento
  const ref = useMemo(() => (uid ? doc(db, "userSettings", uid) : null), [uid]);

  const normalize = (s) => s.trim();

  // --- HELPER: Determinazione Campi DB ---
  // In base al tab attivo, capiamo quali campi leggere/scrivere
  const isCloud = activeCourse === "cloud";
  const errorField = isCloud ? "cloudErrorTags" : "errorTags";
  const topicField = isCloud ? "cloudTopicTags" : "topicTags";

  const currentErrorList = Array.isArray(data[errorField]) ? data[errorField] : [];
  const currentTopicList = Array.isArray(data[topicField]) ? data[topicField] : [];

  // Temi UI
  const themeColor = isCloud ? "#2563eb" : "#10b981";
  const themeBg = isCloud ? "#eff6ff" : "#f0fdf4";

  // --- 2. AGGIUNGI TAG ---
  const addTag = async (type) => {
    if (!ref) return;

    const raw = type === "error" ? newErrorTag : newTopicTag;
    const tag = normalize(raw);
    
    if (!tag) return;

    // Seleziona la lista e il campo corretti
    const currentList = type === "error" ? currentErrorList : currentTopicList;
    const targetField = type === "error" ? errorField : topicField;
    
    // Controllo duplicati
    const lower = currentList.map((x) => String(x).toLowerCase());
    if (lower.includes(tag.toLowerCase())) {
      if (type === "error") setNewErrorTag("");
      else setNewTopicTag("");
      return;
    }

    const updatedList = [...currentList, tag].sort((a, b) => a.localeCompare(b));

    try {
      await updateDoc(ref, {
        [targetField]: updatedList,
        updatedAt: serverTimestamp(),
      });

      if (type === "error") setNewErrorTag("");
      else setNewTopicTag("");
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Errore durante il salvataggio del tag.");
    }
  };

  // --- 3. RIMUOVI TAG ---
  const removeTag = async (type, tagToRemove) => {
    if (!ref) return;

    const currentList = type === "error" ? currentErrorList : currentTopicList;
    const targetField = type === "error" ? errorField : topicField;
    
    const updatedList = currentList.filter((x) => x !== tagToRemove);

    try {
      await updateDoc(ref, {
        [targetField]: updatedList,
        updatedAt: serverTimestamp(),
      });
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Errore durante la rimozione del tag.");
    }
  };

  // --- RENDER ---
  if (loading) return <div className="muted" style={{padding: 20}}>Caricamento impostazioni...</div>;

  return (
    <div>
      {!uid && <div className="muted">Non sei loggato.</div>}
      {error && <div className="toastErr">{error}</div>}

      {/* HEADER + TABS */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 15 }}>
        <h3 style={{margin: 0}}>Gestione Tag</h3>
        
        <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
            <button 
                onClick={() => setActiveCourse("accounting")}
                style={{
                    padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                    background: !isCloud ? "#fff" : "transparent",
                    color: !isCloud ? "#10b981" : "#64748b",
                    boxShadow: !isCloud ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
            >
                📚 Contabilità
            </button>
            <button 
                onClick={() => setActiveCourse("cloud")}
                style={{
                    padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                    background: isCloud ? "#fff" : "transparent",
                    color: isCloud ? "#2563eb" : "#64748b",
                    boxShadow: isCloud ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
            >
                ☁️ Cloud
            </button>
        </div>
      </div>

      <div style={{ 
          padding: 15, background: themeBg, borderRadius: 12, marginBottom: 20, 
          border: `1px solid ${isCloud ? '#bfdbfe' : '#bbf7d0'}`, color: isCloud ? '#1e40af' : '#166534', fontSize: 13 
      }}>
          Stai modificando le categorie per il corso di <strong>{isCloud ? "CLOUD COMPUTING" : "CONTABILITÀ"}</strong>.
      </div>

      {/* SEZIONE 1: TAG ERRORI */}
      <div className="card" style={{ boxShadow: "none", marginBottom: 30, borderLeft: `4px solid ${themeColor}` }}>
        <div className="sectionTitle">Categorie Errori ({isCloud ? 'Cloud' : 'Conta'})</div>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Etichette per segnalare il tipo di errore commesso dallo studente.
        </p>

        <div className="row" style={{ marginTop: 15 }}>
          <input
            className="input"
            value={newErrorTag}
            onChange={(e) => setNewErrorTag(e.target.value)}
            placeholder={isCloud ? "Es. 'Confusione IaaS/PaaS'" : "Es. 'Dare/Avere'"}
            onKeyDown={(e) => e.key === "Enter" && addTag("error")}
          />
          <button 
            className="btn btnPrimary" 
            type="button" 
            onClick={() => addTag("error")}
            style={{ background: themeColor }}
          >
            Aggiungi
          </button>
        </div>

        <div className="pills" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 15 }}>
          {currentErrorList.length === 0 ? (
            <div className="muted" style={{ fontStyle: "italic" }}>Nessun tag configurato.</div>
          ) : (
            currentErrorList.map((t) => (
                <Pill 
                    key={t} label={t} 
                    onRemove={() => removeTag("error", t)} 
                    colorTheme={isCloud ? "blue" : "green"}
                />
            ))
          )}
        </div>
      </div>

      <div className="sep" style={{ borderBottom: "1px solid var(--border)", margin: "0 0 30px 0" }} />

      {/* SEZIONE 2: TAG ARGOMENTI */}
      <div className="card" style={{ boxShadow: "none", borderLeft: `4px solid ${themeColor}` }}>
        <div className="sectionTitle">Argomenti Lezione ({isCloud ? 'Cloud' : 'Conta'})</div>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Etichette per categorizzare le lezioni svolte e i voti.
        </p>

        <div className="row" style={{ marginTop: 15 }}>
          <input
            className="input"
            value={newTopicTag}
            onChange={(e) => setNewTopicTag(e.target.value)}
            placeholder={isCloud ? "Es. 'EC2', 'S3', 'VPC'" : "Es. 'Ratei', 'IVA'"}
            onKeyDown={(e) => e.key === "Enter" && addTag("topic")}
          />
          <button 
            className="btn btnPrimary" 
            type="button" 
            onClick={() => addTag("topic")}
            style={{ background: themeColor }}
          >
            Aggiungi
          </button>
        </div>

        <div className="pills" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 15 }}>
          {currentTopicList.length === 0 ? (
            <div className="muted" style={{ fontStyle: "italic" }}>Nessun argomento configurato.</div>
          ) : (
            currentTopicList.map((t) => (
                <Pill 
                    key={t} label={t} 
                    onRemove={() => removeTag("topic", t)} 
                    colorTheme={isCloud ? "blue" : "green"}
                />
            ))
          )}
        </div>
      </div>
    </div>
  );
}