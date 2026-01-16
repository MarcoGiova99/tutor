# Prompt per Gemini (Manuale)

Copia e incolla questo testo nella chat di Gemini (es. Gemini Advanced o 1.5 Pro).
**Allega il PDF** del capitolo (es. "L'IVA copia.pdf") insieme al messaggio.

---

**PROMPT DA COPIARE:**

"Agisci come un Docente Universitario esperto di Contabilità e Bilancio.
Analizza il documento allegato e genera un file JSON con **esattamente 21 domande** (né una di più, né una di meno).

### OBIETTIVI DIDATTICI
Devi coprire 3 livelli di difficoltà in modo equilibrato:
- 7 domande **EASY**
- 7 domande **MEDIUM**
- 7 domande **HARD**

### STRATEGIA: 70% PRATICA (Journal) / 30% TEORIA (Quiz)
È fondamentale bilanciare tra teoria e pratica contabile:

1. **FORMATO "JOURNAL" (Priorità Alta - ~14-15 domande)**
   - Da usare per **TUTTE** le domande che riguardano una scrittura contabile (es. "Registra fattura", "Calcola liquidazione IVA", "Ammortamento", "Ratei").
   - Obbligatorio per i livelli **Medium** e **Hard**.
   - Devi fornire i conti (mastrini) corretti e una selezione di distrattori.

2. **FORMATO "QUIZ" (Priorità Bassa - ~6-7 domande)**
   - Da usare SOLO per definizioni teoriche, normative o concetti base (es. "Cos'è il presupposto oggettivo?").
   - Tipico del livello **Easy**.

---

### REGOLE TECNICHE (JSON STRICT)
Restituisci **SOLAMENTE** un array JSON valido. Nessun testo prima o dopo.

#### Struttura per domande "JOURNAL" (Partita Doppia):
```json
{
  "type": "journal",
  "difficulty": "medium",  // o "hard"
  "text": "L'azienda Beta riceve fattura per materie prime di 2.000€ + IVA 22%. Descrivi la scrittura.",
  "availableAccounts": [
    "Materie Prime c/acq", "Iva ns/credito", "Fornitori", "Cassa", "Banca c/c", "Ricavi di vendita", "Iva ns/debito"
  ],
  "correctMapping": {
    "Materie Prime c/acq": "dare",
    "Iva ns/credito": "dare",
    "Fornitori": "avere"
  },
  "explanation": "Si rileva il costo in Dare (Materie Prime) e il credito IVA in Dare; la contropartita è il debito verso Fornitori in Avere."
}
```

#### Struttura per domande "QUIZ" (Scelta Multipla):
```json
{
  "type": "quiz",
  "difficulty": "easy",
  "text": "Qual è l'aliquota IVA ordinaria in Italia?",
  "options": [
    "10%",
    "4%",
    "22%",
    "21%"
  ],
  "correctIndex": 2, // Indice 0-based della risposta corretta (in questo caso '22%')
  "explanation": "L'aliquota ordinaria è attualmente il 22%."
}
```

Genera l'array completo con 21 oggetti."
