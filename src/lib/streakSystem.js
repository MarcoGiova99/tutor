/**
 * STREAK SYSTEM & DAILY GOALS
 * Gestisce streak di studio consecutivi e obiettivi giornalieri
 */

import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Configurazione obiettivi giornalieri
export const DAILY_GOALS = {
  beginner: {
    exercises: 5,
    srsReviews: 3,
    studyTime: 10 // minuti
  },
  intermediate: {
    exercises: 10,
    srsReviews: 5,
    studyTime: 20
  },
  advanced: {
    exercises: 15,
    srsReviews: 8,
    studyTime: 30
  }
};

// Calcola streak attuale
export const calculateStreak = (activityData) => {
  if (!activityData || !activityData.lastStudyDate) return { current: 0, longest: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastStudy = new Date(activityData.lastStudyDate);
  lastStudy.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Ha studiato oggi
    return {
      current: activityData.currentStreak || 1,
      longest: activityData.longestStreak || 1
    };
  } else if (daysDiff === 1) {
    // Ha studiato ieri
    return {
      current: activityData.currentStreak || 0,
      longest: activityData.longestStreak || 0
    };
  } else {
    // Ha perso la streak
    return {
      current: 0,
      longest: activityData.longestStreak || 0
    };
  }
};

// Aggiorna attività giornaliera
export const updateDailyActivity = async (studentId, activity) => {
  console.log("🔥 updateDailyActivity chiamato:", { studentId, activity });
  
  const studentRef = doc(db, 'students', studentId);
  const studentDoc = await getDoc(studentRef);
  const studentData = studentDoc.data();
  
  console.log("🔥 Dati studente prima dell'update:", studentData);
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const currentActivity = studentData.dailyActivity || {};
  const todayActivity = currentActivity[today] || {
    exercises: 0,
    srsReviews: 0,
    studyTime: 0,
    completed: false,
    timestamp: serverTimestamp()
  };
  
  console.log("🔥 Attività di oggi prima:", todayActivity);
  
  // 🔥 FIX: Somma i valori invece di sovrascrivere
  const updatedActivity = {
    ...todayActivity,
    exercises: (todayActivity.exercises || 0) + (activity.exercises || 0),
    srsReviews: (todayActivity.srsReviews || 0) + (activity.srsReviews || 0),
    studyTime: (todayActivity.studyTime || 0) + (activity.studyTime || 0),
    timestamp: serverTimestamp()
  };
  
  console.log("🔥 Attività di oggi dopo (somma):", updatedActivity);
  
  // Verifica se ha completato gli obiettivi
  const userLevel = getUserLevel(studentData);
  const goals = DAILY_GOALS[userLevel];
  
  updatedActivity.completed = 
    updatedActivity.exercises >= goals.exercises &&
    updatedActivity.srsReviews >= goals.srsReviews &&
    updatedActivity.studyTime >= goals.studyTime;
  
  console.log("🔥 Goals completati?", updatedActivity.completed);
  console.log("🔥 Goals:", goals);
  console.log("🔥 Progress esercizi:", updatedActivity.exercises, "/", goals.exercises);
  console.log("🔥 Progress SRS:", updatedActivity.srsReviews, "/", goals.srsReviews);
  
  // Calcola streak
  const streak = calculateStreak(studentData.activityData || {});
  const newStreak = updatedActivity.completed ? 
    { current: streak.current + 1, longest: Math.max(streak.longest, streak.current + 1) } :
    streak;
  
  console.log("🔥 Nuova streak:", newStreak);
  
  // Aggiorna documento
  const updateData = {
    [`dailyActivity.${today}`]: updatedActivity,
    activityData: {
      lastStudyDate: serverTimestamp(),
      currentStreak: newStreak.current,
      longestStreak: newStreak.longest,
      totalStudyDays: (studentData.activityData?.totalStudyDays || 0) + (updatedActivity.completed ? 1 : 0)
    }
  };
  
  console.log("🔥 UpdateData completo:", updateData);
  
  await updateDoc(studentRef, updateData, { merge: true });
  
  console.log("🔥 Update completato con successo!");
  
  return {
    activity: updatedActivity,
    streak: newStreak,
    goalsCompleted: updatedActivity.completed
  };
};

// Determina livello utente basato su progresso
const getUserLevel = (studentData) => {
  const completedLevels = studentData.completedLevels || [];
  if (completedLevels.length <= 3) return 'beginner';
  if (completedLevels.length <= 8) return 'intermediate';
  return 'advanced';
};

// Calcola progress obiettivi giornalieri
export const getDailyProgress = (dailyActivity, goals) => {
  console.log("🔍 getDailyProgress chiamato:", { dailyActivity, goals });
  
  if (!dailyActivity) return { exercises: 0, srsReviews: 0, studyTime: 0, overall: 0 };
  
  const progress = {
    exercises: Math.min(((dailyActivity.exercises / goals.exercises) * 100).toFixed(2), 100),
    srsReviews: Math.min(((dailyActivity.srsReviews / goals.srsReviews) * 100).toFixed(2), 100),
    studyTime: Math.min(((dailyActivity.studyTime / goals.studyTime) * 100).toFixed(2), 100)
  };
  
  progress.overall = Math.round((parseFloat(progress.exercises) + parseFloat(progress.srsReviews) + parseFloat(progress.studyTime)) / 3);
  
  console.log("🔍 Progress calcolato:", progress);
  console.log("🔍 Dettaglio calcolo:", {
    exercisesPerc: `${dailyActivity.exercises}/${goals.exercises} = ${progress.exercises}%`,
    srsPerc: `${dailyActivity.srsReviews}/${goals.srsReviews} = ${progress.srsReviews}%`,
    studyTimePerc: `${dailyActivity.studyTime}/${goals.studyTime} = ${progress.studyTime}%`
  });
  
  return progress;
};

// Verifica se può studiare oggi (per evitare cheat)
export const canStudyToday = (activityData) => {
  if (!activityData || !activityData.lastStudyDate) return true;
  
  const lastStudy = new Date(activityData.lastStudyDate);
  const today = new Date();
  
  return lastStudy.toDateString() !== today.toDateString() || 
         (activityData.dailyActivity?.[today.toISOString().split('T')[0]]?.exercises || 0) < 50;
};
