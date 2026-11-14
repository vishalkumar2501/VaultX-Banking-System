// [AI INTEGRATION: LANGGRAPH + LANGCHAIN AI CONTROLLER]
const langchainService = require("../services/langchain.agent.service")
const langgraphService = require("../services/langgraph.agent.service")
const redisClient = require("../config/redis")
const accountModel = require("../models/account.model")

/**
 * 1. GET /api/ai/insights
 * AI Financial Spending Insights with LangChain & Redis 10-Minute Cache
 */
const getSpendingInsightsController = async (req, res) => {
    try {
        const userId = req.user._id.toString()
        const cacheKey = `ai:insights:${userId}`

        // [REDIS CACHE LAYER] Check if fresh insights already exist in Redis cache
        let cachedInsights = null
        try {
            cachedInsights = await redisClient.get(cacheKey)
        } catch (_) {}

        if (cachedInsights) {
            return res.status(200).json({
                success: true,
                framework: "langchain",
                source: "redis_cache",
                data: JSON.parse(cachedInsights)
            })
        }

        // Verify user has accounts
        const userAccounts = await accountModel.countDocuments({ user: userId })
        if (userAccounts === 0) {
            return res.status(400).json({
                success: false,
                message: "No bank accounts found for this user. Create an account first."
            })
        }

        // Generate insights using LangChain + Gemini
        const insights = await langchainService.generateStructuredInsightsWithLangChain(userId)

        // Cache in Redis for 10 minutes (600 seconds) if Redis is connected
        try {
            await redisClient.set(cacheKey, JSON.stringify(insights), "EX", 600)
        } catch (_) {}

        return res.status(200).json({
            success: true,
            framework: "langchain",
            source: "gemini_ai",
            data: insights
        })
    } catch (error) {
        if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED")) {
            return res.status(403).json({
                success: false,
                error: "GEMINI_API_KEY_ERROR",
                message: "Gemini API free tier requires an API key created with 'Create API key in new project' in Google AI Studio."
            })
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate AI financial insights"
        })
    }
}

/**
 * 2. POST /api/ai/graph (or /api/ai/agent)
 * Autonomous LangGraph Banking Agent with StateGraph Routing, Tools & Multi-Turn Memory
 */
const runLangGraphController = async (req, res) => {
    try {
        const userId = req.user._id.toString()
        const { message, threadId } = req.body

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Valid message string is required in request body"
            })
        }

        // Execute LangGraph StateGraph Agent
        const result = await langgraphService.runLangGraphBankingAgent(
            userId,
            message.trim(),
            threadId
        )

        return res.status(200).json({
            success: true,
            framework: "langgraph",
            threadId: result.threadId,
            totalMessagesInThread: result.totalMessagesInThread,
            toolsUsed: result.toolsUsed,
            reply: result.reply
        })
    } catch (error) {
        if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED")) {
            return res.status(403).json({
                success: false,
                error: "GEMINI_API_KEY_ERROR",
                message: "Gemini API free tier requires an API key created with 'Create API key in new project' in Google AI Studio."
            })
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to execute LangGraph agent"
        })
    }
}

/**
 * 3. POST /api/ai/chat (LangChain Direct Agent Fallback / Alias)
 */
const chatWithAiController = async (req, res) => {
    try {
        const userId = req.user._id.toString()
        const { message } = req.body

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Valid message string is required in request body"
            })
        }

        // Run Autonomous LangChain Agent with LangGraph fallback
        let reply = ""
        let toolsUsed = false

        try {
            const result = await langchainService.runBankingAgent(userId, message.trim())
            reply = result.agentReply
            toolsUsed = result.toolsUsed
        } catch (_) {
            const graphResult = await langgraphService.runLangGraphBankingAgent(userId, message.trim())
            reply = graphResult.reply
            toolsUsed = graphResult.toolsUsed
        }

        return res.status(200).json({
            success: true,
            framework: "autonomous_agent",
            toolsUsed,
            reply
        })
    } catch (error) {
        if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED")) {
            return res.status(403).json({
                success: false,
                error: "GEMINI_API_KEY_ERROR",
                message: "Gemini API free tier requires an API key created with 'Create API key in new project' in Google AI Studio."
            })
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process agent query"
        })
    }
}

module.exports = {
    getSpendingInsightsController,
    runLangGraphController,
    chatWithAiController
}
