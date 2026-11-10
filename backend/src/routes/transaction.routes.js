const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - GET /api/transactions/
 * - Get authenticated user's transaction history
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, transactionController.getTransactionHistoryController);

/**
 * - GET /api/transactions/ledger
 * - Get immutable double-entry ledger records for the authenticated user
 */
transactionRoutes.get("/ledger", authMiddleware.authMiddleware, transactionController.getLedgerEntriesController);

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction);

module.exports = transactionRoutes;
