const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")

const transactionRoutes = Router();

// [REDIS RATE LIMIT] Transfer spam rokne ke liye: 10 transactions / 60s per user
const txLimiter = createRateLimiter({ prefix: "tx", windowSeconds: 60, maxRequests: 10 })

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, txLimiter, transactionController.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction);

module.exports = transactionRoutes;
