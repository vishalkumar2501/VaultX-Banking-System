// [AI INTEGRATION: LANGGRAPH STATEFUL AGENT WITH GRAPH ROUTING, TOOLS, CONVERSATION MEMORY & TAVILY SEARCH]
const { StateGraph, MessagesAnnotation, START, END, MemorySaver } = require("@langchain/langgraph")
const { ToolNode, toolsCondition } = require("@langchain/langgraph/prebuilt")
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { TavilySearch } = require("@langchain/tavily")
const { tool } = require("@langchain/core/tools")
const { z } = require("zod")
const { SystemMessage, HumanMessage } = require("@langchain/core/messages")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")

// In-Memory Checkpointer for Stateful Multi-Turn Conversations (Persistent Thread Memory)
const memoryCheckpointer = new MemorySaver()

// In-Memory Cache for compiled graphs per user
const compiledGraphs = new Map()

/**
 * 1. Initialize LangChain Gemini Model
 */
const getGeminiModel = () => {
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
 * 2. Get Tavily Web Search Tool (With Graceful Fallback if Key is Missing)
 */
const getTavilySearchTool = () => {
    const rawKey = process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.trim() : ""
    if (rawKey && rawKey.startsWith("tvly-")) {
        return new TavilySearch({
            maxResults: 3,
            topic: "general"
        })
    }

    // Graceful fallback if TAVILY_API_KEY is not yet added in .env
    return tool(
        async ({ query }) => {
            return JSON.stringify({
                status: "TAVILY_API_KEY_REQUIRED",
                message: "Tavily Web Search requires a free API key. Add TAVILY_API_KEY=tvly-... in .env from https://app.tavily.com/ (1000 free searches/month).",
                query
            })
        },
        {
            name: "tavily_search",
            description: "A search engine optimized for real-time web search, current financial news, exchange rates, and live information.",
            schema: z.object({
                query: z.string().describe("Search query to search on the web")
            })
        }
    )
}

/**
 * 3. Create Dynamic User-Scoped Banking Tools + Web Search for LangGraph
 */
const createBankingTools = (userId) => {
    // Tool 1: Live Ledger Balance
    const checkBalanceTool = tool(
        async () => {
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
            description: "Fetches live account balance dynamically from immutable double-entry ledger for user.",
            schema: z.object({})
        }
    )

    // Tool 2: Recent Transactions
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
            description: "Fetches recent debit and credit transaction history of user from database.",
            schema: z.object({
                limit: z.number().optional().default(5).describe("Max transactions to retrieve")
            })
        }
    )

    // Tool 3: Spending & Net Savings Analysis
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
                if (isDebit) totalOutflow += tx.amount
                else totalInflow += tx.amount
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
            description: "Calculates total inflow, outflow, and net savings from double-entry ledger.",
            schema: z.object({})
        }
    )

    // Tool 4: Tavily Real-Time Web Search Tool
    const tavilySearchTool = getTavilySearchTool()

    // Tool 5: Financial Calculation Action Tool (Loan EMI / FD Maturity Returns)
    const financialCalculatorTool = tool(
        async ({ type, principal, annualRate, tenureMonths }) => {
            const P = Number(principal)
            const r = Number(annualRate) / 12 / 100
            const n = Number(tenureMonths)

            if (type === "EMI") {
                const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
                const totalPayment = emi * n
                const totalInterest = totalPayment - P
                return JSON.stringify({
                    type: "Loan EMI Calculation",
                    monthlyEMI: Math.round(emi),
                    totalPayment: Math.round(totalPayment),
                    totalInterest: Math.round(totalInterest),
                    principal: P,
                    tenureMonths: n
                })
            } else {
                // FD Returns: Quarterly compound formula
                const maturityAmount = P * Math.pow(1 + (annualRate / 100) / 4, 4 * (n / 12))
                return JSON.stringify({
                    type: "Fixed Deposit Returns",
                    maturityAmount: Math.round(maturityAmount),
                    interestEarned: Math.round(maturityAmount - P),
                    principal: P,
                    tenureMonths: n
                })
            }
        },
        {
            name: "calculate_loan_emi_or_fd",
            description: "Calculates precise monthly EMI, total interest for loans, or FD maturity returns for user.",
            schema: z.object({
                type: z.enum(["EMI", "FD"]).describe("Type of calculation: EMI or FD"),
                principal: z.number().describe("Principal amount in rupees"),
                annualRate: z.number().describe("Annual interest rate percentage, e.g. 9 for 9%"),
                tenureMonths: z.number().describe("Tenure duration in months")
            })
        }
    )

    return [checkBalanceTool, getTransactionsTool, analyzeSpendingTool, tavilySearchTool, financialCalculatorTool]
}

/**
 * 4. Build & Compile LangGraph StateGraph Workflow with Cached Graphs
 */
const getOrCreateBankingGraph = (userId) => {
    if (compiledGraphs.has(userId)) {
        return compiledGraphs.get(userId)
    }

    const model = getGeminiModel()
    const tools = createBankingTools(userId)

    // Bind tools (Banking ledger tools + Tavily Web Search) to model
    const modelWithTools = model.bindTools(tools)

    // System prompt guiding conversational memory & strict tool usage
    const systemInstruction = new SystemMessage(`You are VaultX Autonomous Banking AI Agent (LLM + Realtime Data + Memory + Action).

CONVERSATIONAL MEMORY FIRST DIRECTIVE:
1. Use conversation memory first.
2. Only use tools when the answer requires external real-time information or specific actions:
   - check_account_balance: Live personal balance from immutable ledger.
   - get_recent_transactions: Live transaction history from ledger.
   - analyze_spending_overview: Live inflow, outflow, and net savings.
   - tavily_search: Live real-time web search for current news, market rates, exchange rates, RBI guidelines.
   - calculate_loan_emi_or_fd: Exact calculation of monthly loan EMI or FD maturity interest.

3. Do NOT call tools for simple conversation, memory-based questions (e.g. user asking for their name, remembering what was discussed earlier, greetings, or personal context).
4. Reply politely and concisely in natural Hinglish or English.
`)

    // Agent Node: calls model with bound tools and conversation history
    const agentNode = async (state) => {
        // Strip out existing system messages so state doesn't accumulate duplicates
        const nonSystemMessages = (state.messages || []).filter(
            m => !(m instanceof SystemMessage) && m.role !== "system"
        )
        const messagesWithSystem = [systemInstruction, ...nonSystemMessages]

        const response = await modelWithTools.invoke(messagesWithSystem)
        return { messages: [response] }
    }

    // Tools Node: executes tool calls
    const toolNode = new ToolNode(tools)

    // Construct the LangGraph StateGraph
    const workflow = new StateGraph(MessagesAnnotation)
        .addNode("agent", agentNode)
        .addNode("tools", toolNode)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", toolsCondition) // If model called tool -> 'tools', else -> END
        .addEdge("tools", "agent")                   // Loop tool result back to agent

    // Compile graph with persistent MemorySaver checkpointer
    const compiled = workflow.compile({ checkpointer: memoryCheckpointer })
    compiledGraphs.set(userId, compiled)
    return compiled
}

/**
 * 5. Run LangGraph Banking Agent with Persistent Thread ID
 */
const runLangGraphBankingAgent = async (userId, userMessage, threadId = null) => {
    const graph = getOrCreateBankingGraph(userId)
    const activeThreadId = threadId || `user_thread_${userId}`

    const input = {
        messages: [new HumanMessage(userMessage)]
    }

    const config = {
        configurable: {
            thread_id: activeThreadId
        }
    }

    const finalState = await graph.invoke(input, config)
    const messages = finalState.messages
    const lastMessage = messages[messages.length - 1]

    // Determine if any tools were called in the graph execution
    const toolsExecuted = messages.some(
        m => m._getType?.() === "tool" || m.constructor?.name === "ToolMessage"
    )

    return {
        reply: lastMessage.content,
        toolsUsed: toolsExecuted,
        threadId: activeThreadId,
        totalMessagesInThread: messages.length
    }
}

module.exports = {
    runLangGraphBankingAgent,
    buildBankingStateGraph
}
