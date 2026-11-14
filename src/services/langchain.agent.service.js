// [AI INTEGRATION: LANGCHAIN AI AGENT WITH TOOL CALLING & TAVILY SEARCH]
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { tool } = require("@langchain/core/tools")
const { z } = require("zod")
const { TavilySearch } = require("@langchain/tavily")
const { SystemMessage, HumanMessage, ToolMessage } = require("@langchain/core/messages")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")

/**
 * 1. Initialize LangChain Gemini Model
 */
const getLangChainModel = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not defined in environment")
    }

    return new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey,
        temperature: 0.2,
        maxRetries: 2
    })
}

/**
 * 2. Create User-Scoped LangChain Tools
 * These tools allow the AI Agent to dynamically read live ledger data for the authenticated user
 */
const createUserBankingTools = (userId) => {
    // Tool 1: Live Account Balance from Immutable Ledger
    const checkBalanceTool = tool(
        async ({ accountType }) => {
            const accounts = await accountModel.find({ user: userId })
            if (!accounts || accounts.length === 0) {
                return JSON.stringify({ error: "No bank accounts found for this user" })
            }

            const results = []
            let totalBalance = 0

            for (const acc of accounts) {
                const bal = await acc.getBalance()
                totalBalance += bal
                results.push({
                    accountId: acc._id.toString(),
                    status: acc.status,
                    currency: acc.currency,
                    balance: bal
                })
            }

            return JSON.stringify({
                accounts: results,
                totalAccounts: accounts.length,
                totalBalance
            })
        },
        {
            name: "check_account_balance",
            description: "Fetches live account balance dynamically from the double-entry ledger for the authenticated user.",
            schema: z.object({
                accountType: z.string().optional().describe("Optional account type filter")
            })
        }
    )

    // Tool 2: Recent Transactions History
    const getTransactionsTool = tool(
        async ({ limit }) => {
            const count = Math.min(limit || 5, 20)
            const accounts = await accountModel.find({ user: userId })
            const accountIds = accounts.map(a => a._id)

            if (accountIds.length === 0) {
                return JSON.stringify({ error: "No accounts found" })
            }

            const rawTx = await transactionModel.find({
                $or: [{ fromAccount: { $in: accountIds } }, { toAccount: { $in: accountIds } }]
            })
            .sort({ createdAt: -1 })
            .limit(count)
            .lean()

            const transactions = rawTx.map(tx => {
                const isDebit = accountIds.some(id => id.toString() === tx.fromAccount?.toString())
                return {
                    type: isDebit ? "DEBIT" : "CREDIT",
                    amount: tx.amount,
                    status: tx.status,
                    date: tx.createdAt
                }
            })

            return JSON.stringify({
                fetchedCount: transactions.length,
                transactions
            })
        },
        {
            name: "get_recent_transactions",
            description: "Fetches the recent debit and credit transaction history of the user.",
            schema: z.object({
                limit: z.number().optional().default(5).describe("Number of transactions to retrieve (max 20)")
            })
        }
    )

    // Tool 3: Financial Health & Spending Overview
    const analyzeSpendingTool = tool(
        async () => {
            const accounts = await accountModel.find({ user: userId })
            const accountIds = accounts.map(a => a._id)

            let totalBalance = 0
            for (const acc of accounts) {
                totalBalance += await acc.getBalance()
            }

            const rawTx = await transactionModel.find({
                $or: [{ fromAccount: { $in: accountIds } }, { toAccount: { $in: accountIds } }]
            }).lean()

            let totalInflow = 0
            let totalOutflow = 0

            rawTx.forEach(tx => {
                const isDebit = accountIds.some(id => id.toString() === tx.fromAccount?.toString())
                if (isDebit) {
                    totalOutflow += tx.amount
                } else {
                    totalInflow += tx.amount
                }
            })

            return JSON.stringify({
                totalBalance,
                totalInflow,
                totalOutflow,
                netSavings: totalInflow - totalOutflow,
                transactionsCount: rawTx.length
            })
        },
        {
            name: "analyze_spending_overview",
            description: "Calculates total inflow, total outflow, and net savings from the ledger.",
            schema: z.object({})
        }
    )

    const tavilyTool = (() => {
        const rawKey = process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.trim() : ""
        if (rawKey && rawKey.startsWith("tvly-")) {
            return new TavilySearch({ maxResults: 3, topic: "general" })
        }
        return tool(
            async ({ query }) => JSON.stringify({
                notice: "TAVILY_API_KEY is not set or empty in .env",
                guidance: "Please add TAVILY_API_KEY=tvly-... in .env from https://app.tavily.com/ (1000 free searches/month).",
                query
            }),
            {
                name: "tavily_search",
                description: "Search the web for real-time market facts, financial news, and current events.",
                schema: z.object({ query: z.string().describe("Query to search on web") })
            }
        )
    })()

    const tools = [checkBalanceTool, getTransactionsTool, analyzeSpendingTool, tavilyTool]
    const toolMap = {
        check_account_balance: checkBalanceTool,
        get_recent_transactions: getTransactionsTool,
        analyze_spending_overview: analyzeSpendingTool,
        tavily_search: tavilyTool
    }

    return { tools, toolMap }
}

/**
 * 3. Run Autonomous LangChain Banking Agent with Tool Calling Loop
 */
const runBankingAgent = async (userId, userMessage) => {
    const model = getLangChainModel()
    const { tools, toolMap } = createUserBankingTools(userId)

    // Bind LangChain tools to Gemini model
    const modelWithTools = model.bindTools(tools)

    const systemPrompt = `
You are the VaultX Autonomous Banking AI Agent powered by LangChain and Google Gemini.
You have access to 3 tools to retrieve real bank data:
1. check_account_balance: To view user's live balance from ledger.
2. get_recent_transactions: To view transaction history.
3. analyze_spending_overview: To get total inflow, outflow, and net savings.

Security & Integrity Rules:
- When a user asks about their money, ALWAYS invoke the appropriate tool to fetch verified data.
- NEVER invent or guess account balances or transactions.
- Answer in friendly, natural Hinglish or English.
- If asked to transfer money directly, politely inform the user: "Security reasons se direct money transfer ke liye please official /api/transactions endpoint use karein."
`

    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage)
    ]

    // Step 1: Initial invocation
    let response = await modelWithTools.invoke(messages)

    // Step 2: Agent Tool Calling Loop (Multi-turn tool resolution)
    let iterations = 0
    const maxIterations = 5 // prevent infinite loops

    while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
        iterations++
        messages.push(response)

        for (const call of response.tool_calls) {
            const toolToExecute = toolMap[call.name]
            if (toolToExecute) {
                const toolResult = await toolToExecute.invoke(call.args)
                messages.push(
                    new ToolMessage({
                        tool_call_id: call.id,
                        name: call.name,
                        content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult)
                    })
                )
            }
        }

        // Invoke model with tool outputs
        response = await modelWithTools.invoke(messages)
    }

    return {
        agentReply: response.content,
        toolsUsed: iterations > 0
    }
}

/**
 * 4. Structured Output with LangChain Zod Schema: Financial Advisor Insights
 */
const generateStructuredInsightsWithLangChain = async (userId) => {
    const model = getLangChainModel()

    // Fetch user context from database
    const accounts = await accountModel.find({ user: userId })
    const accountIds = accounts.map(a => a._id)

    const balances = []
    for (const acc of accounts) {
        balances.push({
            accountId: acc._id.toString(),
            balance: await acc.getBalance()
        })
    }

    const recentTx = await transactionModel.find({
        $or: [{ fromAccount: { $in: accountIds } }, { toAccount: { $in: accountIds } }]
    }).sort({ createdAt: -1 }).limit(10).lean()

    const prompt = `
You are VaultX Financial Advisor. Analyze this user financial data:
Accounts: ${JSON.stringify(balances)}
Recent Transactions: ${JSON.stringify(recentTx, null, 2)}

Return a structured JSON analysis with:
{
  "financialHealth": "EXCELLENT" | "GOOD" | "MODERATE" | "ATTENTION_NEEDED",
  "summary": "Brief 2-3 sentence overview",
  "totalInflow": number,
  "totalOutflow": number,
  "keyObservations": ["point 1", "point 2"],
  "actionableTips": ["tip 1", "tip 2", "tip 3"]
}
Return ONLY valid JSON.
`

    const response = await model.invoke([
        new SystemMessage("You are an expert financial analyst. Always output pure valid JSON."),
        new HumanMessage(prompt)
    ])

    const text = response.content.toString().replace(/```json/g, "").replace(/```/g, "").trim()
    return JSON.parse(text)
}

module.exports = {
    runBankingAgent,
    generateStructuredInsightsWithLangChain
}
