// [AI INTEGRATION: LANGCHAIN + GEMINI AI CONTROLLER]
const langchainService = require("../services/langchain.agent.service")
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
        const cachedInsights = await redisClient.get(cacheKey)
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

        // Cache in Redis for 10 minutes (600 seconds)
        await redisClient.set(cacheKey, JSON.stringify(insights), "EX", 600)

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
 * 2. POST /api/ai/agent (or /api/ai/chat)
 * Autonomous LangChain Banking Agent with Dynamic Tool Calling
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

        // Run Autonomous LangChain Banking Agent with Tool Calling
        const result = await langchainService.runBankingAgent(userId, message.trim())

        return res.status(200).json({
            success: true,
            framework: "langchain",
            toolsUsed: result.toolsUsed,
            reply: result.agentReply
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
    chatWithAiController
}
