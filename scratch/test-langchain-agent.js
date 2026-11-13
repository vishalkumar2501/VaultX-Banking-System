require('dotenv').config();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { SystemMessage, HumanMessage, ToolMessage } = require('@langchain/core/messages');

console.log("Testing LangChain Agent Loop structure...");

// Define tools
const checkBalance = tool(
    async ({ currency }) => {
        return JSON.stringify({
            accounts: [
                { accountId: "acc_101", balance: 45000, currency: currency || "INR", status: "ACTIVE" }
            ],
            totalBalance: 45000
        });
    },
    {
        name: "check_account_balance",
        description: "Fetch live bank balance for all accounts of user from the ledger",
        schema: z.object({
            currency: z.string().optional().describe("Currency e.g. INR")
        })
    }
);

const checkTransactions = tool(
    async ({ limit }) => {
        return JSON.stringify([
            { type: "DEBIT", amount: 1200, status: "COMPLETED", date: "2026-11-12" },
            { type: "CREDIT", amount: 50000, status: "COMPLETED", date: "2026-11-10" }
        ]);
    },
    {
        name: "get_recent_transactions",
        description: "Fetch recent transactions history of user from database",
        schema: z.object({
            limit: z.number().optional().default(5).describe("Max transactions to retrieve")
        })
    }
);

const tools = [checkBalance, checkTransactions];
const toolMap = {
    check_account_balance: checkBalance,
    get_recent_transactions: checkTransactions
};

console.log("Registered tools:", Object.keys(toolMap));
