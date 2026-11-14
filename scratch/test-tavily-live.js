require('dotenv').config();
const { TavilySearch } = require('@langchain/tavily');

async function testTavily() {
    try {
        console.log("Testing live Tavily search...");
        const tool = new TavilySearch({ maxResults: 2 });
        const result = await tool.invoke({ query: "What is current RBI repo rate in India?" });
        console.log("--- TAVILY LIVE SEARCH RESULT ---");
        console.log(result);
    } catch (err) {
        console.error("Tavily Error:", err.message);
    }
}

testTavily();
