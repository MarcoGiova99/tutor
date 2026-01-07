import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

/**
 * FETCH EXERCISES
 * Recupera una lista di esercizi dal database Firestore.
 * Aggiornato per supportare il Corso Cloud Computing.
 * * @param {Object} params
 * @param {string} [params.topic] - (Legacy) Filtra per argomento.
 * @param {string} [params.levelId] - (New) Filtra per ID livello (es. 'c-l01-intro' per Cloud).
 * @param {string} [params.courseId] - (New) Filtra per corso ('accounting' o 'cloud').
 * @param {number} [params.n=20] - Limite esercizi.
 */
export async function fetchExercises({ topic, levelId, courseId, n = 20 }) {
  try {
    // Nota: Assicurarsi che la collezione corrisponda a quella usata in AdminSeed/ExerciseArena.
    // Generalmente usiamo 'questions' o 'exercises'. Qui manteniamo 'exercises' come da file originale.
    const exercisesRef = collection(db, "exercises");
    
    // Costruzione dinamica dei vincoli della query
    const constraints = [];

    if (courseId) {
      constraints.push(where("courseId", "==", courseId));
    }

    if (levelId) {
      constraints.push(where("levelId", "==", levelId));
    }

    if (topic) {
      constraints.push(where("topic", "==", topic));
    }

    // Aggiungiamo sempre il limite
    constraints.push(limit(n));

    // Creiamo la query con i vincoli accumulati
    const q = query(exercisesRef, ...constraints);

    const snap = await getDocs(q);
    
    // Mappiamo i documenti restituendo ID e dati
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Errore durante il recupero degli esercizi (Firestore):", error);
    return []; 
  }
}

/**
 * GRADE EXERCISE
 * Funzione pura che valuta la risposta dell'utente.
 * Funziona sia per esercizi Contabilità che Cloud.
 */
export function gradeExercise(ex, userAnswer) {
  const materialRefs = ex.materialRefs || [];

  // --- CASO 1: SCELTA MULTIPLA (Usato sia in Accounting che Cloud Quiz) ---
  if (ex.type === "multiple_choice" || ex.type === "quiz") {
    // Normalizziamo la chiave di risposta corretta (supporta sia 'correctChoice' che 'correct' come ID)
    const correctVal = ex.answer?.correctChoice || ex.correct; 
    
    const isCorrect = userAnswer === correctVal;
    
    if (isCorrect) {
      return { isCorrect: true, materialRefs };
    }

    // Gestione errore
    const errorCode = ex.answer?.errorMap?.[userAnswer] || "WRONG_CHOICE";
    // Fallback sulla spiegazione generica se non c'è mappa errori specifica
    const explanation = ex.explanations?.[errorCode] 
                     || ex.explanation 
                     || ex.explanations?.DEFAULT 
                     || "Risposta errata.";
    
    return { 
      isCorrect: false, 
      errorCode, 
      explanation, 
      materialRefs 
    };
  }

  // --- CASO 2: RISPOSTA NUMERICA ---
  if (ex.type === "numeric") {
    const val = Number(userAnswer);
    const target = Number(ex.answer.value);
    const tol = ex.answer.tolerance ?? 0;

    const isCorrect = Math.abs(val - target) <= tol;

    if (isCorrect) {
      return { isCorrect: true, materialRefs };
    }

    const errorCode = "WRONG_NUMBER";
    const explanation = ex.explanations?.[errorCode] || ex.explanations?.DEFAULT || "Controlla il calcolo.";
    
    return { 
      isCorrect: false, 
      errorCode, 
      explanation, 
      materialRefs 
    };
  }

  // --- CASO DEFAULT ---
  return { 
    isCorrect: false, 
    errorCode: "UNSUPPORTED_TYPE", 
    explanation: "Tipologia esercizio non supportata.", 
    materialRefs 
  };
}

/**
 * UPSERT EXERCISE PROGRESS
 * Salva il risultato su Firestore.
 * Valido per entrambi i corsi (i dati finiscono nel profilo studente).
 */
export async function upsertExerciseProgress(studentId, exerciseId, payload) {
  if (!studentId || !exerciseId) return;

  try {
    // Salva nella sub-collection dello studente.
    // Funziona indipendentemente dal corso (Cloud/Accounting)
    const progressRef = doc(db, "students", studentId, "exerciseProgress", exerciseId);
    
    await setDoc(progressRef, { 
      ...payload, 
      updatedAt: serverTimestamp() 
    }, { merge: true });

  } catch (error) {
    console.error("Errore salvataggio progresso:", error);
    throw error;
  }
}