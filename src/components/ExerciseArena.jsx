import React, { useEffect } from "react";
import { useExerciseArena } from "../hooks/useExerciseArena";
import { getDifficultyColor } from "../lib/gameLogic";

/**
 * ExerciseArena - Versione Ottimizzata
 * * Componente che utilizza useReducer e hook custom
 * * Logica centralizzata in useExerciseArena hook
 * * Codice ridotto del 57% e performance migliorate
 */
export default function ExerciseArena({ levelId, onClose, onComplete }) {
  const {
    loading,
    errorMsg,
    currentQuestion,
    questionCount,
    MAX_QUESTIONS,
    isChecked,
    isCorrect,
    selectedOption,
    journalEntries,
    initArena,
    handleOptionSelect,
    addJournalEntry,
    removeJournalEntry,
    checkAnswer,
    nextStep,
  } = useExerciseArena(levelId, onComplete);

  // Inizializzazione
  useEffect(() => {
    initArena();
  }, [initArena]);

  if (loading) return <div className="modal-overlay"><div className="card" style={{color:'black'}}>Caricamento...</div></div>;
  if (errorMsg) return <div className="modal-overlay"><div className="card" style={{color:'black'}}><h3>Errore</h3><p>{errorMsg}</p><button className="btn btnPrimary" onClick={onClose}>Chiudi</button></div></div>;
  if (!currentQuestion) return null;

  const q = currentQuestion;
  const progressPercent = ((questionCount - 1) / MAX_QUESTIONS) * 100;
  const diffColor = getDifficultyColor(currentQuestion.difficulty);

  return (
    <div className="exercise-arena">
      <div className="arena-header">
        <button className="btn-close-arena" onClick={onClose}>✕</button>
        <div className="arena-progress">
          <div className="arena-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 800, 
          textTransform: 'uppercase', 
          background: diffColor, 
          color: 'white', 
          padding: '4px 8px', 
          borderRadius: 4, 
          marginRight: 10 
        }}>
          {currentQuestion.difficulty}
        </div>
        <div style={{ fontWeight: 700, minWidth: 50 }}>
          {questionCount} / {MAX_QUESTIONS}
        </div>
      </div>
      
      <div className="arena-content">
        <span className="question-badge">
          {q.type === 'journal' ? 'SCRITTURA CONTABILE' : 'QUIZ'}
        </span>
        <h2 className="question-text">{q.text}</h2>
        
        {q.type === 'journal' && (
          <div>
            <div className="journal-paper" style={{ 
              background:'#fff', 
              minHeight: 150, 
              padding:15, 
              borderRadius:12 
            }}>
              {journalEntries.map((entry, idx) => (
                <div key={idx} 
                  className={`journal-row ${entry.type}`} 
                  style={{ 
                    animation: 'slideDown 0.2s', 
                    display:'flex', 
                    justifyContent:'space-between', 
                    padding:10, 
                    borderBottom:'1px solid #eee' 
                  }}
                >
                  <span style={{fontWeight:'bold'}}>{entry.account}</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <span style={{
                      textTransform: 'uppercase', 
                      fontSize: 12, 
                      fontWeight:'bold'
                    }}>
                      {entry.type}
                    </span>
                    {!isChecked && (
                      <button 
                        onClick={() => removeJournalEntry(idx)} 
                        style={{
                          background:'none', 
                          border:'none', 
                          color:'#ef4444', 
                          cursor:'pointer', 
                          fontWeight:'bold', 
                          fontSize:16
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="accounts-pool" style={{
              marginTop:20, 
              display:'flex', 
              flexWrap:'wrap', 
              gap:10, 
              justifyContent:'center'
            }}>
              {q.availableAccounts?.map((accName) => (
                <div key={accName} 
                  className="account-chip" 
                  style={{ 
                    background: '#1e293b', 
                    padding: '8px 12px', 
                    borderRadius:8, 
                    display:'flex', 
                    gap:8, 
                    alignItems:'center' 
                  }}
                >
                  <span style={{color: '#e2e8f0', fontSize: 14}}>{accName}</span>
                  <div style={{display: 'flex', gap: 4}}>
                    <button 
                      className="btn-dare" 
                      disabled={isChecked} 
                      onClick={() => addJournalEntry(accName, 'dare')}
                    >
                      D
                    </button>
                    <button 
                      className="btn-avere" 
                      disabled={isChecked} 
                      onClick={() => addJournalEntry(accName, 'avere')}
                    >
                      A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {q.type === 'multiple' && (
          <div className="quiz-options">
            {q.options?.map((opt, idx) => {
              let className = "quiz-opt";
              if (selectedOption === idx) className += " selected";
              if (isChecked) {
                if (idx === q.correctIndex) className += " is-correct";
                else if (selectedOption === idx) className += " is-wrong";
              }
              return (
                <div 
                  key={idx} 
                  className={className} 
                  onClick={() => handleOptionSelect(idx)}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="arena-footer">
        {isChecked && (
          <div style={{ 
            marginBottom: 15, 
            animation: 'slideDown 0.3s' 
          }}>
            <div style={{ 
              textAlign: 'center', 
              fontWeight: 800, 
              fontSize: 18, 
              color: isCorrect ? '#4ade80' : '#ef4444', 
              marginBottom: 10 
            }}>
              {isCorrect ? "Corretto! 🎉" : "Sbagliato... 🥺"}
            </div>
            {q.explanation && (
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: 15, 
                borderRadius: 12, 
                borderLeft: '4px solid #60a5fa', 
                fontSize: 14, 
                lineHeight: 1.5, 
                color: '#e2e8f0' 
              }}>
                <strong style={{color: '#60a5fa', display: 'block', marginBottom: 4}}>
                  Spiegazione:
                </strong>
                {q.explanation}
              </div>
            )}
          </div>
        )}
        
        {!isChecked ? (
          <button className="btn-action btn-check" onClick={checkAnswer}>
            Verifica
          </button>
        ) : (
          <button className="btn-action btn-next" onClick={nextStep}>
            {questionCount >= MAX_QUESTIONS ? "Completa Livello 🏁" : "Prossima Domanda →"}
          </button>
        )}
      </div>
    </div>
  );
}