/**
 * SPACED REPETITION LOGIC
 * Gestisce intervalli: 0 (subito) -> 1gg -> 3gg -> 7gg -> Completato
 */

export const getNextInterval = (currentInterval) => {
  if (currentInterval === 0) return 1;
  if (currentInterval === 1) return 3;
  if (currentInterval === 3) return 7;
  return null; // Null significa che il concetto è stato appreso definitivamente
};

// Controlla se una "flashcard" è scaduta ed è da ripassare oggi
export const isDue = (dateObj) => {
  if (!dateObj) return true; // Se non c'è data, ripassa subito per sicurezza
  
  // Gestisce sia Timestamp di Firestore che Date normali
  const dueDate = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  const now = new Date();
  
  return dueDate <= now;
};