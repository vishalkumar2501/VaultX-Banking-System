require('dotenv').config();
const { StateGraph, MessagesAnnotation, START, END, MemorySaver } = require("@langchain/langgraph");
const { ToolNode, toolsCondition } = require("@langchain/langgraph/prebuilt");
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

console.log("Testing minimal LangGraph graph creation...");

// Minimal test tool
const mockBalanceTool = tool(
    async () => JSON.stringify({ balance: 50000, currency: "INR" }),
    {
        name: "get_balance",
        description: "Get bank balance",
        schema: z.object({})
    }
);

const tools = [mockBalanceTool];
const toolNode = new ToolNode(tools);

// Define a simple node
const mockAgentNode = (state) => {
    return {
        messages: [new AIMessage({ content: "LangGraph Agent is working!" })]
    };
};

const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", mockAgentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition)
    .addEdge("tools", "agent");

const app = workflow.compile({ checkpointer: new MemorySaver() });

async function run() {
    const result = await app.invoke(
        { messages: [new HumanMessage("Hello LangGraph")] },
        { configurable: { thread_id: "test-user-1" } }
    );

    console.log("Graph result message count:", result.messages.length);
    console.log("Last message:", result.messages[result.messages.length - 1].content);
}

run().catch(console.error);
