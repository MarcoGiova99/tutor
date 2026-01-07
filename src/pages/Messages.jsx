import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/**
 * Componente Messages (Chat Semplificata)
 * * Permette al Tutor di visualizzare e rispondere ai messaggi diretti.
 * * Aggiornato per riflettere il contesto del corso (Cloud vs Contabilità).
 */
export default function Messages({ studentId }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  const [courseId, setCourseId] = useState("accounting"); // 'accounting' | 'cloud'

  // Stati per l'input del tutor
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  // --- 1. IDENTIFICAZIONE CORSO ---
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

  // --- 2. CARICAMENTO MESSAGGI (REALTIME) ---
  useEffect(() => {
    if (!studentId) return;

    const q = query(
      collection(db, "students", studentId, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setErr(null);
      },
      (e) => {
        console.error("Errore snapshot messaggi:", e);
        setErr(e?.message || "Impossibile caricare la conversazione.");
      }
    );

    return () => unsub();
  }, [studentId]);

  // --- 3. INVIO RISPOSTA TUTOR ---
  const sendTutorReply = async () => {
    const u = auth.currentUser;
    if (!u || !studentId) return;
    
    const t = text.trim();
    if (!t) return;

    setBusy(true);
    setErr(null);

    try {
      await addDoc(collection(db, "students", studentId, "messages"), {
        authorUid: u.uid,
        authorRole: "tutor", 
        text: t,
        courseId: courseId, // Salviamo il contesto del corso corrente
        createdAt: serverTimestamp(),
      });
      setText(""); 
    } catch (e) {
      console.error("Errore invio:", e);
      setErr("Errore durante l'invio del messaggio.");
    } finally {
      setBusy(false);
    }
  };

  // --- THEME HELPERS ---
  const isCloud = courseId === 'cloud';
  const themeColor = isCloud ? '#2563eb' : '#991b1b';
  const themeBg = isCloud ? '#eff6ff' : '#fef2f2';

  // --- RENDER ---
  if (!studentId) return <div className="muted">Seleziona uno studente per vedere i messaggi.</div>;

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      
      {/* HEADER CON BADGE CORSO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="sectionTitle" style={{ margin: 0 }}>Dubbi / Messaggi</div>
          
          <span style={{ 
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
              color: themeColor, background: themeBg,
              padding: '4px 8px', borderRadius: 6, border: `1px solid ${themeColor}`
          }}>
              {isCloud ? 'CLOUD COMPUTING' : 'CONTABILITÀ'}
          </span>
      </div>
      
      <p className="muted" style={{ marginTop: 0 }}>
        Cronologia conversazione diretta con lo studente.
      </p>

      {err && <div className="toastErr">Errore: {err}</div>}

      {/* AREA INPUT TUTOR */}
      <div className="field">
        <textarea
          className="textarea"
          placeholder="Scrivi una risposta..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{ borderColor: busy ? themeColor : 'var(--border)' }}
        />
        <button 
            className="btn" 
            onClick={sendTutorReply} 
            disabled={busy}
            style={{ 
                marginTop: 8, 
                background: themeColor, 
                color: 'white',
                opacity: busy ? 0.7 : 1
            }}
        >
          {busy ? "Invio..." : "Invia Risposta"}
        </button>
      </div>

      <div className="sep" style={{ margin: "20px 0", borderBottom: "1px solid var(--border)" }} />

      {/* LISTA MESSAGGI */}
      {items.length === 0 ? (
        <div className="muted" style={{ textAlign: "center", padding: 20 }}>
            Nessun messaggio presente.
        </div>
      ) : (
        <div className="list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((m) => {
            const isTutor = m.authorRole === "tutor";
            return (
                <div 
                    key={m.id} 
                    className="studentItem" 
                    style={{ 
                        cursor: "default",
                        // Stile: Verde per Tutor (Neutro/Autorità), Bianco per Studente
                        alignSelf: isTutor ? "flex-end" : "flex-start",
                        background: isTutor ? "#ecfdf5" : "#fff",
                        border: isTutor ? "1px solid #a7f3d0" : "1px solid var(--border)",
                        maxWidth: "85%",
                        borderRadius: 8,
                        padding: 12
                    }}
                >
                <div 
                    className="muted" 
                    style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: isTutor ? "#047857" : "#64748b",
                        marginBottom: 4 
                    }}
                >
                    {isTutor ? "👨‍🏫 TU (Tutor)" : "👤 STUDENTE"}
                </div>
                <div style={{ fontWeight: 500, color: "var(--text)", lineHeight: 1.4 }}>
                    {m.text}
                </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}