import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { readFile } from 'fs/promises';

// Load env vars (same logic as upload script)
try {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile('../.env');
    } else {
        // Fallback manual parsing
        const envContent = await readFile('../.env', 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...rest] = trimmed.split('=');
                if (key) process.env[key.trim()] = rest.join('=').trim();
            }
        });
    }
} catch (e) {
    console.log("Env loading warning:", e.message);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LEVEL_ID = 'c-04-virt';

async function checkQuestions() {
    console.log(`Checking questions for level: ${LEVEL_ID}...`);
    try {
        const q = query(collection(db, "questions"), where("levelId", "==", LEVEL_ID));
        const snap = await getDocs(q);

        console.log(`\nTotal questions found: ${snap.size}`);

        if (snap.empty) {
            console.log("No questions found.");
            process.exit(0);
        }

        console.log("\nSample questions:\n");
        snap.docs.slice(0, 5).forEach((doc, i) => {
            const data = doc.data();
            console.log(`${i + 1}. [${doc.id}] ${data.text.substring(0, 100)}...`);
            console.log(`   Created At: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkQuestions();
