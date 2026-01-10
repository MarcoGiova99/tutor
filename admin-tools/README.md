# Admin Tools - Local Quiz Generator

Strumenti locali per generare contenuti per Tutor Tracker usando l'IA locale (Ollama).

## Requisiti

1. **Node.js** installato (già presente nel progetto).
2. **Ollama** installato e in esecuzione.
   - Scarica da: [ollama.com](https://ollama.com)
   - Avvia nel terminale: `ollama serve` (se non è già attivo in background)
   - Assicurati di avere un modello: `ollama pull llama3` (o mistral, gemma, ecc.)

## Installazione Dipendenze (Una tantum)

Entra nella cartella `admin-tools` ed installa i pacchetti:

```bash
cd admin-tools
npm install
```

## Utilizzo

Il comando supporta multipli file di input e un file opzionale per lo stile (es. vecchio esame).

```bash
node generate-quiz.js [file1.pdf] [file2.pdf] ... [--style esame.pdf] [--model modello]
```

### Esempi:

1. **Un solo file:**
   ```bash
   node generate-quiz.js appunti.pdf
   ```

2. **Più file di appunti:**
   ```bash
   node generate-quiz.js capitolo1.pdf capitolo2.pdf
   ```

3. **Con "Stile Esame":**
   Usa il file `esame_vecchio.pdf` come modello per lo stile delle domande, ma genera i contenuti basandosi su `appunti_nuovi.pdf`.
   ```bash
   node generate-quiz.js appunti_nuovi.pdf --style esame_vecchio.pdf
   ```

Il risultato verrà salvato in `generated_quiz.json`.
