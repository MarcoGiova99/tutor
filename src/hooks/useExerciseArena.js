import { useReducer, useCallback, useEffect, useRef } from 'react';
import { playSound } from '../lib/gamification';
import { calculateNextDifficulty } from '../lib/gameLogic';
import { updateDailyActivity } from '../lib/streakSystem';

// Stato iniziale per l'Exercise Arena
const initialState = {
  questionPool: [],
  currentQuestion: null,
  loading: true,
  errorMsg: null,
  currentDifficulty: 'medium',
  history: [],
  questionCount: 0,
  selectedOption: null,
  journalEntries: [],
  isChecked: false,
  isCorrect: false,
};

// Actions per il reducer
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_QUESTIONS: 'SET_QUESTIONS',
  SET_CURRENT_QUESTION: 'SET_CURRENT_QUESTION',
  SELECT_OPTION: 'SELECT_OPTION',
  ADD_JOURNAL_ENTRY: 'ADD_JOURNAL_ENTRY',
  REMOVE_JOURNAL_ENTRY: 'REMOVE_JOURNAL_ENTRY',
  CHECK_ANSWER: 'CHECK_ANSWER',
  NEXT_QUESTION: 'NEXT_QUESTION',
  RESET_QUESTION: 'RESET_QUESTION',
  FINISH_LEVEL: 'FINISH_LEVEL',
};

// Reducer per gestire lo stato complesso
function exerciseReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, errorMsg: action.payload, loading: false };

    case ACTIONS.SET_QUESTIONS:
      return {
        ...state,
        questionPool: action.payload,
        loading: false
      };

    case ACTIONS.SET_CURRENT_QUESTION:
      return {
        ...state,
        currentQuestion: action.payload,
        questionCount: state.questionCount + 1
      };

    case ACTIONS.SELECT_OPTION:
      return {
        ...state,
        selectedOption: action.payload
      };

    case ACTIONS.ADD_JOURNAL_ENTRY:
      const exists = state.journalEntries.some(
        entry => entry.account === action.payload.account && entry.type === action.payload.type
      );
      if (exists || state.isChecked) return state;

      return {
        ...state,
        journalEntries: [...state.journalEntries, action.payload]
      };

    case ACTIONS.REMOVE_JOURNAL_ENTRY:
      if (state.isChecked) return state;
      return {
        ...state,
        journalEntries: state.journalEntries.filter((_, idx) => idx !== action.payload)
      };

    case ACTIONS.CHECK_ANSWER:
      const { isCorrect, questionSnapshot } = action.payload;
      return {
        ...state,
        isChecked: true,
        isCorrect,
        history: [...state.history, {
          questionId: state.currentQuestion.id,
          isCorrect,
          difficulty: state.currentQuestion.difficulty,
          questionSnapshot,
        }]
      };

    case ACTIONS.RESET_QUESTION:
      return {
        ...state,
        isChecked: false,
        isCorrect: false,
        selectedOption: null,
        journalEntries: [],
      };

    case ACTIONS.NEXT_QUESTION:
      return {
        ...state,
        currentDifficulty: action.payload.nextDifficulty,
        currentQuestion: action.payload.nextQuestion,
        questionCount: state.questionCount + 1, // 🔥 FIX: Incrementa il contatore
        ...(!action.payload.nextQuestion && { finished: true })
      };

    default:
      return state;
  }
}

// Hook custom per la logica dell'Exercise Arena
export function useExerciseArena(levelId, onComplete, studentId) {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);
  const MAX_QUESTIONS = 10;
  const sessionStartTime = useRef(Date.now());
  const exerciseCount = useRef(0);

  // Normalizzazione domanda
  const normalizeQuestion = useCallback((q) => {
    const hasAccounts = q.availableAccounts && q.availableAccounts.length > 0;
    const type = hasAccounts ? 'journal' : (q.type === 'quiz' ? 'multiple' : q.type);
    const text = q.text || q.question || "Domanda senza testo";
    const difficulty = (q.difficulty || "medium").toLowerCase();
    const explanation = q.explanation || "Nessuna spiegazione disponibile";

    let options = q.options || [];
    let correctIndex = q.correctIndex;

    if (type === 'multiple' && options.length > 0 && typeof options[0] === 'object') {
      correctIndex = options.findIndex(o => o.correct === true);
      options = options.map(o => o.text);
    }

    let availableAccounts = q.availableAccounts || [];
    if (type === 'journal' && availableAccounts.length === 0 && q.correctMapping) {
      availableAccounts = Object.keys(q.correctMapping);
    }

    return { ...q, text, type, options, correctIndex, availableAccounts, difficulty, explanation };
  }, []);

  // Selezione prossima domanda
  const pickNextQuestion = useCallback((pool, targetDiff, playedIds) => {
    let candidates = pool.filter(q => q.difficulty === targetDiff && !playedIds.includes(q.id));
    if (candidates.length === 0) candidates = pool.filter(q => !playedIds.includes(q.id));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, []);

  // Inizializzazione arena
  const initArena = useCallback(async () => {
    if (!levelId) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: "Errore: ID Livello mancante. Riprova." });
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const q = query(collection(db, "questions"), where("levelId", "==", levelId));
      const snap = await getDocs(q);

      if (snap.empty) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: `Nessuna domanda trovata per il livello: ${levelId}` });
        return;
      }

      const loaded = snap.docs.map(d => ({ id: d.id, ...normalizeQuestion(d.data()) }));
      dispatch({ type: ACTIONS.SET_QUESTIONS, payload: loaded });

      const firstQ = pickNextQuestion(loaded, "medium", []);
      if (firstQ) {
        dispatch({ type: ACTIONS.SET_CURRENT_QUESTION, payload: firstQ });
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: "Database domande vuoto o insufficiente." });
      }

    } catch (error) {
      console.error(error);
      // GESTIONE SPECIFICA ERRORE CHUNK (Aggiornamento APP)
      if (error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Importing a module script failed')) {
        console.log("🔄 Chunk mancante rilevato nel hook. Ricarico...");
        setTimeout(() => window.location.reload(), 500); // Leggero delay per evitare loop istantanei
        return;
      }

      dispatch({ type: ACTIONS.SET_ERROR, payload: "Errore DB: " + error.message });
    }
  }, [levelId, normalizeQuestion, pickNextQuestion]);

  // Handler per selezione opzione
  const handleOptionSelect = useCallback((idx) => {
    if (state.isChecked) return;
    dispatch({ type: ACTIONS.SELECT_OPTION, payload: idx });
    playSoundHelper('pop');
  }, [state.isChecked]);

  // Handler per aggiungere entry journal
  const addJournalEntry = useCallback((accountName, type) => {
    dispatch({
      type: ACTIONS.ADD_JOURNAL_ENTRY,
      payload: { account: accountName, type }
    });
    playSoundHelper('pop');
  }, []);

  // Handler per rimuovere entry journal
  const removeJournalEntry = useCallback((idxToRemove) => {
    dispatch({ type: ACTIONS.REMOVE_JOURNAL_ENTRY, payload: idxToRemove });
  }, []);

  // Verifica risposta
  const checkAnswer = useCallback(() => {
    const q = state.currentQuestion;
    let correct = false;

    if (q.type === 'multiple') {
      // 🔥 FIX: Se nessuna opzione selezionata, considera come errore
      if (state.selectedOption === null || state.selectedOption === undefined) {
        correct = false;
      } else {
        correct = (state.selectedOption === q.correctIndex);
      }
    } else if (q.type === 'journal') {
      if (q.correctMapping) {
        const targetAccounts = Object.keys(q.correctMapping);
        const entriesCorrect = state.journalEntries.every(
          entry => q.correctMapping[entry.account] === entry.type
        );
        const allPresent = targetAccounts.every(
          acc => state.journalEntries.some(e => e.account === acc)
        );
        // 🔥 FIX: Se nessuna entry journal, considera come errore
        correct = entriesCorrect && allPresent && state.journalEntries.length === targetAccounts.length && state.journalEntries.length > 0;
      } else {
        const hasDare = state.journalEntries.some(e => e.type === 'dare');
        const hasAvere = state.journalEntries.some(e => e.type === 'avere');
        correct = hasDare && hasAvere;
      }
    }

    // Incrementa contatore esercizi
    exerciseCount.current++;

    dispatch({
      type: ACTIONS.CHECK_ANSWER,
      payload: {
        isCorrect: correct,
        questionSnapshot: {
          text: q.text,
          explanation: q.explanation
        }
      }
    });

    // 🔥 DEBUG: Log per verificare il salvataggio errori
    console.log("🔍 Risposta verificata:", {
      correct,
      questionId: q.id,
      questionText: q.text,
      selectedOption: state.selectedOption,
      journalEntries: state.journalEntries
    });

    // Aggiorna attività giornaliera
    if (studentId) {
      updateDailyActivity(studentId, {
        exercises: 1
      }).catch(console.error);
    }

    playSoundHelper(correct ? 'win' : 'wrong');
  }, [state.currentQuestion, state.selectedOption, state.journalEntries, studentId]);

  // Prossimo step
  const nextStep = useCallback(() => {
    // 🔥 CRITICAL DEBUG: Verifica chiamata nextStep
    console.log("🚨 CRITICAL - nextStep chiamato");
    console.log("🚨 questionCount:", state.questionCount);
    console.log("🚨 MAX_QUESTIONS:", MAX_QUESTIONS);

    if (state.questionCount >= MAX_QUESTIONS) {
      console.log("🚨 Chiamo finishLevel da nextStep");
      finishLevel();
      return;
    }

    const nextDiff = calculateNextDifficulty(state.currentDifficulty, state.isCorrect);

    const playedIds = [...state.history.map(h => h.questionId), state.currentQuestion.id];
    const nextQ = pickNextQuestion(state.questionPool, nextDiff, playedIds);

    if (nextQ) {
      dispatch({ type: ACTIONS.RESET_QUESTION });
      dispatch({
        type: ACTIONS.NEXT_QUESTION,
        payload: {
          nextDifficulty: nextDiff,
          nextQuestion: nextQ
        }
      });
    } else {
      finishLevel();
    }
  }, [state, pickNextQuestion]);

  // Completa livello
  const finishLevel = useCallback(() => {
    const correctCount = state.history.filter(h => h.isCorrect).length;
    const score = Math.round((correctCount / state.history.length) * 100);

    // Calcola tempo di studio in minuti
    const studyTimeMinutes = Math.round((Date.now() - sessionStartTime.current) / (1000 * 60));

    // 🔥 CRITICAL DEBUG: Verifica chiamata finishLevel
    console.log("🚨 CRITICAL - finishLevel chiamato");
    console.log("🚨 history length:", state.history.length);
    console.log("🚨 correctCount:", correctCount);
    console.log("🚨 score:", score);
    console.log("🚨 levelId:", levelId);
    console.log("🚨 studyTimeMinutes:", studyTimeMinutes);

    // Aggiorna attività giornaliera con tempo di studio
    if (studentId) {
      updateDailyActivity(studentId, {
        exercises: 0, // Già tracciati in checkAnswer
        studyTime: studyTimeMinutes
      }).catch(console.error);
    }

    onComplete({ levelId, scorePercentage: score, history: state.history });
  }, [state.history, levelId, onComplete, studentId]);

  // Helper per play sound
  const playSoundHelper = useCallback((sound) => {
    playSound(sound);
  }, []);

  return {
    // Stato
    ...state,
    MAX_QUESTIONS,

    // Azioni
    initArena,
    handleOptionSelect,
    addJournalEntry,
    removeJournalEntry,
    checkAnswer,
    nextStep,
  };
}
