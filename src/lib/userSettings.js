import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * USER SETTINGS UTILITIES
 * * Questo file gestisce le configurazioni personali dell'utente.
 * * Aggiornato per gestire le categorie (tag) di ENTRAMBI i corsi (Contabilità e Cloud).
 */

// --- COSTANTI DI DEFAULT: CONTABILITÀ (Legacy) ---

// Manteniamo il nome originale per retro-compatibilità con i componenti esistenti
export const DEFAULT_ERROR_TAGS = [
  "Distrazione",
  "Teoria non chiara",
  "Confusione tra conti",
  "Segno / Dare-Avere",
  "Calcoli",
  "Metodo (passi mancanti)",
  "Lentezza / gestione tempo",
  "Ansia / blocco",
];

export const DEFAULT_TOPIC_TAGS = [
  "Ratei",
  "Risconti",
  "Ammortamenti",
  "Rimanenze",
  "IVA",
  "Scritture di assestamento",
];

// --- COSTANTI DI DEFAULT: CLOUD COMPUTING (Nuovo) ---

export const DEFAULT_CLOUD_ERRORS = [
  "Distrazione",
  "Concetto teorico (SaaS/PaaS/IaaS)",
  "Confusione Servizi (es. S3 vs EBS)",
  "Errata Configurazione",
  "Security / IAM Policy",
  "Networking (CIDR/Subnet)",
  "Lettura errata domanda",
  "Ansia / blocco"
];

export const DEFAULT_CLOUD_TOPICS = [
  "Compute (EC2, Lambda)",
  "Storage (S3, EBS, Glacier)",
  "Networking (VPC, Route53)",
  "Security (IAM, Cognito)",
  "Databases (RDS, DynamoDB)",
  "Cost Management",
  "Architecture Patterns"
];

/**
 * ensureUserSettings
 * * Verifica l'esistenza del documento delle impostazioni.
 * * Crea o aggiorna il documento per garantire che esistano i tag per entrambi i corsi.
 * * @param {string} uid - L'ID univoco dell'utente.
 */
export async function ensureUserSettings(uid) {
  if (!uid) throw new Error("ensureUserSettings: UID utente mancante");

  const ref = doc(db, "userSettings", uid);
  const snap = await getDoc(ref);

  // CASO 1: NUOVO UTENTE (Creazione completa)
  if (!snap.exists()) {
    await setDoc(ref, {
      ownerUid: uid,
      // Contabilità (Legacy keys)
      errorTags: DEFAULT_ERROR_TAGS,
      topicTags: DEFAULT_TOPIC_TAGS,
      
      // Cloud (New keys)
      cloudErrorTags: DEFAULT_CLOUD_ERRORS,
      cloudTopicTags: DEFAULT_CLOUD_TOPICS,
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // CASO 2: UTENTE ESISTENTE (Migrazione/Aggiornamento)
  // Se l'utente esiste ma è "vecchio" (ha solo contabilità), aggiungiamo i campi Cloud.
  const data = snap.data();
  const needsUpdate = !data.cloudTopicTags || !data.cloudErrorTags;

  if (needsUpdate) {
    await updateDoc(ref, {
      // Usiamo || per mantenere i dati esistenti se presenti, altrimenti mettiamo i default
      cloudErrorTags: data.cloudErrorTags || DEFAULT_CLOUD_ERRORS,
      cloudTopicTags: data.cloudTopicTags || DEFAULT_CLOUD_TOPICS,
      updatedAt: serverTimestamp()
    });
  }
}