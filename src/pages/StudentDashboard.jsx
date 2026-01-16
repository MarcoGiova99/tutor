import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit, doc, updateDoc, deleteField } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";

import { db, auth } from '../lib/firebase';
import { ROADMAPS } from '../lib/roadmap';
import { EXERCISES_DB } from '../lib/exercises_data'; // Opzionale, per stats
import { triggerConfetti, playSound } from "../lib/gamification";

import DailyReviewWidget from "../components/DailyReviewWidget";
import SharedNotesWidget from "../components/SharedNotesWidget";
import StreakWidget from "../components/StreakWidget";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

  // Funzione per azzerare SRS
  const resetSRS = async () => {
    if (!studentData?.id) return;

    if (!confirm("⚠️ Sei sicuro di voler azzerare tutti i concetti da ripassare? Questa azione non può essere annullata.")) {
      return;
    }

    try {
      const studentRef = doc(db, 'students', studentData.id);
      await updateDoc(studentRef, {
        srsItems: deleteField()
      });

      playSound('win');
      alert("✅ Spaced Repetition azzerato con successo!");
    } catch (error) {
      console.error("Errore azzeramento SRS:", error);
      alert("❌ Errore durante l'azzeramento. Riprova.");
    }
  };

  // Funzione per azzerare Skill Tree
  const resetSkillTree = async () => {
    if (!studentData?.id) return;

    if (!confirm("⚠️ Sei sicuro di voler azzerare tutto il Skill Tree? Perderai tutti i progressi e livelli completati. Questa azione non può essere annullata.")) {
      return;
    }

    try {
      const studentRef = doc(db, 'students', studentData.id);
      await updateDoc(studentRef, {
        levelScores: deleteField(),
        levelProgress: deleteField(),
        completedLevels: deleteField()
      });

      playSound('win');
      triggerConfetti();
      alert("🎉 Skill Tree azzerato con successo! Ricomincia da capo!");
    } catch (error) {
      console.error("Errore azzeramento Skill Tree:", error);
      alert("❌ Errore durante l'azzeramento. Riprova.");
    }
  };

  // Funzione per azzerare tutto (SRS + Skill Tree + Streak)
  const resetAll = async () => {
    if (!studentData?.id) return;

    if (!confirm("🚨 SEI SICURO? Questa azione azzererà TUTTO:\n\n• Spaced Repetition\n• Skill Tree e progressi\n• Streak e attività giornaliera\n• Tutti i dati di apprendimento\n\nQuesta azione è IRREVERSIBILE!")) {
      return;
    }

    try {
      const studentRef = doc(db, 'students', studentData.id);
      await updateDoc(studentRef, {
        srsItems: deleteField(),
        levelScores: deleteField(),
        levelProgress: deleteField(),
        completedLevels: deleteField(),
        dailyActivity: deleteField(),
        activityData: deleteField()
      });

      playSound('win');
      triggerConfetti();
      alert("🎉 Tutti i dati sono stati azzerati! Bentornata all'inizio!");
    } catch (error) {
      console.error("Errore azzeramento completo:", error);
      alert("❌ Errore durante l'azzeramento. Riprova.");
    }
  };

  // --- 1. CARICAMENTO DATI ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }

      const qStudent = query(
        collection(db, 'students'),
        where('studentUid', '==', user.uid),
        limit(1)
      );

      const unsubscribeSnapshot = onSnapshot(qStudent, (snapshot) => {
        if (!snapshot.empty) {
          const newStudentData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          console.log("🔍 StudentDashboard - Dati aggiornati:", newStudentData);
          console.log("🔍 StudentDashboard - srsItems:", newStudentData.srsItems);
          console.log("🔍 StudentDashboard - srsItems type:", typeof newStudentData.srsItems);
          console.log("🔍 StudentDashboard - srsItems keys:", Object.keys(newStudentData.srsItems || {}));
          console.log("🔍 StudentDashboard - Numero SRS:", Object.keys(newStudentData.srsItems || {}).length);
          console.log("🔍 StudentDashboard - activityData:", newStudentData.activityData);
          console.log("🔍 StudentDashboard - dailyActivity:", newStudentData.dailyActivity);

          const today = new Date().toISOString().split('T')[0];
          console.log("🔍 StudentDashboard - today:", today);
          console.log("🔍 StudentDashboard - todayActivity:", newStudentData.dailyActivity?.[today]);

          setStudentData(newStudentData);
        }
        setLoading(false);
      }, (error) => {
        console.error("Errore caricamento dashboard:", error);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // --- LOGICA UI ---
  if (loading) return <div className="container muted" style={{ paddingTop: 40 }}>Caricamento HQ...</div>;
  if (!studentData) return <div className="container toastErr" style={{ marginTop: 40 }}>Profilo studente non trovato.</div>;

  const currentRoadmapId = studentData.roadmapId || 'accounting';
  const isCloud = currentRoadmapId === 'cloud';
  const activeRoadmap = ROADMAPS[currentRoadmapId] || ROADMAPS['accounting'];
  const themeColor = isCloud ? '#2563eb' : 'var(--accent)';
  const themeBadgeBg = isCloud ? '#eff6ff' : '#ecfdf5';
  const themeBadgeText = isCloud ? '#1e40af' : '#064e3b';

  const completedLevels = studentData.completedLevels || [];
  const nextLevelIndex = activeRoadmap.findIndex(node => !completedLevels.includes(node.id));
  const nextLevel = nextLevelIndex !== -1 ? activeRoadmap[nextLevelIndex] : null;
  const isAllComplete = nextLevelIndex === -1 && completedLevels.length > 0;

  const totalLevels = activeRoadmap.length;
  const totalScore = activeRoadmap.reduce((acc, level) => {
    if (completedLevels.includes(level.id)) return acc + 100;
    const partial = studentData.levelProgress?.[level.id] || 0;
    return acc + partial;
  }, 0);
  const treeProgress = totalLevels > 0 ? Math.round(totalScore / totalLevels) : 0;

  let playerTitle = "Novizio";
  if (treeProgress > 30) playerTitle = "Apprendista";
  if (treeProgress > 60) playerTitle = isCloud ? "Cloud Architect" : "Mastro Contabile";
  if (treeProgress === 100) playerTitle = isCloud ? "DevOps Guru 🦁" : "CFO Leggendario 🦁";

  // Calcolo esercizi risolti (stima mista statico/dinamico)
  const exercisesSolved = completedLevels.reduce((total, levelId) => {
    const staticCount = (EXERCISES_DB?.[levelId] || []).length;
    return total + (staticCount > 0 ? staticCount : 10);
  }, 0);

  return (
    <div className="container">
      {/* HEADER */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="bigTitle" style={{ fontSize: 28, margin: 0 }}>Bentornata, {studentData.name.split(' ')[0]} 👋</h1>
            <span style={{ fontSize: 10, fontWeight: 800, background: themeBadgeBg, color: themeBadgeText, padding: '4px 8px', borderRadius: 6, border: `1px solid ${themeColor}` }}>
              {isCloud ? 'CLOUD' : 'CONTABILITÀ'}
            </span>
          </div>

        </div>

      </div>



      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 1. WIDGET STREAK SYSTEM */}
          <StreakWidget
            key={`streak-${studentData?.activityData?.currentStreak || 0}-${studentData?.activityData?.lastStudyDate || 'none'}`}
            studentData={studentData}
          />

          {/* 2. WIDGET SRS */}
          <DailyReviewWidget
            key={`srs-${Object.keys(studentData?.srsItems || {}).length}-${Date.now()}`}
            studentData={studentData}
          />

          {/* 4. PROSSIMA MISSIONE */}
          <div className="sectionTitle">Prossima Missione</div>
          {nextLevel ? (
            <div className="card" style={{ borderLeft: `6px solid ${themeColor}`, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: themeColor }}>LIVELLO {nextLevelIndex + 1}</div>
              <h2>{nextLevel.title}</h2>
              <p className="muted">{nextLevel.subtitle}</p>
              <Link to="/student/practice" state={{ autoOpenLevelId: nextLevel.id }}>
                <button className="btn btnPrimary" style={{ background: isCloud ? '#2563eb' : undefined }}>
                  🚀 Vai alla Mappa
                </button>
              </Link>
            </div>
          ) : (
            <div className="card" style={{ background: themeColor, color: 'white' }}>
              <h2>Corso Completato! 🏆</h2>
            </div>
          )}
        </div>

        <div>
          <div className="sectionTitle">Le tue Statistiche</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 8 }}>📚 Livelli: <strong>{completedLevels.length}</strong></div>
            <div style={{ marginBottom: 8 }}>⚡️ Esercizi: <strong>{exercisesSolved}</strong></div>
            <div>🧠 Concetti SRS: <strong>{Object.keys(studentData.srsItems || {}).length}</strong></div>
          </div>

          <SharedNotesWidget studentDocId={studentData.id} notes={studentData.sharedNotes} />
        </div>
      </div>
    </div>
  );
}