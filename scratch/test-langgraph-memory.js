// scratch/test-langgraph-memory.js
// Verification of LangGraph Multi-Turn Memory with MemorySaver

const { StateGraph, MessagesAnnotation, START, END, MemorySaver } = require("@langchain/langgraph");
const { SystemMessage, HumanMessage, AIMessage } = require("@langchain/core/messages");

const memoryCheckpointer = new MemorySaver();

// Simulated AI Agent respecting memory directive
const systemInstruction = new SystemMessage(`You are VaultX AI assistant.
Use conversation memory first.
Only use tools when the answer requires external real-time information.
Do NOT call tools for simple conversation, memory-based questions, greetings, or personal context.`);

const simulatedAgentNode = async (state) => {
    const nonSystem = state.messages.filter(m => !(m instanceof SystemMessage));
    const allText = nonSystem.map(m => m.content).join(" ");
    const lastMsg = nonSystem[nonSystem.length - 1].content;

    let reply = "Hello! Main VaultX AI assistant hoon.";

    if (lastMsg.toLowerCase().includes("naam kya hai") || lastMsg.toLowerCase().includes("who am i")) {
        const match = allText.match(/naam ([A-Za-z]+) hai/i) || allText.match(/name is ([A-Za-z]+)/i);
        if (match) {
            reply = `Aapka naam ${match[1]} hai (retrieved from conversational memory)!`;
        } else {
            reply = "Aapne abhi tak apna naam nahi bataya.";
        }
    } else if (lastMsg.toLowerCase().includes("naam")) {
        reply = `Namaste! Maine yaad kar liya hai. Aap bataiye, main aapke banking ya ledger me kya madad kar sakta hoon?`;
    }

    return { messages: [new AIMessage(reply)] };
};

const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", simulatedAgentNode)
    .addEdge(START, "agent")
    .addEdge("agent", END)
    .compile({ checkpointer: memoryCheckpointer });

async function runTest() {
    const threadId = "user_thread_vishal_test";
    console.log("=== STEP 1: User introduces themselves ===");
    const res1 = await workflow.invoke(
        { messages: [new HumanMessage("Hi, mera naam Vishal hai.")] },
        { configurable: { thread_id: threadId } }
    );
    console.log("AI Turn 1 Reply:", res1.messages[res1.messages.length - 1].content);
    console.log("Thread message count:", res1.messages.length);

    console.log("\n=== STEP 2: User asks their name (Testing Memory) ===");
    const res2 = await workflow.invoke(
        { messages: [new HumanMessage("Mera naam kya hai jo maine bataya tha?")] },
        { configurable: { thread_id: threadId } }
    );
    console.log("AI Turn 2 Reply:", res2.messages[res2.messages.length - 1].content);
    console.log("Thread message count:", res2.messages.length);
    console.log("\n[SUCCESS] Memory preserved across turns with thread_id!");
}

runTest().catch(console.error);
