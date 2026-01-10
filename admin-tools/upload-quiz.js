import { readFile } from 'fs/promises';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';

// Load env vars
// Try modern Node first, fallback to manual parsing
try {
    // Check if process.loadEnvFile exists (Node 20.12+/21.7+)
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile('../.env');
    } else {
        throw new Error("Native loadEnvFile not supported");
    }
} catch (err) {
    console.log("Loading .env manually...");
    try {
        const envContent = await readFile('../.env', 'utf-8');
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

const COURSE_ID = 'cloud';
const LEVEL_ID = 'c-01-arch';

async function uploadQuiz() {
    try {
        const rawData = await readFile('./generated_quiz.json', 'utf-8');
        const questions = JSON.parse(rawData);

        if (!Array.isArray(questions)) {
            throw new Error("JSON content is not an array");
        }

        console.log(`Found ${questions.length} questions to upload.`);
        console.log(`Target: Course '${COURSE_ID}', Level '${LEVEL_ID}'`);

        const batchSize = 400; // Safe limit under 500
        const chunks = [];
        for (let i = 0; i < questions.length; i += batchSize) {
            chunks.push(questions.slice(i, i + batchSize));
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
