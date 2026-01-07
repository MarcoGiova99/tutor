import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

/**
 * FIREBASE CONFIGURATION
 * * Questo file inizializza la connessione con i servizi Firebase (Auth e Firestore).
 * * * ARCHITETTURA IBRIDA (Multi-Corso):
 * 1. Auth: Gestisce l'accesso per tutti gli studenti (Contabilità e Cloud).
 * 2. Firestore (db):
 * - Collezione 'students': Contiene i progressi per ENTRAMBI i corsi.
 * - Collezione 'exercises'/'questions': Contiene SOLO gli esercizi del corso Cloud (c-...).
 * - Nota: Gli esercizi di Contabilità sono su file statici locali, non su Firestore.
 * * * NOTA DI SICUREZZA:
 * Le chiavi vengono caricate da variabili d'ambiente (.env).
 */

export const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID),
};

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}
// Inizializzazione dell'app Firebase
const app = initializeApp(firebaseConfig);

// Inizializzazione dei servizi con settings forzati
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});