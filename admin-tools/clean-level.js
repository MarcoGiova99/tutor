import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { readFile } from 'fs/promises';

// Load env vars
try {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile('../.env');
    } else {
        const envContent = await readFile('../.env', 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...rest] = trimmed.split('=');
                if (key) process.env[key.trim()] = rest.join('=').trim();
            }
        });
    }
} catch (e) { console.log("Env loading warning:", e.message); }

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

async function cleanLevel() {
    console.log(`Cleaning old questions for level: ${LEVEL_ID}...`);
    try {
        const q = query(collection(db, "questions"), where("levelId", "==", LEVEL_ID));
        const snap = await getDocs(q);

        if (snap.empty) {
            console.log("No questions to delete.");
            process.exit(0);
        }

        console.log(`Found ${snap.size} questions. Deleting...`);

        const batchSize = 400;
        const chunks = [];
        for (let i = 0; i < snap.docs.length; i += batchSize) {
            chunks.push(snap.docs.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`Deleted batch of ${chunk.length}`);
        }

        console.log("✅ Level cleaned!");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

cleanLevel();
