import React, { useState, useEffect } from "react";
import { collection, writeBatch, doc, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ROADMAPS } from "../lib/roadmap"; // MODIFICA: Importiamo l'oggetto plurale

/**
 * AdminSeed Page (Backoffice Tool)
 * * Strumento interno per popolare la collezione 'questions' su Firestore.
 * * Aggiornato per gestire MULTI-CORSO (Contabilità + Cloud).
 */
export default function AdminSeed() {
  const [status, setStatus] = useState("Ready.");
  const [jsonInput, setJsonInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // MODIFICA: Stato per i Tab (Default su Cloud perché è quello dinamico)
  const [activeTab, setActiveTab] = useState('cloud'); 

  // --- 1. INITIALIZATION: LOAD BACKUP HISTORY ---
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "upload_history"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching upload history:", e);
    }
  };

  // --- 2. CORE UPLOAD FUNCTION ---
  const handleUploadToLevel = async (levelId, levelTitle) => {
    if (!jsonInput) {
      alert("⚠️ Incolla prima il JSON.");
      return;
    }

    // Conferma con indicazione del corso
    const courseLabel = activeTab === 'cloud' ? "CLOUD COMPUTING" : "CONTABILITÀ";
    if (!confirm(`Stai per caricare domande per:\nCORSO: ${courseLabel}\nLIVELLO: "${levelTitle}" (${levelId})\n\nProcedere?`)) return;

    setLoading(true);
    setStatus("⏳ Processing and Uploading...");

    try {
      const parsedQuestions = JSON.parse(jsonInput);
      if (!Array.isArray(parsedQuestions)) throw new Error("JSON format error: Root must be an array [...]");

      // Batch Write
      const batch = writeBatch(db);
      
      parsedQuestions.forEach((q) => {
        const docRef = doc(collection(db, "questions")); // Auto-ID
        batch.set(docRef, {
          ...q,
          levelId: levelId,
          courseId: activeTab, // MODIFICA: Salviamo il corso (cloud/accounting)
          createdAt: new Date()
        });
      });
      
      await batch.commit();

      // Backup Entry
      await addDoc(collection(db, "upload_history"), {
        levelId: levelId,
        levelTitle: levelTitle,
        courseId: activeTab, // Backup del corso
        jsonContent: jsonInput,
        count: parsedQuestions.length,
        createdAt: new Date()
      });

      setStatus(`✅ SUCCESS! Caricate ${parsedQuestions.length} domande in ${levelTitle} (${activeTab}).`);
      setJsonInput(""); 
      fetchHistory();   

    } catch (e) {
      console.error(e);
      setStatus("❌ Error: " + e.message);
      alert("Errore JSON o Upload. Controlla la console.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. DANGER ZONE: DELETE BY COURSE ---
  // Cancella TUTTO il database (entrambi i corsi)
  const handleDeleteAllDatabase = async () => {
    const code = prompt("⚠️ Scrivi 'DELETE_ALL_DB' per cancellare COMPLETAMENTE il database.\n\nQuesta azione cancellerà TUTTE le domande di ENTRAMBI i corsi (Cloud + Contabilità).\nQuesta azione è IRREVERSIBILE!");
    if (code !== "DELETE_ALL_DB") return;

    setLoading(true);
    setStatus("🗑️ Cancellazione COMPLETA database...");

    try {
      // Cancella TUTTE le domande senza filtro
      const q = query(collection(db, "questions"));
      const snap = await getDocs(q);

      if (snap.empty) {
        setStatus("Nessuna domanda trovata nel database.");
        setLoading(false);
        return;
      }

      // Firestore Batch limit is 500, potrebbero servire batch multipli
      const batch = writeBatch(db);
      let batchCount = 0;
      
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
        batchCount++;
        
        // Esegui il batch ogni 500 operazioni
        if (batchCount >= 500) {
          batch.commit();
          console.log(`Eseguito batch con ${batchCount} operazioni`);
        }
      });

      if (batchCount > 0 && batchCount < 500) {
        await batch.commit();
      }

      setStatus(`✅ Cancellate ${snap.docs.length} domande TOTALI dal database!`);
      setTimeout(() => setStatus("Ready."), 3000);
    } catch (e) {
      console.error(e);
      setStatus("❌ Errore durante la cancellazione completa del database.");
    } finally {
      setLoading(false);
    }
  };

  // Cancella solo il corso attivo
  const handleDeleteActiveCourse = async () => {
    const courseName = activeTab === 'cloud' ? 'Cloud Computing' : 'Contabilità';
    const code = prompt(`⚠️ Scrivi 'DELETE_COURSE' per cancellare SOLO le domande del corso: ${courseName}.\n\nQuesta azione non può essere annullata.`);
    if (code !== "DELETE_COURSE") return;

    setLoading(true);
    setStatus(`🗑️ Cancellazione domande ${courseName}...`);

    try {
      const q = query(collection(db, "questions"), where("courseId", "==", activeTab));
      const snap = await getDocs(q);

      if (snap.empty) {
        setStatus(`Nessuna domanda trovata per ${courseName}.`);
        setLoading(false);
        return;
      }

      // Firestore Batch limit is 500
      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      setStatus(`✅ Cancellate ${snap.docs.length} domande di ${courseName} con successo!`);
      setTimeout(() => setStatus("Ready."), 3000);
    } catch (e) {
      console.error(e);
      setStatus(`❌ Errore durante la cancellazione delle domande di ${courseName}.`);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = (backupItem) => {
    setJsonInput(backupItem.jsonContent);
    setStatus(`♻️ Backup del ${new Date(backupItem.createdAt.seconds * 1000).toLocaleDateString()} ripristinato.`);
    // Se il backup era di un altro corso, switchiamo tab
    if (backupItem.courseId && backupItem.courseId !== activeTab) {
        setActiveTab(backupItem.courseId);
    }
    window.scrollTo(0, 0);
  };

  // Helper per colori
  const themeColor = activeTab === 'cloud' ? '#2563eb' : '#991b1b';
  const themeBg = activeTab === 'cloud' ? '#eff6ff' : '#fef2f2';

  return (
    <div className="container" style={{ padding: "40px 20px", maxWidth: 900, margin: '0 auto' }}>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
        <h1>🛠️ Admin Seeding Tool</h1>
      </div>

      {/* --- TABS DI SELEZIONE CORSO --- */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        <button
            onClick={() => setActiveTab('cloud')}
            style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === 'cloud' ? '#eff6ff' : 'transparent',
                color: activeTab === 'cloud' ? '#2563eb' : '#64748b',
                fontWeight: 'bold',
                borderBottom: activeTab === 'cloud' ? '3px solid #2563eb' : '3px solid transparent',
                cursor: 'pointer'
            }}
        >
            ☁️ Cloud Computing
        </button>
        <button
            onClick={() => setActiveTab('accounting')}
            style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === 'accounting' ? '#fef2f2' : 'transparent',
                color: activeTab === 'accounting' ? '#991b1b' : '#64748b',
                fontWeight: 'bold',
                borderBottom: activeTab === 'accounting' ? '3px solid #991b1b' : '3px solid transparent',
                cursor: 'pointer'
            }}
        >
            📚 Contabilità
        </button>
      </div>

      {/* STATUS BAR */}
      <div style={{ padding: 15, background: '#f8fafc', borderRadius: 8, marginBottom: 20, borderLeft: `5px solid ${themeColor}` }}>
        <strong>Status:</strong> {status}
      </div>

      {/* JSON INPUT AREA */}
      <div style={{ marginBottom: 30 }}>
        <label style={{fontWeight:'bold', display:'block', marginBottom: 8}}>1. Incolla JSON (Generato da AI):</label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='[ { "type": "quiz", "question": "...", "options": [...] } ]'
          style={{
            width: "100%", height: 200, padding: 15, fontFamily: 'monospace', fontSize: 13,
            borderRadius: 12, border: '2px solid #e2e8f0', background: '#fff'
          }}
        />
      </div>

      {/* TARGET SELECTION GRID */}
      <div style={{ marginBottom: 40 }}>
        <label style={{fontWeight:'bold', display:'block', marginBottom: 15}}>
            2. Seleziona Livello {activeTab === 'cloud' ? 'Cloud' : 'Contabilità'}:
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
          {/* MAPPIAMO LA LISTA CORRETTA IN BASE AL TAB */}
          {ROADMAPS[activeTab].map((level) => (
            <button
              key={level.id}
              onClick={() => handleUploadToLevel(level.id, level.title)}
              style={{
                padding: 20,
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span style={{fontSize: 24, marginBottom: 5}}>{level.icon}</span>
              <span style={{fontSize: 14, fontWeight: 'bold'}}>{level.title}</span>
              <span style={{fontSize: 10, opacity: 0.7, marginTop: 4}}>{level.id}</span>
            </button>
          ))}
        </div>
      </div>

      <hr style={{margin: "40px 0", borderColor: "#e2e8f0"}}/>

      {/* DANGER ZONE */}
      <div style={{ marginTop: 40, padding: 20, background: '#fef2f2', borderRadius: 12, border: '2px solid #fca5a5' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#991b1b' }}>⚠️ ZONA PERICOLO</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: 13, color: '#7f1d1d' }}>
          Azioni irreversibili sul database. Usare con estrema cautela.
        </p>
        
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={handleDeleteAllDatabase}
            className="btn"
            style={{background: '#991b1b', color: 'white', fontWeight: 'bold', fontSize: 12}}
            disabled={loading}
          >
            💥 Cancella TUTTO il DB
          </button>
          
          <button 
            onClick={handleDeleteActiveCourse}
            className="btn"
            style={{background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: 12}}
            disabled={loading}
          >
            🗑️ Cancella solo {activeTab === 'cloud' ? 'Cloud' : 'Contabilità'}
          </button>
        </div>
      </div>

      {/* HISTORY */}
      <div>
        <h3>📂 Storico Upload</h3>
        <div style={{display:'flex', flexDirection:'column', gap: 10}}>
          {history.map((item) => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 15, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8
            }}>
              <div>
                <div style={{fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8}}>
                  {item.courseId === 'cloud' ? '☁️' : '📚'} {item.levelTitle}
                </div>
                <div style={{fontSize: 12, color: '#64748b', marginTop: 4}}>
                  ID: {item.levelId} • {new Date(item.createdAt?.seconds * 1000).toLocaleString()} • {item.count} domande
                </div>
              </div>

              <button 
                  onClick={() => restoreBackup(item)}
                  className="btn btnGhost"
                  style={{fontSize: 12, border: '1px solid #cbd5e1'}}
                >
                  ↩️ Restore
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}