/**
 * GAME LOGIC UTILITIES
 * * Questo file contiene la logica pura per il motore di gioco.
 * * Non dipende da React o Firebase, rendendolo facilmente testabile.
 * * Aggiornato per supportare logica Multi-Corso (Contabilità + Cloud).
 */

/**
 * 1. ADAPTIVE LEARNING ENGINE
 * Calcola la prossima difficoltà in base alla performance dell'utente.
 * Funziona allo stesso modo sia per Contabilità che per Cloud.
 * * @param {string} currentDiff - Difficoltà attuale ('easy', 'medium', 'hard')
 * @param {boolean} isCorrect - Esito dell'ultima risposta
 * @returns {string} - La nuova difficoltà calcolata
 */
export function calculateNextDifficulty(currentDiff, isCorrect) {
  const levels = ['easy', 'medium', 'hard'];
  const currentIndex = levels.indexOf(currentDiff);

  // Fallback di sicurezza
  if (currentIndex === -1) return 'medium';

  if (isCorrect) {
    // Se corretto: Sali di livello (max: 'hard')
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  } else {
    // Se sbagliato: Scendi di livello (min: 'easy')
    return levels[Math.max(currentIndex - 1, 0)];
  }
}

/**
 * 2. DIFFICULTY COLORS
 * Restituisce il colore HEX associato alla difficoltà.
 * * @param {string} diff - 'easy', 'medium', 'hard'
 * @returns {string} - Colore HEX (Verde, Arancione, Rosso)
 */
export function getDifficultyColor(diff) {
  switch (diff) {
    case 'easy': 
      return '#10b981';   // Verde Smeraldo
    case 'medium': 
      return '#f59e0b'; // Arancione
    case 'hard': 
      return '#ef4444';   // Rosso
    default: 
      return '#64748b'; // Grigio
  }
}

/**
 * 3. COURSE METADATA (Nuova Funzione)
 * Centralizza la logica di stile per i due corsi.
 * Utile per ottenere colori, etichette e icone basandosi sull'ID del livello o del corso.
 * * @param {string} id - Può essere un levelId (es. 'c-l01...') o un courseId ('cloud')
 * @returns {object} - Oggetto con configurazione visiva (colori, label, icone)
 */
export function getCourseMetadata(id) {
  // Normalizziamo l'input
  const safeId = id || '';
  
  // Logica di riconoscimento:
  // Se inizia con 'c-' o è esattamente 'cloud', è Cloud Computing.
  const isCloud = safeId.startsWith('c-') || safeId === 'cloud';

  if (isCloud) {
    return {
      key: 'cloud',
      label: 'CLOUD COMPUTING',
      shortLabel: 'CLOUD',
      icon: '☁️',
      themeColor: '#2563eb', // Blue 600
      lightColor: '#eff6ff', // Blue 50
      borderColor: '#dbeafe' // Blue 100
    };
  }

  // Default: Contabilità (Legacy, ID 'lvl_...')
  return {
    key: 'accounting',
    label: 'CONTABILITÀ',
    shortLabel: 'CONTA',
    icon: '📊',
    themeColor: '#991b1b', // Red 800
    lightColor: '#fef2f2', // Red 50
    borderColor: '#fee2e2' // Red 100
  };
}