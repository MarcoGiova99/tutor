import fs from 'fs';
import path from 'path';
import axios from 'axios';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama3.2';
const QUIZ_COUNT = 15;
const BATCH_SIZE = 1;
const MAX_CONTEXT_CHARS = 24000;

// --- UTILS ---

async function readPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(chalk.red(`❌ Error reading PDF (${filePath}): ${error.message}`));
    process.exit(1);
  }
}

function cleanJsonOutput(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();

  const start = text.search(/[\{\[]/);
  const lastBracket = text.lastIndexOf(']');
  const lastBrace = text.lastIndexOf('}');
  const end = Math.max(lastBracket, lastBrace);

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    sourceFiles: [],
    styleFile: null,
    model: DEFAULT_MODEL
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--style') {
      config.styleFile = args[i + 1];
      i++;
    } else if (args[i] === '--model') {
      config.model = args[i + 1];
      i++;
    } else {
      config.sourceFiles.push(args[i]);
    }
  }
  return config;
}

// --- MAIN ---

async function main() {
  const config = parseArgs();

  if (config.sourceFiles.length === 0) {
    console.log(chalk.gray(`Usage: node generate-quiz.js <file1.pdf> ... `));
    process.exit(0);
  }

  // 1. READ SOURCE FILES
  console.log(chalk.blue(`📂 Processing ${config.sourceFiles.length} source files...`));
  let combinedSourceText = "";

  for (const file of config.sourceFiles) {
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
      console.warn(chalk.yellow(`⚠️ File not found (skipping): ${file}`));
      continue;
    }
    const text = await readPdf(absPath);
    console.log(chalk.gray(`  - Read ${path.basename(file)} (${text.length} chars)`));
    combinedSourceText += `\n\n--- DOCUMENT: ${path.basename(file)} ---\n${text}`;
  }

  if (!combinedSourceText.trim()) {
    console.error(chalk.red("❌ No source text extracted."));
    process.exit(1);
  }

  // 2. READ STYLE FILE
  let styleContext = "";
  if (config.styleFile) {
    const stylePath = path.resolve(config.styleFile);
    if (fs.existsSync(stylePath)) {
      console.log(chalk.magenta(`🎨 Reading style guide: ${path.basename(stylePath)}...`));
      const styleText = await readPdf(stylePath);
      styleContext = `
      STYLE GUIDE:
      Mimic the style of questions found below (difficulty, phrasing, lengh).
      --- STYLE START ---
      ${styleText.substring(0, 3000)} 
      --- STYLE END ---
      `;
    }
  }

  // 3. PREPARE PROMPT
  const availableChars = MAX_CONTEXT_CHARS - styleContext.length;
  if (combinedSourceText.length > availableChars) {
    combinedSourceText = combinedSourceText.substring(0, availableChars);
  }

  // Load history
  const historyPath = path.join(__dirname, 'history.json');
  let history = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch (e) { }
  }

  console.log(chalk.cyan(`🧠 Sending to Ollama (${config.model})... Target: ${QUIZ_COUNT} questions.`));

  let allQuestions = [];
  const batches = Math.ceil(QUIZ_COUNT / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    console.log(chalk.cyan(`  - Batch ${i + 1}/${batches} (generating ${BATCH_SIZE} questions)...`));

    let batchSuccess = false;
    let attempts = 0;

    // RETRY LOOP FOR VALIDATION
    while (!batchSuccess && attempts < 3) {
      attempts++;
      if (attempts > 1) console.log(chalk.yellow(`    ⚠️ Retry ${attempts}/3...`));

      // RANDOM CHUNK STRATEGY
      // Pick a random window of text to force diversity and adherence to specific details
      // DYNAMIC SIZING: Ensure chunks are small enough to force variety, even in short docs.
      const CHARS_PER_CHUNK = Math.max(500, Math.floor(combinedSourceText.length / 4));
      const CHUNK_SIZE = Math.min(1500, CHARS_PER_CHUNK); // Cap at 1500 chars

      let sourceChunk = combinedSourceText;
      if (combinedSourceText.length > CHUNK_SIZE) {
        const maxStart = combinedSourceText.length - CHUNK_SIZE;
        const startIdx = Math.floor(Math.random() * maxStart);
        sourceChunk = combinedSourceText.substring(startIdx, startIdx + CHUNK_SIZE);
      }

      const prompt = `
        You are a strict **University Professor** creating a **DIFFICULT** exam for Computer Architecture students.
        ${styleContext ? "**Apply the style defined in the STYLE GUIDE above.**" : ""}

        Based **ONLY** on the following **SPECIFIC TEXT EXCERPT** from the course material, generate 1 multiple-choice question in **ITALIAN**.
        
        IMPORTANT REQUIREMENTS:
        1. **SOURCE**: The question must be derived STRICTLY from the provided excerpt.
        2. **DIFFICULTY**: Questions must be **HARD/COMPLEX**. Do NOT ask for simple definitions.
        3. **TYPE**: Focus on **APPLICATION**, **ANALYSIS**, or **REASONING** based on the excerpt.
        4. **LANGUAGE**: Professional, academic **ITALIAN**. **CHECK SPELLING CAREFULLY** (Do not invent words like "arsitezione", use "architettura").
        5. Return ONLY a VALID JSON ARRAY containing 1 object.


        JSON Format:
        [
          {
            "text": "...",
            "options": ["...", "...", "...", "..."],
            "correctIndex": 0,
            "explanation": "..."
          }
        ]

        RANDOM_SEED: ${Date.now() + i + attempts}

        SPECIFIC TEXT EXCERPT:
        ... ${sourceChunk.replace(/\n/g, ' ')} ...
        `;

      try {
        const response = await axios.post(OLLAMA_URL, {
          model: config.model,
          prompt: prompt,
          format: 'json',
          stream: false,
          options: { temperature: 0.8 }
        });

        const rawOutput = response.data.response;
        let batchQuestions = [];

        try {
          const jsonStr = cleanJsonOutput(rawOutput);
          const parsed = JSON.parse(jsonStr);

          // Normalize
          if (Array.isArray(parsed)) {
            batchQuestions = parsed;
          } else if (parsed.questions && Array.isArray(parsed.questions)) {
            batchQuestions = parsed.questions;
          } else if (typeof parsed === 'object') {
            batchQuestions = [parsed];
          }

          // VALIDATION
          if (batchQuestions.length === 0) throw new Error("No questions returned");

          const q = batchQuestions[0];
          if (!q.text || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
            // If invalid options structure, save debug and throw
            const debugPath = path.join(__dirname, `debug_invalid_${i}_${attempts}.txt`);
            fs.writeFileSync(debugPath, rawOutput);
            throw new Error("Invalid structure: options must be an array of strings.");
          }

          console.log(chalk.green(`  ✅ Got valid question from batch ${i + 1}.`));
          allQuestions = [...allQuestions, ...batchQuestions];
          batchSuccess = true;

          // Incremental Save
          const outputPath = path.join(__dirname, 'generated_quiz.json');
          fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));

        } catch (e) {
          console.warn(chalk.red(`    ❌ Parse/Validation failed: ${e.message}`));
        }

      } catch (error) {
        console.error(chalk.red(`    ❌ Network error: ${error.message}`));
      }
    } // end while retry

    if (!batchSuccess) {
      console.error(chalk.red(`  ❌ Failed to generate valid question for batch ${i + 1} after 3 attempts.`));
    }
  }

  // Filter Duplicates
  const uniqueQuestions = allQuestions.filter(q => {
    return !history.some(h => h.text && q.text && h.text.trim() === q.text.trim());
  });

  const duplicates = allQuestions.length - uniqueQuestions.length;
  if (duplicates > 0) {
    console.log(chalk.yellow(`⚠️ Skipped ${duplicates} duplicates.`));
  }

  // Update History
  const updatedHistory = [...history, ...uniqueQuestions];
  fs.writeFileSync(historyPath, JSON.stringify(updatedHistory, null, 2));

  console.log(chalk.green(`✅ Total Generated: ${uniqueQuestions.length} NEW questions!`));

  const outputPath = path.join(__dirname, 'generated_quiz.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueQuestions, null, 2));
  console.log(chalk.white(`💾 Saved to: ${outputPath}`));
}

main();
