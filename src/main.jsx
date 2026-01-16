import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppWrapper } from "./components/AppWrapper";

// 1. Reset e variabili base (opzionale se ui.css fa tutto, ma consigliato per sicurezza)
import "./index.css";

// 2. Il Design System principale (Sostituisce App.css)
import "./styles/ui.css";

// 3. Stili specifici per la mappa e i giochi
import "./styles/roadmap.css";

// --- ERROR HANDLING FOR CHUNKS ---
// Soluzione "Resize Observer loop" e "Failed to fetch dynamically imported module"
window.addEventListener('error', (event) => {
  // Ignora ResizeObserver errato (benigno)
  if (event.message === 'ResizeObserver loop limit exceeded') {
    event.stopImmediatePropagation();
    return;
  }

  // Gestione errore aggiornamento app (Chunk fallito)
  if (event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Importing a module script failed')) {

    console.log('🔄 Rilevato errore di caricamento chunk. Ricarico per aggiornamento...');

    // Evita loop infinito di reload
    const lastReload = sessionStorage.getItem('chunk_reload');
    const now = Date.now();

    if (!lastReload || (now - Number(lastReload) > 10000)) {
      sessionStorage.setItem('chunk_reload', now);
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </React.StrictMode>
);