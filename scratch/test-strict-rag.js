// scratch/test-strict-rag.js
require("dotenv").config()
const http = require("http")
const app = require("../src/app")

async function run() {
    console.log("=================================================================")
    console.log("  TESTING STRICT PDF-GROUNDED RAG (ZERO OUTSIDE HALLUCINATION)")
    console.log("=================================================================\n")

    const server = http.createServer(app)
    await new Promise(resolve => server.listen(5001, resolve))
    console.log("✅ Test Server listening on http://localhost:5001/ai\n")

    async function sendQuery(input) {
        const response = await fetch("http://localhost:5001/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input })
        })
        return await response.json()
    }

    const testCases = [
        {
            query: "what is the price of Banana Pack 7?",
            expect: "Should return exact price from PDF (n715)"
        },
        {
            query: "what is the price of 1kg sugar?",
            expect: "Should return Rs 45 from PDF"
        },
        {
            query: "what is the starting interest rate for VaultX Home Loan?",
            expect: "Should return 8.35% from PDF"
        },
        {
            query: "what is the price of Samsung Galaxy S24?",
            expect: "OUTSIDE PDF TOPIC -> Must strictly reject!"
        },
        {
            query: "who is the prime minister of UK?",
            expect: "OUTSIDE PDF TOPIC -> Must strictly reject!"
        }
    ]

    for (const tc of testCases) {
        console.log(`[QUERY] "${tc.query}"`)
        console.log(`[EXPECTATION]: ${tc.expect}`)
        const res = await sendQuery(tc.query)
        console.log(`[RESPONSE]:`, res)
        console.log("-----------------------------------------------------------------\n")
    }

    server.close()
    console.log("🎉 ALL STRICT RAG TESTS COMPLETED!")
    process.exit(0)
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})
