// scratch/test-rag-prototype.js
// Verification of End-to-End RAG Pipeline:
// 1. Load PDF -> 2. Chunking -> 3. Vector Embeddings -> 4. Vector Store -> 5. Similarity Retrieval

const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// Mathematically Sound Local Dense Vector Embedder (128-dim TF-IDF & Subword Hashing)
function embedText(text, dim = 128) {
    const vec = new Float64Array(dim);
    const tokens = (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    
    if (tokens.length === 0) return Array.from(vec);

    tokens.forEach((token, idx) => {
        // Word hash
        let h = 0;
        for (let i = 0; i < token.length; i++) {
            h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
        }
        const index = Math.abs(h) % dim;
        vec[index] += 1.0;

        // Bigram hashing for phrase context
        if (idx < tokens.length - 1) {
            const bigram = token + "_" + tokens[idx + 1];
            let bh = 0;
            for (let i = 0; i < bigram.length; i++) {
                bh = (Math.imul(33, bh) + bigram.charCodeAt(i)) | 0;
            }
            vec[Math.abs(bh) % dim] += 1.5;
        }
    });

    // L2 Normalization (so dot product equals cosine similarity)
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
        for (let i = 0; i < dim; i++) vec[i] /= norm;
    }

    return Array.from(vec);
}

function cosineSimilarity(vecA, vecB) {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
    }
    return dot;
}

class InMemoryVectorStore {
    constructor() {
        this.documents = [];
    }

    add(doc) {
        this.documents.push(doc);
    }

    similaritySearch(query, topK = 3) {
        const queryVec = embedText(query);
        const scored = this.documents.map(doc => ({
            ...doc,
            similarity: cosineSimilarity(queryVec, doc.embedding)
        }));

        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, topK);
    }
}

async function testRAG() {
    const pdfPath = path.join(__dirname, "..", "data", "VAULTX_BANK_POLICY_2026.pdf");
    console.log("1. Loading PDF from:", pdfPath);
    const buffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse(new Uint8Array(buffer));
    await parser.load();
    const textResult = await parser.getText();
    const fullText = typeof textResult === "string" ? textResult : (textResult.text || JSON.stringify(textResult));
    console.log("Extracted characters:", fullText.length);

    console.log("\n2. Chunking text with RecursiveCharacterTextSplitter...");
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 450,
        chunkOverlap: 80
    });
    const chunks = await splitter.splitText(fullText);
    console.log(`Generated ${chunks.length} chunks!`);

    console.log("\n3. Generating Vector Embeddings & Populating Vector Store...");
    const store = new InMemoryVectorStore();
    chunks.forEach((chunk, index) => {
        store.add({
            id: `chunk_${index + 1}`,
            content: chunk,
            embedding: embedText(chunk),
            metadata: { source: "VAULTX_BANK_POLICY_2026.pdf", chunkIndex: index + 1 }
        });
    });

    console.log("\n4. Testing Retrieval Queries:");

    const testQueries = [
        "What is the starting interest rate for VaultX Home Loan?",
        "What is the penalty if I don't maintain balance in Gold Privilege account?",
        "Who is the Grievance Redressal Officer and how to contact him?",
        "What is the interest rate on 2 to 3 years Fixed Deposit for senior citizens?"
    ];

    for (const q of testQueries) {
        console.log("--------------------------------------------------------------------------------");
        console.log("❓ Query:", q);
        const topMatches = store.similaritySearch(q, 2);
        topMatches.forEach((match, idx) => {
            console.log(`\n  Top [${idx + 1}] Match (Similarity Score: ${match.similarity.toFixed(4)}):`);
            console.log(`  "${match.content.trim().replace(/\n+/g, " ")}"`);
        });
    }
}

testRAG().catch(console.error);
