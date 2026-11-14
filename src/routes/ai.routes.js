// [AI INTEGRATION: LANGGRAPH & LANGCHAIN AI ROUTES]
const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const aiController = require("../controllers/ai.controller")
const ragController = require("../controllers/rag.controller")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")

const router = express.Router()

// [REDIS RATE LIMIT] AI Rate limiter: 10 calls per 60 seconds per user
const aiLimiter = createRateLimiter({ prefix: "ai", windowSeconds: 60, maxRequests: 10 })

/**
 * [RAG ENDPOINTS: RETRIEVAL-AUGMENTED GENERATION ON KNOWLEDGE DOCUMENT]
 * Public access: Can be queried freely without requiring auth token
 * POST /api/ai/rag/query   - Query Document via Qdrant Vector Search
 * GET  /api/ai/rag/status  - Vector store indexing status
 * POST /api/ai/rag/reindex - Re-index PDF into Vector Store
 * POST /api/ai/rag/upload  - Upload / Trigger PDF vector ingestion
 * POST /api/ai             - Direct query endpoint (matching tutorial)
 */
router.post("/rag/query", ragController.queryBankPolicyRAGController)
router.get("/rag/status", ragController.getRAGStatusController)
router.post("/rag/reindex", ragController.reindexPDFController)
router.post("/rag/upload", ragController.reindexPDFController)
router.post("/", ragController.queryBankPolicyRAGController)

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
