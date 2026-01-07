import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { 
  collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, updateDoc, doc, where, setDoc, deleteField 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { createStudentAuthAccount } from "../lib/provisioning"; // <--- IMPORTA QUESTO
import Lessons from "./Lessons"; 
import TutorMaterials from "./TutorMaterials"; 

// ... imports e componenti esistenti ...

export default function Dashboard() {
  const [user, setUser] = useState(auth.currentUser);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState("lessons");

  const [isCreating, setIsCreating] = useState(false);
  const [err, setErr] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- STATI FORM CREAZIONE ---
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");     // NUOVO
  const [newPassword, setNewPassword] = useState(""); // NUOVO
  const [newCourse, setNewCourse] = useState("accounting"); 

  // Stati Chat (invariati...)
  const [replyingToNoteId, setReplyingToNoteId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // ... useEffect per caricamento dati (invariato) ...
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "students"), 
      where("tutorUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setErr(null);
    }, (error) => {
        console.error("Errore Dash:", error);
    });
    return () => unsub();
  }, [user]);

  // --- FUNZIONE CREAZIONE STUDENTE COMPLETA ---
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
        setErr("Compila tutti i campi (Nome, Email, Password).");
        return;
    }
    if (newPassword.length < 6) {
        setErr("La password deve essere di almeno 6 caratteri.");
        return;
    }
    
    setErr(null);
    setSuccessMsg("Creazione account in corso...");

    try {
      // 1. CREIAMO L'ACCOUNT AUTH (Email/Pass)
      const studentUid = await createStudentAuthAccount(newEmail, newPassword);

      // 2. CREIAMO IL DOCUMENTO RUOLO ('users')
      // Importante: Assegniamo subito il ruolo e il corso
      await setDoc(doc(db, "users", studentUid), {
        email: newEmail,
        role: "student",
        roadmapId: newCourse, // Sincronizziamo il corso anche qui
        createdAt: serverTimestamp()
      });

      // 3. CREIAMO IL PROFILO GESTIONALE ('students')
      // Ora abbiamo già lo studentUid, quindi lo inseriamo subito!
      await addDoc(collection(db, "students"), {
        tutorUid: user.uid,
        studentUid: studentUid, // <--- COLLEGAMENTO IMMEDIATO
        name: newName,
        roadmapId: newCourse, 
        createdAt: serverTimestamp(),
        baseline: 6, 
        goal: "Migliorare voti",
        completedLevels: [],
        sharedNotes: [] 
      });

      // Reset e Feedback
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewCourse("accounting");
      setIsCreating(false);
      setSuccessMsg(null);
      alert(`✅ Studente creato!\n\nEmail: ${newEmail}\nPassword: ${newPassword}\n\nConsegnale allo studente.`);
      
    } catch (e) { 
        console.error("Errore creazione:", e); 
        setErr("Errore: " + e.message); 
    }
  };

  // ... resto delle funzioni (claimStudent, resetSkillTree, handleLogout) ...
  const handleLogout = () => signOut(auth);
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const getCourseBadge = (roadmapId) => {
      if (roadmapId === 'cloud') return { label: 'CLOUD', color: '#2563eb', bg: '#dbeafe' };
      return { label: 'CONTA', color: '#991b1b', bg: '#fee2e2' }; 
  };
  // ... funzioni resetSpacedRepetition, resetSkillTree (invariate) ...
  const resetSkillTree = async (studentId) => { 
    console.log("🔧 resetSkillTree chiamato per studentId:", studentId);
    
    if (!confirm("⚠️ Sei sicuro di voler azzerare tutto lo Skill Tree dello studente? Questa azione non può essere annullata.")) {
      console.log("🔧 resetSkillTree annullato dall'utente");
      return;
    }
    
    try {
      console.log("🔧 resetSkillTree - preparando update...");
      const studentRef = doc(db, 'students', studentId);
      const updateData = {
        levelScores: {}, // 🔥 FIX: Svuota invece di deleteField()
        levelProgress: {},
        completedLevels: []
      };
      console.log("🔧 resetSkillTree - updateData:", updateData);
      
      await updateDoc(studentRef, updateData);
      console.log("🔧 resetSkillTree - update completato");
      
      setSuccessMsg("🎉 Skill Tree azzerato con successo!");
    } catch (error) {
      console.error("🔧 Errore azzeramento Skill Tree:", error);
      setErr("Errore durante l'azzeramento: " + error.message);
    }
  };
  
  const resetSRS = async (studentId) => { 
    console.log("🔧 resetSRS chiamato per studentId:", studentId);
    
    if (!confirm("⚠️ Sei sicuro di voler azzerare tutti i concetti SRS dello studente? Questa azione non può essere annullata.")) {
      console.log("🔧 resetSRS annullato dall'utente");
      return;
    }
    
    try {
      console.log("🔧 resetSRS - preparando update...");
      const studentRef = doc(db, 'students', studentId);
      const updateData = {
        srsItems: {} // 🔥 FIX: Svuota invece di deleteField()
      };
      console.log("🔧 resetSRS - updateData:", updateData);
      
      await updateDoc(studentRef, updateData);
      console.log("🔧 resetSRS - update completato");
      
      setSuccessMsg("🧠 Spaced Repetition azzerato con successo!");
    } catch (error) {
      console.error("🔧 Errore azzeramento SRS:", error);
      setErr("Errore durante l'azzeramento: " + error.message);
    }
  };
  
  const resetAll = async (studentId) => { 
    console.log("🔧 resetAll chiamato per studentId:", studentId);
    
    if (!confirm("🚨 SEI SICURO? Questa azione azzererà TUTTO lo studente:\n\n• Spaced Repetition\n• Skill Tree e progressi\n• Streak e attività giornaliera\n• Tutti i dati di apprendimento\n\nQuesta azione è IRREVERSIBILE!")) {
      console.log("🔧 resetAll annullato dall'utente");
      return;
    }
    
    try {
      console.log("🔧 resetAll - preparando update...");
      const studentRef = doc(db, 'students', studentId);
      const updateData = {
        srsItems: {}, // 🔥 FIX: Svuota invece di deleteField()
        levelScores: {},
        levelProgress: {},
        completedLevels: [],
        dailyActivity: {},
        activityData: {}
      };
      console.log("🔧 resetAll - updateData:", updateData);
      
      await updateDoc(studentRef, updateData);
      console.log("🔧 resetAll - update completato");
      
      setSuccessMsg("🎉 Tutti i dati dello studente sono stati azzerati!");
    } catch (error) {
      console.error("🔧 Errore azzeramento completo:", error);
      setErr("Errore durante l'azzeramento: " + error.message);
    }
  };

  // --- RENDER ---
  return (
    <div className="layout-wrapper" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      
      {/* TOPBAR (Invariata) */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 60, padding: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Tutor Dashboard 👨‍🏫</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>{user?.email}</span>
            <button className="btn btnGhost" onClick={handleLogout} style={{ fontSize: 12, padding: "6px 12px" }}>Esci</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 20, display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, paddingBottom: 40 }}>
        
        {/* COLONNA SINISTRA */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>I tuoi Studenti</h2>
            <button className="btn btnPrimary" onClick={() => setIsCreating(!isCreating)} style={{ padding: "4px 10px", lineHeight: 1 }}>
              {isCreating ? "×" : "+"}
            </button>
          </div>

          {err && <div className="toastErr" style={{fontSize: 12}}>{err}</div>}
          {successMsg && <div className="badge" style={{background: '#dcfce7', color: '#166534', marginBottom: 10, display: 'block'}}>{successMsg}</div>}

          {isCreating && (
            <form onSubmit={handleCreateStudent} className="card" style={{ marginBottom: 16, padding: 12, border: "2px solid var(--accent)" }}>
              <div style={{fontSize: 12, fontWeight: 700, marginBottom: 4}}>Dati Studente</div>
              <input 
                className="input" placeholder="Nome Cognome" autoFocus 
                value={newName} onChange={e => setNewName(e.target.value)} style={{ marginBottom: 8 }}
              />
              
              <div style={{fontSize: 12, fontWeight: 700, marginBottom: 4}}>Credenziali Accesso</div>
              <input 
                className="input" type="email" placeholder="Email (Login)" 
                value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ marginBottom: 8 }}
              />
              <input 
                className="input" type="text" placeholder="Password (min 6)" 
                value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ marginBottom: 8 }}
              />

              <div style={{fontSize: 12, fontWeight: 700, marginBottom: 4}}>Percorso Studi</div>
              <select 
                className="input" value={newCourse} onChange={e => setNewCourse(e.target.value)}
                style={{ width: '100%', marginBottom: 12 }}
              >
                <option value="accounting">📚 Contabilità</option>
                <option value="cloud">☁️ Cloud Comp.</option>
              </select>

              <button type="submit" className="btn btnPrimary" style={{ width: "100%" }}>Crea Account & Profilo</button>
            </form>
          )}

          {/* Lista Studenti (Invariata) */}
          <div style={{ display: "grid", gap: 8 }}>
            {students.map(s => {
              const badge = getCourseBadge(s.roadmapId);
              return (
                <div 
                  key={s.id} onClick={() => setSelectedStudentId(s.id)} className="card"
                  style={{ 
                    padding: "12px 14px", cursor: "pointer",
                    borderLeft: selectedStudentId === s.id ? "4px solid var(--accent)" : "1px solid var(--border)",
                    backgroundColor: selectedStudentId === s.id ? "#fff" : "rgba(255,255,255,0.6)"
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: badge.color, background: badge.bg, padding: '2px 4px', borderRadius: 4 }}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLONNA DESTRA (Dettaglio - Codice invariato salvo import) */}
        <div>
          {!selectedStudent ? (
            <div className="card muted" style={{ textAlign: "center", padding: 40, borderStyle: 'dashed' }}>
              👈 Seleziona uno studente.
            </div>
          ) : (
             /* --- QUI INSERISCI IL RESTO DEL COMPONENTE DETTAGLIO GIA PRESENTE IN DASHBOARD.JSX --- */
             /* (Per brevità non lo copio tutto, la logica di visualizzazione non cambia) */
            <div className="fadeIn">
                {/* ... Header Dettaglio ... */}
                <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid var(--accent2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{selectedStudent.name}</h1>
                    <span style={{ fontSize: 11, fontWeight: 800, color: getCourseBadge(selectedStudent.roadmapId).color, background: getCourseBadge(selectedStudent.roadmapId).bg, padding: '4px 8px', borderRadius: 6 }}>
                        {selectedStudent.roadmapId === 'cloud' ? 'CLOUD' : 'CONTA'}
                    </span>
                    </div>
                    {/* ... Bottoni Reset ... */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btnDanger" style={{ fontSize: 12, padding: "8px 12px" }} onClick={() => resetSkillTree(selectedStudent.id)}>🔄 Azzera Skill Tree</button>
                        <button className="btn btnWarning" style={{ fontSize: 12, padding: "8px 12px" }} onClick={() => resetSRS(selectedStudent.id)}>🧠 Azzera SRS</button>
                        <button className="btn btnDanger" style={{ fontSize: 12, padding: "8px 12px", background: '#dc2626', color: '#000000' }} onClick={() => resetAll(selectedStudent.id)}>🚨 Azzera Tutto</button>
                    </div>
                </div>

                {/* ... Tabs (Lessons/Materials/Notes) ... */}
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 20 }}>
                    <div style={{ display: "flex", background: "#e2e8f0", padding: 4, borderRadius: 12 }}>
                    <button onClick={() => setActiveTab("lessons")} style={{padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, background: activeTab === "lessons" ? "#fff" : "transparent"}}>📝 Lezioni</button>
                    <button onClick={() => setActiveTab("materials")} style={{padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, background: activeTab === "materials" ? "#fff" : "transparent"}}>🔗 Materiali</button>
                    <button onClick={() => setActiveTab("notes")} style={{padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, background: activeTab === "notes" ? "#fff" : "transparent"}}>📩 Chat</button>
                    </div>
                </div>

                {activeTab === "lessons" && <Lessons studentId={selectedStudent.id} baseline={selectedStudent.baseline || 0} />}
                {activeTab === "materials" && <TutorMaterials studentId={selectedStudent.id} />}
                {/* ... eccetera ... */}
            </div>
          )}
        </div>
      </div>
    </div>   
  );
}