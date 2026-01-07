import React, { useState, useEffect } from "react";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getNextInterval, isDue } from "../lib/spacedRepetition";
import { updateDailyActivity } from "../lib/streakSystem";

export default function DailyReviewWidget({ studentData }) {
  const [selectedItem, setSelectedItem] = useState(null); 
  
  // Sincronizzato con StudentPractice
  const srsItems = studentData?.srsItems || {};
  
  // 🔥 DEBUG: Monitora cambiamenti srsItems
  useEffect(() => {
    console.log("🔍 DailyReviewWidget - useEffect srsItems cambiati:", srsItems);
    console.log("🔍 DailyReviewWidget - Numero item SRS:", Object.keys(srsItems).length);
  }, [srsItems]);
  
  // DEBUG: Controlla in console se srsItems contiene dati
  console.log("🔍 DailyReviewWidget - Render con dati SRS:", srsItems);
  console.log("🔍 DailyReviewWidget - Numero di item SRS:", Object.keys(srsItems).length);
  console.log("🔍 DailyReviewWidget - studentData completo:", studentData);

  // Filtriamo gli item che devono essere ripassati oggi
  const dueItems = Object.entries(srsItems).filter(([id, item]) => {
      const isItemDue = isDue(item.dueDate);
      console.log(`🔍 Item ${id}:`, item, "Scaduto?", isItemDue);
      return isItemDue;
  });

  console.log("🔍 DailyReviewWidget - Item scaduti oggi:", dueItems.length);

  // 🔥 DEBUG: Mostra sempre il widget per vedere cosa succede
  if (dueItems.length === 0) {
    return (
      <div style={{ marginBottom: 30, border: '2px solid #e5e7eb', borderRadius: 16, padding: 20, background: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
            <span style={{ fontSize: 24 }}>🧠</span>
            <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#6b7280' }}>Spaced Repetition</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                  {Object.keys(srsItems).length > 0 
                    ? `Hai ${Object.keys(srsItems).length} concetti totali, nessuno scaduto oggi` 
                    : 'Nessun concetto da ripassare. Sbaglia un esercizio per attivare SRS!'
                  }
                </p>
            </div>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: 10, borderRadius: 8 }}>
          DEBUG: srsItems = {Object.keys(srsItems).length} | dueItems = {dueItems.length}
        </div>
      </div>
    );
  }

  const handleGotIt = async () => {
    if (!selectedItem || !studentData.id) return;
    const [qId, data] = selectedItem;
    const nextInt = getNextInterval(data.interval || 0);
    const studentRef = doc(db, "students", studentData.id);

    try {
        if (nextInt === null) {
            await updateDoc(studentRef, { [`srsItems.${qId}`]: deleteField() });
        } else {
            await updateDoc(studentRef, { 
                [`srsItems.${qId}.interval`]: nextInt,
                [`srsItems.${qId}.dueDate`]: new Date(Date.now() + nextInt * 24 * 60 * 60 * 1000)
            });
        }
        
        // 🔥 NUOVO: Traccia SRS review completata
        await updateDailyActivity(studentData.id, {
          srsReviews: 1
        });
        
        setSelectedItem(null);
    } catch (e) {
        console.error("Errore aggiornamento SRS:", e);
    }
  };

  if (dueItems.length === 0) return null;

  return (
    <div style={{ marginBottom: 30, border: '2px solid #fee2e2', borderRadius: 16, padding: 20, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
            <span style={{ fontSize: 24 }}>🧠</span>
            <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#991b1b' }}>Spaced Repetition</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>Hai {dueItems.length} concetti da fissare oggi.</p>
            </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
            {dueItems.map(([id, item], idx) => (
                <div key={id} style={{ 
                    background: '#fef2f2', padding: '15px', borderRadius: 12, border: '1px solid #fee2e2', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                    <div style={{ overflow: 'hidden', marginRight: 15 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Flashcard {idx + 1}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#7f1d1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.text}
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedItem([id, item])}
                        style={{ background: '#e11d48', color: 'white', padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Ripassa 🎓
                    </button>
                </div>
            ))}
        </div>

        {selectedItem && (
            <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                <div className="card modal-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'left', maxWidth: 500 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>RIPASSO GUIDATO</div>
                        <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
                    </div>
                    <h2 style={{ fontSize: 20, marginBottom: 20 }}>{selectedItem[1].text}</h2>
                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: 20, borderRadius: 12, display: 'flex', gap: 15, marginBottom: 25 }}>
                        <div style={{ fontSize: 24 }}>💡</div>
                        <div style={{ fontSize: 15, color: '#92400e', lineHeight: 1.5 }}>{selectedItem[1].explanation}</div>
                    </div>
                    <button onClick={handleGotIt} className="btn btnPrimary" style={{ width: '100%', padding: 16 }}>
                        Ho capito, prossima volta! 👍
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}