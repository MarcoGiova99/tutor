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
const QUIZ_COUNT = 15; // 5 Easy, 5 Medium, 5 Hard
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

async function callOllama(model, prompt, temperature = 0.7) {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: model,
      prompt: prompt,
      format: 'json',
      stream: false,
      options: { temperature: temperature }
    });
    return cleanJsonOutput(response.data.response);
  } catch (error) {
    throw new Error(`Ollama API Error: ${error.message}`);
  }
}

// --- AGENT 1: THE LIBRARIAN (Content Organizer) ---
async function agentLibrarian(fullText, model) {
  console.log(chalk.blue("📚 Agent Librarian: Analyzing content to extract key concepts..."));

  // Pick 3 distributed chunks to get a good overview
  const chunkSize = 2500;
  const mid = Math.floor(fullText.length / 2);
  const chunks = [
    fullText.substring(0, Math.min(fullText.length, chunkSize)), // Beginning
    fullText.substring(mid, Math.min(fullText.length, mid + chunkSize)), // Middle
    fullText.substring(Math.max(0, fullText.length - chunkSize)) // End
  ];

  const concepts = [];

  for (const chunk of chunks) {
    const prompt = `
        You are a **Librarian** organizing course material.
        Analyze the following text excerpt and identify **2 DISTINCT, COMPLEX TECHNICAL CONCEPTS** discussed (e.g., "Virtualization Types", "Container Orchestration", "Network Latency").
        
        For each concept, extract a **relevant text segment** (approx 200-400 chars) from the provided text that defines or explains it.
        
        Return JSON:
        {
            "topics": [
                { "name": "Concept Name", "excerpt": "Exact text from source..." },
                { "name": "Concept Name 2", "excerpt": "Exact text from source..." }
            ]
        }

        TEXT EXCERPT:
        ${chunk}
        `;

    try {
      const json = await callOllama(model, prompt, 0.2);
      const parsed = JSON.parse(json);
      if (parsed.topics) concepts.push(...parsed.topics);
    } catch (e) {
      console.warn(chalk.yellow(`  ⚠️ Librarian failed on a chunk: ${e.message}`));
    }
  }

  // Deduplicate by name roughly
  const uniqueConcepts = concepts.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
  console.log(chalk.blue(`📚 Librarian found ${uniqueConcepts.length} concepts.`));
  return uniqueConcepts.slice(0, 5); // Take top 5
}

// --- AGENT 2: THE PROFESSOR (Question Generator) ---
async function agentProfessor(concepts, model) {
  console.log(chalk.magenta("🎓 Agent Professor: Generating calibrated questions..."));
  let allQuestions = [];

  // Distribute difficulties: We want 15 questions total.
  // If we have 5 concepts, generate 1 Easy, 1 Medium, 1 Hard for each.

  for (const topic of concepts) {
    console.log(chalk.dim(`  - Writing questions for topic: ${topic.name}`));

    const difficulties = ['easy', 'medium', 'hard'];

    for (const diff of difficulties) {
      const prompt = `
            You are a **University Professor**.
            Generate **1 Multiple Choice Question** in **ITALIAN** about the topic: "${topic.name}".
            User the provided context excerpt as the source of truth.
            
            **DIFFICULTY: ${diff.toUpperCase()}**
            ${diff === 'easy' ? '- Focus on definitions, terminology, or basic identification.' : ''}
            ${diff === 'medium' ? '- Focus on comparisons, functions, advantages, or simple application.' : ''}
            ${diff === 'hard' ? '- Focus on complex scenarios, troubleshooting, reasoning, or "best fit" analysis.' : ''}
            
            **RULES:**
            1. PHRASING: Must be a direct question (Quale, Cosa, Come, Perché).
            2. OPTIONS: 4 options total. 1 Correct, 3 Plausible Distractors.
            3. LANGUAGE: Professional Italian.
            4. **JSON ONLY**.
            
            CONTEXT:
            "${topic.excerpt}"
            
            Return JSON:
            {
                "type": "quiz",
                "difficulty": "${diff}",
                "text": "Question text?",
                "options": ["A", "B", "C", "D"],
                "correctIndex": 0, // 0-3
                "explanation": "Detailed explanation citing the text."
            }
            `;

      try {
        const json = await callOllama(model, prompt, 0.7);
        const q = JSON.parse(json);
        // Force fields if missing
        q.difficulty = diff;
        q.type = 'quiz';
        allQuestions.push(q);
      } catch (e) {
        console.warn(chalk.yellow(`    ⚠️ Professor failed to generate ${diff} q for ${topic.name}: ${e.message}`));
      }
    }
  }

  return allQuestions;
}

// --- AGENT 3: THE EDITOR (Reviewer) ---
async function agentEditor(questions, model) {
  console.log(chalk.green("🧐 Agent Editor: Reviewing and polishing questions..."));
  const polishedQuestions = [];

  for (const q of questions) {
    // Quick local validation first
    if (!q.text || !q.options || q.options.length < 2) continue;
    if (!q.text.trim().endsWith('?')) q.text += '?';

    // Simulating "Review" by self-correction prompt if needed, 
    // but for now, we trust the Professor's output if it validates structurally
    // to save time and API calls. 
    // We just enforce the schema.

    const cleanQ = {
      type: "quiz",
      difficulty: q.difficulty || "medium",
      text: q.text,
      options: q.options,
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation || "Risposta corretta basata sul testo."
    };

    polishedQuestions.push(cleanQ);
  }

  console.log(chalk.green(`🧐 Editor approved ${polishedQuestions.length} questions.`));
  return polishedQuestions;
}

// --- MAIN ---

async function main() {
  const args = process.argv.slice(2);
  const sourceFile = args[0];
  const userModel = args.find((a, i) => args[i - 1] === '--model') || DEFAULT_MODEL;

  if (!sourceFile) {
    console.log("Usage: node generate-quiz.js <file.pdf> [--model name]");
    process.exit(0);
  }

  const absPath = path.resolve(sourceFile);
  if (!fs.existsSync(absPath)) {
    console.error("File not found:", absPath);
    process.exit(1);
  }

  // 1. READ
  console.log(chalk.cyan(`📖 Reading ${path.basename(sourceFile)}...`));
  const text = await readPdf(absPath);
  if (text.length < 500) {
    console.error("Text too short to generate quiz.");
    process.exit(1);
  }

  // 2. AGENT 1: LIBRARIAN
  const topics = await agentLibrarian(text, userModel);
  if (topics.length === 0) {
    console.error("Librarian could not identify topics.");
    process.exit(1);
  }

  // 3. AGENT 2: PROFESSOR
  const rawQuestions = await agentProfessor(topics, userModel);

  // 4. AGENT 3: EDITOR
  const finalQuiz = await agentEditor(rawQuestions, userModel);

  // 5. SAVE
  const outputPath = path.join(__dirname, 'generated_quiz.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalQuiz, null, 2));
  console.log(chalk.white(`\n💾 Saved ${finalQuiz.length} questions to: ${outputPath}`));
}

main();
