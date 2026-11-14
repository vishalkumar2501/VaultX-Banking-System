// scratch/test-video-upload.js
// Exact upload function implementation from the YouTube tutorial screenshot

const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const upload = async () => {
    const pdfPath = "./knowledge.pdf";
    const buffer = fs.readFileSync(pdfPath);
    const pdfResult = new PDFParse({ data: buffer });
    const result = await pdfResult.getText();
    const text = result.text;

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    });

    const docs = await splitter.createDocuments([text]);

    console.log("================================================================================");
    console.log("📄 EXACT VIDEO CHUNKING OUTPUT (docs array with chunkSize 1000, overlap 200):");
    console.log("================================================================================\n");
    console.log("Total docs created:", docs.length);
    console.log("\nDocs preview (first 2 docs):");
    console.log(docs.slice(0, 2));
};

upload().catch(console.error);
