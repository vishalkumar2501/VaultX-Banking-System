// [AI INTEGRATION: AI ROUTES]
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
 * POST /api/ai/chat or /api/ai/agent
 * Autonomous LangChain Banking Agent with Dynamic Tool Calling
 */
router.post("/chat", authMiddleware.authMiddleware, aiLimiter, aiController.chatWithAiController)
router.post("/agent", authMiddleware.authMiddleware, aiLimiter, aiController.chatWithAiController)

module.exports = router
