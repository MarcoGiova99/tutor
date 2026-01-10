
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'generated_quiz.json');
const raw = fs.readFileSync(filePath, 'utf-8');
let questions = JSON.parse(raw);

console.log(`Loaded ${questions.length} questions.`);

const cleaned = questions.filter(q => {
    // 1. Remove if options are just "A", "B", "C", "D"
    const isPlaceholder = q.options.every(o => o.length < 3);
    if (isPlaceholder) {
        console.log(`Removing placeholder Q: ${q.text.substring(0, 30)}...`);
        return false;
    }
    return true;
}).map(q => {
    // 2. Fix interleaved options ["A", "Real Option", "B", "Real Option"]
    // Detect pattern: Even indices are single letters?
    let newOptions = [];
    let isInterleaved = false;

    if (q.options.length >= 8) {
        // Check if 0, 2, 4, 6 are short
        if (q.options[0].length < 3 && q.options[2].length < 3) {
            isInterleaved = true;
        }
    }

    if (isInterleaved) {
        console.log(`Fixing interleaved Q: ${q.text.substring(0, 30)}...`);
        // Take odd indices: 1, 3, 5, 7
        newOptions = q.options.filter((_, i) => i % 2 !== 0);
    } else {
        newOptions = q.options;
    }

    // 3. Fix "A", "Option..." where output is ["A", "Option..."] (Wait, that's interleaved)
    // Sometimes it's ["A", "Option A content...", "B", "Option B content..."]
    // Sometimes ["A Option A", "B Option B"] -> This is fine.

    // Update q
    q.options = newOptions;

    // Recalculate correctIndex if needed? 
    // Usually correctIndex refers to the semantic option. 
    // If we drop labels, index might shift?
    // If labels were 0, 2, 4, 6... and correct was 2 (Label B) or 3 (Value B)?
    // The model usually sets correctIndex to the 0-3 index of the *answer*.
    // If it produced 8 items, correctIndex might be 0..7.
    // Llama 3.2 is unpredictable.
    // If correctIndex > 3, we map it. 
    // If correctIndex is odd (1, 3, 5, 7), it points to the value. That maps to 0, 1, 2, 3.
    // (1->0, 3->1, 5->2, 7->3). Formula: (i-1)/2.

    if (isInterleaved && q.correctIndex > 3) {
        // Assuming it pointed to the value line
        q.correctIndex = Math.floor((q.correctIndex - 1) / 2);
    } else if (isInterleaved && q.correctIndex % 2 === 0) {
        // Pointed to label? Move to value?
        q.correctIndex = q.correctIndex / 2;
    }

    return q;
}).filter(q => q.options.length === 4); // Final sanity check

console.log(`Saving ${cleaned.length} questions.`);
fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
