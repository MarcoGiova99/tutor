import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, arrayUnion, limit, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation } from "react-router-dom"; 
import { motion } from "framer-motion"; 

import { auth, db } from "../lib/firebase";
import { ROADMAPS } from "../lib/roadmap"; 
import { triggerConfetti, playSound } from "../lib/gamification"; 
import ExerciseArena from "../components/ExerciseArena"; 

import "../styles/roadmap.css"; 

// Modale Fine Livello
function LevelCompleteModal({ results, onClose, bestScoreBefore, courseId }) {
  const { scorePercentage } = results;
  const isWin = scorePercentage >= 80;
  const isCloud = courseId === 'cloud';
  
  return (
    <div className="results-overlay">
      <div className="results-card" style={{background:'white', padding:40, borderRadius:20, textAlign:'center'}}>
         <div style={{fontSize: 60}}>{isWin ? "🎉" : "💪"}</div>
         <h1 style={{margin: "10px 0"}}>{isWin ? "Livello Completato!" : "Ritenta"}</h1>
         <div style={{fontSize:50, fontWeight:900, color: isWin ? (isCloud ? '#2563eb' : '#10b981') : '#f59e0b'}}>
            {scorePercentage}%
         </div>
         <button className="btn btnPrimary" onClick={onClose} style={{marginTop:20, background: isWin ? (isCloud ? '#2563eb' : '#10b981') : undefined}}>
            {isWin ? "Continua" : "Chiudi"}
         </button>
      </div>
    </div>
  );
}

export default function StudentPractice() {
  const [studentId, setStudentId] = useState(null);
  const [roadmapId, setRoadmapId] = useState("accounting"); 
  const [completedLevels, setCompletedLevels] = useState([]); 
  const [levelScores, setLevelScores] = useState({}); 
  const [levelProgress, setLevelProgress] = useState({}); 

  const [selectedLevel, setSelectedLevel] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);        
  const [loading, setLoading] = useState(true);
  const [lastResults, setLastResults] = useState(null); 
  const [tempBestScore, setTempBestScore] = useState(0);

  const location = useLocation();
  const activeRoadmap = ROADMAPS[roadmapId] || ROADMAPS['accounting'];
  const isCloud = roadmapId === 'cloud';

  // 1. CARICAMENTO DATI
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }

      try {
        const q = query(collection(db, "students"), where("studentUid", "==", user.uid), limit(1));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const sDoc = snap.docs[0];
          setStudentId(sDoc.id);
          const data = sDoc.data();
          
          setRoadmapId(data.roadmapId || "accounting"); 
          setCompletedLevels(data.completedLevels || []);
          setLevelScores(data.levelScores || {}); 
          setLevelProgress(data.levelProgress || {});
          
          if (location.state?.autoOpenLevelId) {
             const currentMap = ROADMAPS[data.roadmapId || "accounting"];
             const node = currentMap.find(n => n.id === location.state.autoOpenLevelId);
             if (node) setSelectedLevel(node);
          }
        }
      } catch (error) { console.error("Errore student:", error); } 
      finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, [location.state]); 

  const handleStartLevel = () => { playSound('whoosh'); setIsPlaying(true); };

  const handleNodeClick = (node, status) => {
      if (status === 'locked') { playSound('wrong'); return; }
      playSound('pop');
      setSelectedLevel(node);
  }

  // 2. FINE LIVELLO E SALVATAGGIO SRS
  const handleLevelComplete = async (resultsData) => {
    const { levelId, scorePercentage, history } = resultsData;
    
    // 🔥 CRITICAL DEBUG: Verifica dati fondamentali
    console.log("🚨 CRITICAL - handleLevelComplete chiamato");
    console.log("🚨 studentId:", studentId);
    console.log("🚨 history:", history);
    console.log("🚨 levelId:", levelId);
    
    if (!studentId) {
      console.error("❌ ERRORE: studentId è null/undefined!");
      return;
    }
    
    if (!history || history.length === 0) {
      console.error("❌ ERRORE: history è vuota!");
      return;
    }
    
    // DEBUG: Verifica i dati ricevuti dal nuovo hook
    console.log("🔍 Dati ricevuti da ExerciseArena:", { levelId, scorePercentage, history });
    console.log("🔍 History dettagliata:", JSON.stringify(history, null, 2));
    
    // UI Update immediato
    const previousScore = levelScores[levelId] || 0;
    setTempBestScore(previousScore);
    const bestScore = Math.max(previousScore, scorePercentage);
    
    if (scorePercentage >= 80) triggerConfetti(roadmapId);
    setLevelScores(prev => ({ ...prev, [levelId]: bestScore }));
    
    if (bestScore >= 80) {
        setCompletedLevels(prev => !prev.includes(levelId) ? [...prev, levelId] : prev);
    }

    setIsPlaying(false);
    setSelectedLevel(null);
    setLastResults(resultsData); 
    
    // SALVATAGGIO SU DATABASE
    if (studentId) {
      try {
        const studentRef = doc(db, "students", studentId);
        
        // --- LOGICA SRS CRUCIALE ---
        // 1. Trova errori
        const mistakes = history.filter(h => !h.isCorrect);
        
        // DEBUG: Verifica gli errori trovati
        console.log("🔍 Errori trovati per SRS:", mistakes);
        console.log("🔍 Numero di errori:", mistakes.length);
        
        // 2. Costruisci oggetto srsItems completo
        const srsItemsToAdd = {};
        mistakes.forEach(mistake => {
            // Controllo di sicurezza: salva solo se c'è testo
            if (mistake.questionSnapshot && mistake.questionSnapshot.text) {
                console.log("🔍 Salvando errore SRS:", mistake.questionSnapshot.text);
                // Chiave univoca basata sull'ID della domanda
                srsItemsToAdd[mistake.questionId] = {
                    text: mistake.questionSnapshot.text,
                    explanation: mistake.questionSnapshot.explanation || "Nessuna spiegazione.",
                    dueDate: new Date(), // SCADE ADESSO -> Va subito nel widget
                    interval: 0,
                    createdAt: new Date()
                };
            } else {
                console.log("⚠️ Errore senza questionSnapshot valido:", mistake);
            }
        });

        console.log("🔍 srsItemsToAdd completo:", srsItemsToAdd);

        const updateData = {
            [`levelScores.${levelId}`]: bestScore,
            [`levelProgress.${levelId}`]: bestScore >= 80 ? 0 : bestScore,
            srsItems: srsItemsToAdd // 🔥 FIX: Salva come oggetto completo
        };

        console.log("🔍 UpdateData finale per SRS:", updateData);

        if (bestScore >= 80) updateData.completedLevels = arrayUnion(levelId);
        
        await setDoc(studentRef, updateData, { merge: true });
        console.log("✅ Salvataggio SRS completato. Errori salvati:", mistakes.length);
        console.log("🔍 UpdateData inviato a Firebase:", updateData);
        
        // 🔥 DEBUG: Verifica immediata del salvataggio
        setTimeout(async () => {
          try {
            const studentDoc = await getDoc(studentRef);
            const savedData = studentDoc.data();
            console.log("🔍 Dati salvati in Firebase:", savedData.srsItems);
            console.log("🔍 srsItems type:", typeof savedData.srsItems);
            console.log("🔍 srsItems keys:", Object.keys(savedData.srsItems || {}));
            console.log("🔍 Numero di item SRS salvati:", Object.keys(savedData.srsItems || {}).length);
          } catch (e) {
            console.error("❌ Errore verifica salvataggio:", e);
          }
        }, 1000);

      } catch (e) { console.error("❌ Errore salvataggio:", e); }
    }
  };

  if (lastResults) return <LevelCompleteModal results={lastResults} onClose={() => setLastResults(null)} bestScoreBefore={tempBestScore} courseId={roadmapId} />;
  
  // FIX: Renderizziamo ExerciseArena SOLO se abbiamo selectedLevel E levelId valido
  if (isPlaying && selectedLevel && selectedLevel.id) {
    return (
      <ExerciseArena
        levelId={selectedLevel.id}
        onClose={() => { setIsPlaying(false); setSelectedLevel(null); }}
        onComplete={handleLevelComplete}
        studentId={studentId} // 🔥 NUOVO: Passa studentId per tracking
      />
    );
  }

  if (loading) return <div className="container muted">Caricamento...</div>;

  return (
    <div className={`container ${isCloud ? 'roadmap-cloud' : ''}`}>
       <div style={{ marginBottom: 20 }}>
            <h1 className="bigTitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isCloud ? 'Cloud Path ☁️' : 'Skill Tree 🌳'}
            </h1>
            <p className="muted">Completa i nodi (80% min) per sbloccare i successivi.</p>
       </div>
       <div className="roadmap-container">
           <svg className="roadmap-path-svg"><line x1="50%" y1="0" x2="50%" y2="100%" className="path-line" /></svg>
           {activeRoadmap.map((node) => {
               const status = completedLevels.includes(node.id) ? 'completed' : ((!node.req || completedLevels.includes(node.req)) ? 'current' : 'locked');
               let indentClass = "indent-0";
               if (node.indent === -1) indentClass = "indent-left";
               if (node.indent === 1) indentClass = "indent-right";
               return (
                   <div key={node.id} className={`node-wrapper ${indentClass} node-status-${status}`} onClick={() => handleNodeClick(node, status)}>
                       <div className="node-circle">{status === 'completed' ? '✅' : node.icon}</div>
                       <div className="node-label">
                            <div className="node-title">{node.title}</div>
                            {levelScores[node.id] && (<div style={{fontSize: 10, color: levelScores[node.id] >= 80 ? (isCloud?'#60a5fa':'#4ade80') : '#f59e0b'}}>{levelScores[node.id]}%</div>)}
                       </div>
                   </div>
               )
           })}
       </div>
       {selectedLevel && (
        <div className="modal-overlay" onClick={() => setSelectedLevel(null)}>
          <div className="card modal-card" onClick={e => e.stopPropagation()} style={{borderTop: `4px solid ${isCloud ? '#2563eb' : '#10b981'}`}}>
             <div style={{fontSize:50, marginBottom:10}}>{selectedLevel.icon}</div>
             <h2 style={{margin:0}}>{selectedLevel.title}</h2>
             <p className="muted">{selectedLevel.subtitle}</p>
             <button className="btn btnPrimary" onClick={handleStartLevel} style={{width: '100%', marginTop: 20, background: isCloud ? '#2563eb' : undefined}}>🚀 Inizia Lezione</button>
          </div>
        </div>
       )}
    </div>
  );
}