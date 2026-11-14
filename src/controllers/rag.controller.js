// [AI INTEGRATION: RAG CONTROLLER]
const ragService = require("../services/rag.service")

/**
 * 1. POST /api/ai/rag/query or POST /ai
 * Query knowledge.pdf using Retrieval-Augmented Generation (RAG) on Qdrant
 */
const queryBankPolicyRAGController = async (req, res) => {
    try {
        const rawQuery = req.body.query || req.body.input || req.body.question || req.body.prompt
        const { topK } = req.body

        if (!rawQuery || typeof rawQuery !== "string" || rawQuery.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Valid 'input' or 'query' string is required in request body"
            })
        }

        const k = Math.min(Math.max(parseInt(topK) || 3, 1), 5)
        const result = await ragService.answerQueryWithRAG(rawQuery.trim(), k)

        return res.status(200).json({
            ai: result.ai || result.answer,
            answer: result.answer,
            success: true,
            query: result.query,
            framework: result.framework,
            sourceDocument: result.sourceDocument,
            retrievedChunks: result.retrievedChunks
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to execute RAG query on bank policy document"
        })
    }
}

/**
 * 2. GET /api/ai/rag/status
 * Get Vector Store indexing status & chunk metrics
 */
const getRAGStatusController = async (req, res) => {
    try {
        const status = ragService.getRAGStatus()
        return res.status(200).json({
            success: true,
            status
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve RAG status"
        })
    }
}

/**
 * 3. POST /api/ai/rag/reindex
 * Force re-indexing of the policy PDF into vector database
 */
const reindexPDFController = async (req, res) => {
    try {
        const result = await ragService.indexPDFDocument()
        return res.status(200).json({
            success: true,
            message: "Policy PDF re-indexed successfully into vector database",
            details: result
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reindex PDF document"
        })
    }
}

module.exports = {
    queryBankPolicyRAGController,
    getRAGStatusController,
    reindexPDFController
}
