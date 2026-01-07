import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updateDailyActivity, getDailyProgress, DAILY_GOALS, calculateStreak } from '../lib/streakSystem';

export default function StreakWidget({ studentData }) {
  const [dailyProgress, setDailyProgress] = useState(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [goals, setGoals] = useState(DAILY_GOALS.beginner);
  const [todayActivity, setTodayActivity] = useState(null);
  
  useEffect(() => {
    if (!studentData) return;
    
    // Calcola streak
    const streakData = calculateStreak(studentData.activityData || {});
    setStreak(streakData);
    
    // Determina livello utente e obiettivi
    const completedLevels = studentData.completedLevels || [];
    let userLevel = 'beginner';
    if (completedLevels.length > 8) userLevel = 'advanced';
    else if (completedLevels.length > 3) userLevel = 'intermediate';
    
    setGoals(DAILY_GOALS[userLevel]);
    
    // Calcola progress di oggi
    const today = new Date().toISOString().split('T')[0];
    const activity = studentData.dailyActivity?.[today];
    setTodayActivity(activity);
    const progress = getDailyProgress(activity, goals);
    setDailyProgress(progress);
    
  }, [studentData]);
  
  if (!dailyProgress) return null;
  
  const isOnFire = streak.current >= 3;
  const streakEmoji = streak.current === 0 ? '❄️' : streak.current >= 7 ? '🔥' : '✨';
  
  return (
    <div style={{ 
      marginBottom: 30, 
      border: isOnFire ? '2px solid #f59e0b' : '2px solid #e5e7eb', 
      borderRadius: 16, 
      padding: 20, 
      background: isOnFire ? '#fef3c7' : '#fff' 
    }}>
      
      {/* Header con Streak */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{streakEmoji}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: isOnFire ? '#d97706' : '#374151' }}>
              {streak.current === 0 ? 'Inizia la tua streak!' : `${streak.current} giorni di fila`}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Record: {streak.longest} giorni
            </p>
          </div>
        </div>
        
        {isOnFire && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: 24 }}
          >
            🔥
          </motion.div>
        )}
      </div>
      
      {/* Progress Bar Globale */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>PROGRESSO OGGI</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: isOnFire ? '#d97706' : '#374151' }}>
            {dailyProgress.overall}%
          </span>
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: 10, height: 8, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgress.overall}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ 
              background: isOnFire ? '#f59e0b' : '#10b981', 
              height: '100%' 
            }}
          />
        </div>
      </div>
      
      {/* Obiettivi Dettagliati */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        
        {/* Esercizi */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>💪</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
            {dailyProgress.exercises}%
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {todayActivity?.exercises || 0}/{goals.exercises} esercizi
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 4, marginTop: 4, overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress.exercises}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: '#3b82f6', height: '100%' }}
            />
          </div>
        </div>
        
        {/* SRS Reviews */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🧠</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
            {dailyProgress.srsReviews}%
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {todayActivity?.srsReviews || 0}/{goals.srsReviews} review
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 4, marginTop: 4, overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress.srsReviews}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: '#8b5cf6', height: '100%' }}
            />
          </div>
        </div>
        
        {/* Tempo Studio */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⏰</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
            {dailyProgress.studyTime}%
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {todayActivity?.studyTime || 0}/{goals.studyTime} min
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 4, height: 4, marginTop: 4, overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress.studyTime}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: '#ef4444', height: '100%' }}
            />
          </div>
        </div>
        
      </div>
      
      {/* Motivational Message */}
      {dailyProgress.overall === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginTop: 15, 
            padding: 10, 
            background: '#dcfce7', 
            borderRadius: 8, 
            textAlign: 'center',
            border: '1px solid #bbf7d0'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
            🎉 Obiettivi giornalieri completati! Continua così!
          </div>
        </motion.div>
      )}
      
      {streak.current === 0 && dailyProgress.overall > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginTop: 15, 
            padding: 10, 
            background: '#fef3c7', 
            borderRadius: 8, 
            textAlign: 'center',
            border: '1px solid #fde68a'
          }}
        >
          <div style={{ fontSize: 12, color: '#92400e' }}>
            💡 Completa gli obiettivi per iniziare la tua streak!
          </div>
        </motion.div>
      )}
      
    </div>
  );
}
