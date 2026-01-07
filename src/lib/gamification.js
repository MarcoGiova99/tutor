import confetti from 'canvas-confetti';

/**
 * GAMIFICATION UTILITIES
 * * Questo file centralizza tutti gli effetti visivi e sonori per il feedback utente.
 * * Aggiornato per supportare temi visivi diversi (Verde per Contabilità, Blu per Cloud).
 */

/**
 * DEFINIZIONE PALETTE COLORI
 */
const THEMES = {
  accounting: ['#10b981', '#34d399', '#ffffff'], // Verde Smeraldo (Default)
  cloud: ['#2563eb', '#60a5fa', '#dbeafe'],      // Blu Tech
  default: ['#10b981', '#6ee7b7', '#ffffff']     // Fallback
};

/**
 * 1. ESPLOSIONE DI CORIANDOLI (Celebrazione)
 * Usato per eventi "grandi": Level Up, completamento modulo.
 * * @param {string} [courseId] - 'accounting' o 'cloud' per colorare i coriandoli.
 */
export const triggerConfetti = (courseId) => {
  const duration = 2500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  // Seleziona i colori in base al corso, altrimenti usa i colori default di canvas-confetti (null)
  const colors = courseId && THEMES[courseId] ? THEMES[courseId] : undefined;

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Lancia due getti dai lati opposti dello schermo
    confetti({ 
      ...defaults, 
      particleCount, 
      colors: colors,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
    });
    confetti({ 
      ...defaults, 
      particleCount, 
      colors: colors,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
    });
  }, 250);
};

/**
 * 2. EFFETTO "POP" (Micro-feedback)
 * Usato per feedback immediato (es. Risposta corretta).
 * * @param {number} x - Posizione orizzontale del mouse (pixel)
 * @param {number} y - Posizione verticale del mouse (pixel)
 * @param {string} [courseId] - 'accounting' o 'cloud' per adattare il colore del pop.
 */
export const triggerPop = (x, y, courseId) => {
  // canvas-confetti usa coordinate normalizzate (0-1)
  const origin = {
      x: x ? x / window.innerWidth : 0.5,
      y: y ? y / window.innerHeight : 0.5
  };

  // Determina la palette corretta
  const selectedColors = (courseId && THEMES[courseId]) ? THEMES[courseId] : THEMES.default;
  
  confetti({
      particleCount: 30,
      spread: 60,
      origin: origin,
      colors: selectedColors, 
      disableForReducedMotion: true,
      drift: 0,
      gravity: 1.5, // Caduta rapida
      scalar: 0.7,  // Particelle piccole
      startVelocity: 20,
      ticks: 50
  });
};

/**
 * 3. GESTORE SUONI (Audio Feedback)
 * Riproduce effetti sonori brevi.
 * Non richiede modifiche per il multi-corso (i suoni sono generici).
 */
export const playSound = (type) => {
  try {
      const sounds = {
          pop: '/sounds/pop.mp3',         // Click soddisfacente / Bolla
          success: '/sounds/success.mp3', // Risposta giusta (Chime)
          win: '/sounds/win.mp3',         // Fanfara Level up
          whoosh: '/sounds/whoosh.mp3'    // Carta completata / Swipe
      };
      
      if (sounds[type]) {
          const audio = new Audio(sounds[type]);
          audio.volume = 0.4; // Volume non invasivo
          
          // Tentiamo la riproduzione ignorando errori di autoplay policy
          audio.play().catch(() => {}); 
      }
  } catch (e) {
      // Fallback silenzioso
  }
};