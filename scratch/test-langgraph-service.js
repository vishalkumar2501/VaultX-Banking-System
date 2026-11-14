require('dotenv').config();
const mongoose = require('mongoose');
const langgraphService = require('../src/services/langgraph.agent.service');

async function testLangGraphService() {
    try {
        console.log("Testing LangGraph service compilation...");
        const graph = langgraphService.buildBankingStateGraph("mock_user_123");
        console.log("Graph compiled successfully!");
        console.log("Graph nodes:", Object.keys(graph.nodes || {}));
    } catch (e) {
        console.error("Compilation error:", e.message);
    }
}

testLangGraphService();
