import { readFile, access, constants } from 'fs/promises';
import * as fs from 'fs'; // Sync check
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
// Try modern Node first, fallback to manual parsing
try {
    // Check if process.loadEnvFile exists (Node 20.12+/21.7+)
    const envPath = path.resolve(__dirname, '../.env');
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envPath);
    } else {
        throw new Error("Native loadEnvFile not supported");
    }
} catch (err) {
    console.log("Loading .env manually...");
    try {
        const envPath = path.resolve(__dirname, '../.env');
        const envContent = await readFile(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...rest] = trimmed.split('=');
                if (key) {
                    const val = rest.join('=');
                    process.env[key.trim()] = val ? val.trim() : '';
                }
            }
        });
    } catch (e) {
        console.error("Failed to load .env file:", e);
        process.exit(1);
    }
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Check if critical config is present
if (!firebaseConfig.apiKey) {
    console.error("Error: VITE_FIREBASE_API_KEY not found in environment.");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error("Usage: node upload-quiz.js <levelId>");
    process.exit(1);
}

const LEVEL_ID = args[0];

async function uploadQuiz() {
    try {
        let quizPath = './generated_quiz.json';
        if (args[1]) quizPath = args[1];

        // Default to 'cloud', but allow override via 3rd arg
        const COURSE_ID = args[2] || 'accounting'; // Changed default preference for this session or logic


        console.log(`Reading quiz from: ${quizPath}`);
        const rawData = await readFile(quizPath, 'utf-8');
        const questions = JSON.parse(rawData);

        if (!Array.isArray(questions)) {
            throw new Error("JSON content is not an array");
        }

        console.log(`Found ${questions.length} questions to upload.`);
        console.log(`Target: Course '${COURSE_ID}', Level '${LEVEL_ID}'`);

        // Deduplication Step: Fetch existing questions for this Course + Level
        console.log("Checking for duplicates in DB...");
        const { getDocs, query, where } = await import('firebase/firestore');
        const qSnapshot = await getDocs(query(
            collection(db, "questions"),
            where("courseId", "==", COURSE_ID),
            where("levelId", "==", LEVEL_ID)
        ));

        const existingTexts = new Set();
        qSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.text) existingTexts.add(data.text.trim());
        });

        console.log(`Found ${existingTexts.size} existing questions in DB.`);

        // Filter new questions
        const newQuestions = questions.filter(q => {
            if (!q.text) return false;
            return !existingTexts.has(q.text.trim());
        });

        if (newQuestions.length === 0) {
            console.log("✅ All questions already exist. Nothing to upload.");
            process.exit(0);
        }

        console.log(`✨ Uploading ${newQuestions.length} NEW questions (skipped ${questions.length - newQuestions.length} duplicates).`);

        const batchSize = 400; // Safe limit under 500
        const chunks = [];
        for (let i = 0; i < newQuestions.length; i += batchSize) {
            chunks.push(newQuestions.slice(i, i + batchSize));
        }

        let totalUploaded = 0;

        for (const chunk of chunks) {
            const batch = writeBatch(db);

            chunk.forEach(q => {
                // Create a reference with a random ID
                const newDocRef = doc(collection(db, "questions"));

                // Prepare data
                const data = {
                    ...q,
                    courseId: COURSE_ID,
                    levelId: LEVEL_ID,
                    createdAt: new Date()
                };

                batch.set(newDocRef, data);
            });

            await batch.commit();
            totalUploaded += chunk.length;
            console.log(`Uploaded batch of ${chunk.length} questions. Total: ${totalUploaded}`);
        }

        console.log("✅ Upload complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error uploading quiz:", error);
        process.exit(1);
    }
}

uploadQuiz();
