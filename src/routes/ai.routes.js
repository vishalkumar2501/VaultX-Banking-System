// [AI INTEGRATION: LANGGRAPH & LANGCHAIN AI ROUTES]
const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const aiController = require("../controllers/ai.controller")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")

const router = express.Router()

// [REDIS RATE LIMIT] AI Rate limiter: 10 calls per 60 seconds per user
const aiLimiter = createRateLimiter({ prefix: "ai", windowSeconds: 60, maxRequests: 10 })

/**
 * GET /api/ai/insights
 * AI Financial Spending Insights & Advice (with Redis Caching)
 */
router.get("/insights", authMiddleware.authMiddleware, aiLimiter, aiController.getSpendingInsightsController)

/**
 * POST /api/ai/graph
 * POST /api/ai/agent
 * Autonomous LangGraph StateGraph Banking Agent with Multi-Turn Memory & Tool Nodes
 */
router.post("/graph", authMiddleware.authMiddleware, aiLimiter, aiController.runLangGraphController)
router.post("/agent", authMiddleware.authMiddleware, aiLimiter, aiController.runLangGraphController)

/**
 * POST /api/ai/chat
 * LangChain Direct Agent
 */
router.post("/chat", authMiddleware.authMiddleware, aiLimiter, aiController.chatWithAiController)

module.exports = router
