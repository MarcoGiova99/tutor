import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebase"; // Importiamo la config esistente

// Nome univoco per l'app secondaria
const SECONDARY_APP_NAME = "ProvisioningApp";

function getProvisioningAuth() {
  let app;
  // Controlliamo se esiste già per non inizializzarla due volte
  if (getApps().some((a) => a.name === SECONDARY_APP_NAME)) {
    app = getApp(SECONDARY_APP_NAME);
  } else {
    app = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }
  return getAuth(app);
}

/**
 * createStudentAuthAccount
 * Crea un utente su Firebase Auth usando un'istanza secondaria.
 * @returns {Promise<string>} L'UID del nuovo studente creato.
 */
export async function createStudentAuthAccount(email, password) {
  const secondaryAuth = getProvisioningAuth();
  
  // 1. Creiamo l'utente (Questo loggherebbe l'utente nell'app secondaria, non nella principale)
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const uid = userCredential.user.uid;

  // 2. Facciamo subito il logout dall'istanza secondaria per pulizia
  await signOut(secondaryAuth);

  return uid;
}