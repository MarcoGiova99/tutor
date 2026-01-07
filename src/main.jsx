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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </React.StrictMode>
);