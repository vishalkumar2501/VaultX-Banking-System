require('dotenv').config();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');

console.log("Testing LangChain tool definition...");

const balanceTool = tool(
    async ({ accountType }) => {
        return JSON.stringify({ accountType: accountType || "savings", balance: 25000, currency: "INR" });
    },
    {
        name: "check_account_balance",
        description: "Checks the live balance of the user's bank account",
        schema: z.object({
            accountType: z.string().optional().describe("Type of account e.g. savings or current")
        })
    }
);

console.log("Tool created:", balanceTool.name);
