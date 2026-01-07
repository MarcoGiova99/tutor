import React, { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * SharedNotesWidget Component
 * * Gestisce un sistema di messaggistica asincrona tra Studente e Tutor.
 * * Aggiornato per supportare Multi-Corso (Contabilità + Cloud).
 */
export default function SharedNotesWidget({ studentDocId, notes = [] }) {
  // --- STATO DEL COMPONENTE ---
  const [isAdding, setIsAdding] = useState(false); // Toggle visibilità form nuova nota
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("accounting"); // Default: Contabilità
  const [loading, setLoading] = useState(false);

  // Stati per gestire le risposte ai thread esistenti
  const [replyingToId, setReplyingToId] = useState(null); 
  const [replyContent, setReplyContent] = useState("");

  // Ordiniamo le note dalla più recente alla più vecchia
  const sortedNotes = Array.isArray(notes) 
    ? [...notes].sort((a, b) => new Date(b.date) - new Date(a.date)) 
    : [];

  /**
   * Helper per visualizzare il badge del corso
   */
  const getCourseBadgeInfo = (courseId) => {
    if (courseId === 'cloud') {
      return { label: 'CLOUD', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
    }
    // Default o Accounting
    return { label: 'CONTABILITÀ', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
  };

  /**
   * 1. SALVA NUOVA NOTA
   * Include ora il campo 'courseId' per distinguere l'argomento.
   */
  const handleSaveNewNote = async () => {
    if (!studentDocId) return alert("Errore: ID studente mancante.");
    if (!title.trim() || !content.trim()) return alert("Inserisci titolo e contenuto.");
    
    setLoading(true);

    try {
      const studentRef = doc(db, "students", studentDocId);
      const snap = await getDoc(studentRef);
      const currentNotes = snap.data()?.sharedNotes || [];

      const newNote = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        courseId: selectedCourse, // Salviamo il contesto (accounting/cloud)
        date: new Date().toISOString(),
        replies: []
      };

      await updateDoc(studentRef, {
        sharedNotes: [...currentNotes, newNote]
      });

      // Reset Form
      setTitle("");
      setContent("");
      setIsAdding(false);

    } catch (e) {
      console.error("Errore salvataggio nota:", e);
      alert("Impossibile salvare la nota. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. ELIMINA INTERA NOTA
   */
  const handleDeleteNote = async (noteId) => {
    if(!window.confirm("Vuoi eliminare questa nota e tutte le risposte?")) return;
    
    try {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        const studentRef = doc(db, "students", studentDocId);
        await updateDoc(studentRef, { sharedNotes: updatedNotes });
    } catch (e) {
        console.error("Errore eliminazione nota:", e);
    }
  };

  /**
   * 3. ELIMINA SINGOLA RISPOSTA
   */
  const handleDeleteReply = async (noteId, replyIndex) => {
    if(!window.confirm("Eliminare questo messaggio?")) return;

    try {
        const updatedNotes = notes.map(n => {
            if (n.id === noteId) {
                const newReplies = n.replies.filter((_, idx) => idx !== replyIndex);
                return { ...n, replies: newReplies };
            }
            return n;
        });

        const studentRef = doc(db, "students", studentDocId);
        await updateDoc(studentRef, { sharedNotes: updatedNotes });

    } catch (e) {
        console.error("Errore eliminazione risposta:", e);
    }
  };

  /**
   * 4. INVIA RISPOSTA (THREAD)
   */
  const handleReplyToThread = async (note) => {
    if (!replyContent.trim()) return;
    setLoading(true);

    try {
      const newMessage = {
        sender: "student",
        text: replyContent.trim(),
        date: new Date().toISOString()
      };

      const updatedNotes = notes.map(n => {
        if (n.id === note.id) {
          const currentReplies = n.replies || [];
          return { ...n, replies: [...currentReplies, newMessage] };
        }
        return n;
      });

      const studentRef = doc(db, "students", studentDocId);
      await updateDoc(studentRef, { sharedNotes: updatedNotes });

      setReplyContent("");
      setReplyingToId(null);

    } catch (e) {
      console.error("Errore invio risposta:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="card" style={{ borderTop: "4px solid #8b5cf6", marginTop: 24 }}> 
      
      {/* HEADER WIDGET */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>📝 Note & Domande</h3>
        <button 
            className="btn" 
            onClick={() => setIsAdding(!isAdding)} 
            style={{ 
                background: isAdding ? "#fee2e2" : "#f3f4f6", 
                color: isAdding ? "#ef4444" : "#374151", 
                fontSize: 12, 
                padding: "4px 10px" 
            }}
        >
          {isAdding ? "Annulla" : "+ Nuova Nota"}
        </button>
      </div>

      {/* FORM AGGIUNTA NUOVA NOTA */}
      {isAdding && (
        <div style={{ background: "#f9fafb", padding: 10, borderRadius: 8, marginBottom: 15, border: "1px solid #e5e7eb" }}>
          
          {/* SELETTORE CORSO */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 'bold', display: 'block', marginBottom: 4, color: '#6b7280' }}>ARGOMENTO:</label>
            <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input"
                style={{ width: '100%', padding: '6px' }}
            >
                <option value="accounting">📚 Contabilità</option>
                <option value="cloud">☁️ Cloud Computing</option>
            </select>
          </div>

          <input 
            className="input" 
            placeholder="Titolo (es. Dubbio su EC2 / Ratei)" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            style={{ marginBottom: 8, fontWeight: "bold" }} 
          />
          <textarea 
            className="input" 
            placeholder="Scrivi qui la tua domanda..." 
            rows={3} 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            style={{ resize: "vertical" }} 
          />
          <button 
            className="btn btnPrimary" 
            onClick={handleSaveNewNote} 
            disabled={loading} 
            style={{ width: "100%", marginTop: 8, background: "#8b5cf6" }}
          >
            {loading ? "Invio..." : "Invia al Tutor 📨"}
          </button>
        </div>
      )}

      {/* LISTA NOTE E CHAT */}
      <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 15 }}>
        {sortedNotes.length === 0 ? (
          <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: 10 }}>
            Nessuna nota presente. Chiedi pure se hai dubbi su Contabilità o Cloud!
          </div>
        ) : (
          sortedNotes.map((note, idx) => {
            // Calcolo stili badge in base al corso
            const badge = getCourseBadgeInfo(note.courseId);

            return (
              <div key={idx} style={{ padding: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, position: 'relative' }}>
                
                {/* Pulsante Eliminazione */}
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  title="Elimina intera nota"
                  style={{ 
                      position: 'absolute', top: 10, right: 10, 
                      background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: 14 
                  }}
                >
                  🗑️
                </button>

                {/* Badge Corso + Titolo */}
                <div style={{ display: "flex", flexDirection: 'column', marginBottom: 6, paddingRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ 
                        fontSize: 9, fontWeight: 800, 
                        background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                        padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5
                    }}>
                        {badge.label}
                    </span>
                    <span className="muted" style={{ fontSize: 11 }}>
                        {new Date(note.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, color: "#4b5563" }}>{note.title}</span>
                </div>
                
                <div style={{ fontSize: 14, color: "#1f2937", marginBottom: 12 }}>
                  {note.content}
                </div>

                {/* SEZIONE RISPOSTE (CHAT) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e5e7eb" }}>
                  
                  {/* Legacy Reply */}
                  {note.reply && (
                     <div style={msgStyle("tutor")}>
                        <div style={{fontSize: 10, fontWeight: 700, marginBottom: 2}}>TUTOR</div>
                        {note.reply}
                     </div>
                  )}

                  {/* Thread Replies */}
                  {note.replies && note.replies.map((msg, i) => (
                    <div key={i} style={msgStyle(msg.sender)}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2}}>
                          <span style={{fontSize: 10, fontWeight: 700, opacity: 0.7}}>
                              {msg.sender === "tutor" ? "👨‍🏫 TUTOR" : "👤 TU"}
                          </span>
                          <button 
                              onClick={() => handleDeleteReply(note.id, i)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 10, marginLeft: 5, padding: 0 }}
                              title="Elimina messaggio"
                          >
                              ×
                          </button>
                      </div>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* INPUT AREA */}
                {replyingToId === note.id ? (
                  <div style={{ marginTop: 10, display: "flex", gap: 5 }}>
                      <input 
                          className="input" 
                          autoFocus 
                          placeholder="Rispondi..." 
                          value={replyContent} 
                          onChange={e => setReplyContent(e.target.value)} 
                          style={{ fontSize: 13 }} 
                      />
                      <button className="btn btnPrimary" disabled={loading} onClick={() => handleReplyToThread(note)}>Invia</button>
                      <button className="btn" onClick={() => setReplyingToId(null)}>✕</button>
                  </div>
                ) : (
                  <button 
                      style={{ marginTop: 10, background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", textDecoration: "underline" }} 
                      onClick={() => setReplyingToId(note.id)}
                  >
                      ↩️ Rispondi al thread
                  </button>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper Style
const msgStyle = (sender) => ({
    alignSelf: sender === "student" ? "flex-end" : "flex-start",
    background: sender === "student" ? "#eff6ff" : "#ecfdf5",
    color: sender === "student" ? "#1e3a8a" : "#064e3b",
    border: sender === "student" ? "1px solid #dbeafe" : "1px solid #a7f3d0",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 13,
    maxWidth: "90%",
    marginLeft: sender === "student" ? "auto" : 0,
    marginRight: sender === "tutor" ? "auto" : 0,
});