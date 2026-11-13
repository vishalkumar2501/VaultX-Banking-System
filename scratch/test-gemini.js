require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

console.log("Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log("Key prefix:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) : "none");

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // Test standard model like gemini-2.5-flash or gemini-2.0-flash or gemini-1.5-flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello! Respond with: "VaultX AI Online"'
        });
        console.log("Response text:", response.text);
    } catch (err) {
        console.error("Test error:", err.message);
        if (err.status) console.error("Status:", err.status);
    }
}

test();
