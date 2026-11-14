require('dotenv').config();
const { StateGraph, MessagesAnnotation, START, END, MemorySaver } = require("@langchain/langgraph");
const { ToolNode, toolsCondition } = require("@langchain/langgraph/prebuilt");
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { HumanMessage, AIMessage, ToolMessage } = require("@langchain/core/messages");

console.log("Testing LangGraph multi-step tool condition loop...");

// 1. Tool
const checkBalance = tool(
    async () => JSON.stringify({ accounts: [{ type: "savings", balance: 52000, currency: "INR" }] }),
    {
        name: "check_account_balance",
        description: "Check live bank balance",
        schema: z.object({})
    }
);

const tools = [checkBalance];
const toolNode = new ToolNode(tools);

// 2. Mock model node that issues a tool call on first turn, then final answer on second turn
let callCount = 0;
const agentNode = async (state) => {
    callCount++;
    if (callCount === 1) {
        // Return an AIMessage with a tool_call
        return {
            messages: [
                new AIMessage({
                    content: "",
                    tool_calls: [
                        {
                            id: "call_abc123",
                            name: "check_account_balance",
                            args: {}
                        }
                    ]
                })
            ]
        };
    } else {
        // Turn 2: Interpret tool result
        const toolMsg = state.messages.find(m => m instanceof ToolMessage || m._getType?.() === "tool");
        return {
            messages: [
                new AIMessage({
                    content: `Aapke Savings Account me ₹52,000 uplabdh hain! (Processed via LangGraph)`
                })
            ]
        };
    }
};

const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition)
    .addEdge("tools", "agent");

const app = workflow.compile({ checkpointer: new MemorySaver() });

async function run() {
    const res = await app.invoke(
        { messages: [new HumanMessage("Mera balance kitna hai?")] },
        { configurable: { thread_id: "thread_123" } }
    );

    console.log("Total messages in thread:", res.messages.length);
    for (const msg of res.messages) {
        console.log(`[${msg.constructor.name || msg._getType()}]:`, msg.content || JSON.stringify(msg.tool_calls));
    }
}

run().catch(console.error);
