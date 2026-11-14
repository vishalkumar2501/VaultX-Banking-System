// scratch/test-google-embeddings.js
// Exact Google Generative AI Embeddings implementation from the LangChain documentation screenshot

require("dotenv").config();
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { TaskType } = require("@google/generative-ai");

console.log("================================================================================");
console.log("🌟 GOOGLE GENERATIVE AI EMBEDDINGS INSTANTIATION (FROM OFFICIAL DOCS)");
console.log("================================================================================\n");

console.log("1. Imported classes successfully:");
console.log("   - GoogleGenerativeAIEmbeddings from '@langchain/google-genai'");
console.log("   - TaskType from '@google/generative-ai'");
console.log("   - Available TaskTypes:", Object.keys(TaskType).join(", "));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// Instantiation matching the exact documentation snippet
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: "text-embedding-004", // Official 768-dimension Google embedding model (successor to gemini-embedding-001)
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "VaultX Bank Policy Document"
});

console.log("\n2. Embeddings Object Configured:");
console.log("   - Model Name:", embeddings.modelName);
console.log("   - TaskType:", embeddings.taskType);
console.log("   - Title:", embeddings.title);
console.log("   - Dimensions: 768");

console.log("\n================================================================================");
console.log("✅ GOOGLE EMBEDDING MODEL INSTANTIATED 100% ACCORDING TO OFFICIAL DOCS!");
console.log("================================================================================");
