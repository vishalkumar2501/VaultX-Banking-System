const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * Check if a transaction with the given idempotency key already exists and respond immediately.
 * Returns true if a response was sent, false otherwise.
 */
async function handleExistingIdempotencyKey(res, idempotencyKey) {
    const existing = await transactionModel.findOne({ idempotencyKey })
    if (!existing) return false

    const statusResponses = {
        COMPLETED: { status: 200, body: { message: "Transaction already processed", transaction: existing } },
        PENDING: { status: 200, body: { message: "Transaction is still processing", transaction: existing } },
        FAILED: { status: 409, body: { message: "Transaction processing failed, please retry with a new key" } },
        REVERSED: { status: 409, body: { message: "Transaction was reversed, please retry with a new key" } }
    }

    const match = statusResponses[ existing.status ] || {
        status: 409,
        body: { message: "Duplicate idempotency key" }
    }

    res.status(match.status).json(match.body)
    return true
}

/**
 * Shared atomic double-entry transfer inside a MongoDB ACID session.
 * Verifies balance inside the session when enforceBalance is true.
 */
async function executeAtomicTransfer({ fromUserAccount, toAccountId, amount, idempotencyKey, enforceBalance = true }) {
    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        if (enforceBalance) {
            const balance = await fromUserAccount.getBalance(session)
            if (balance < amount) {
                await session.abortTransaction()
                return {
                    error: {
                        status: 400,
                        message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
                    }
                }
            }
        }

        const [ createdTx ] = await transactionModel.create([ {
            fromAccount: fromUserAccount._id,
            toAccount: toAccountId,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session })

        await ledgerModel.create([ {
            account: fromUserAccount._id,
            amount,
            transaction: createdTx._id,
            type: "DEBIT"
        } ], { session })

        await ledgerModel.create([ {
            account: toAccountId,
            amount,
            transaction: createdTx._id,
            type: "CREDIT"
        } ], { session })

        const completedTx = await transactionModel.findOneAndUpdate(
            { _id: createdTx._id },
            { status: "COMPLETED" },
            { session, new: true }
        )

        await session.commitTransaction()
        return { transaction: completedTx }
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction()
        }
        if (error.code === 11000) {
            return {
                error: {
                    status: 409,
                    message: "Duplicate idempotency key: transaction already initiated"
                }
            }
        }
        throw error
    } finally {
        await session.endSession()
    }
}

/**
 * - Create a new transaction
 * - POST /api/transactions
 */
async function createTransaction(req, res) {
    try {
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body

        if (!fromAccount || !toAccount || amount === undefined || amount === null || !idempotencyKey) {
            return res.status(400).json({
                message: "fromAccount, toAccount, amount and idempotencyKey are required"
            })
        }

        if (!mongoose.Types.ObjectId.isValid(fromAccount) || !mongoose.Types.ObjectId.isValid(toAccount)) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount ID"
            })
        }

        if (fromAccount === toAccount) {
            return res.status(400).json({
                message: "Cannot transfer funds to the same account"
            })
        }

        const numericAmount = Number(amount)
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Transaction amount must be a positive number"
            })
        }

        // Check idempotency before starting transaction
        if (await handleExistingIdempotencyKey(res, idempotencyKey)) {
            return
        }

        const [ fromUserAccount, toUserAccount ] = await Promise.all([
            accountModel.findById(fromAccount),
            accountModel.findById(toAccount)
        ])

        if (!fromUserAccount || !toUserAccount) {
            return res.status(404).json({
                message: "Invalid fromAccount or toAccount"
            })
        }

        // Enforce strict ownership: prevent transferring from another user's account
        if (fromUserAccount.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Forbidden: You are not authorized to transfer from this account"
            })
        }

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            })
        }

        const result = await executeAtomicTransfer({
            fromUserAccount,
            toAccountId: toAccount,
            amount: numericAmount,
            idempotencyKey,
            enforceBalance: true
        })

        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message })
        }

        res.status(201).json({
            message: "Transaction completed successfully",
            transaction: result.transaction
        })

        // Dispatch notification asynchronously after confirming atomic commit
        emailService.sendTransactionEmail(req.user.email, req.user.name, numericAmount, toAccount).catch((err) => {
            console.error("Failed to send transaction email:", err.message)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Transaction failed due to an unexpected error"
        })
    }
}

/**
 * - Create initial funds transaction from system user
 * - POST /api/transactions/system/initial-funds
 */
async function createInitialFundsTransaction(req, res) {
    try {
        const { toAccount, amount, idempotencyKey } = req.body

        if (!toAccount || amount === undefined || amount === null || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount and idempotencyKey are required"
            })
        }

        if (!mongoose.Types.ObjectId.isValid(toAccount)) {
            return res.status(400).json({
                message: "Invalid toAccount ID"
            })
        }

        const numericAmount = Number(amount)
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Transaction amount must be a positive number"
            })
        }

        if (await handleExistingIdempotencyKey(res, idempotencyKey)) {
            return
        }

        const [ toUserAccount, fromUserAccount ] = await Promise.all([
            accountModel.findById(toAccount),
            accountModel.findOne({ user: req.user._id })
        ])

        if (!toUserAccount) {
            return res.status(404).json({
                message: "Invalid toAccount"
            })
        }

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "System user account not found"
            })
        }

        if (toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Target account must be ACTIVE to receive funds"
            })
        }

        const result = await executeAtomicTransfer({
            fromUserAccount,
            toAccountId: toAccount,
            amount: numericAmount,
            idempotencyKey,
            enforceBalance: false
        })

        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message })
        }

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: result.transaction
        })
    } catch (error) {
        return res.status(500).json({
            message: "Initial funds transaction failed due to an unexpected error"
        })
    }
}

/**
 * - Get authenticated user's transaction history
 * - GET /api/transactions?accountId=...&page=1&limit=20
 */
async function getTransactionHistoryController(req, res) {
    try {
        const { accountId } = req.query
        const page = Math.max(1, parseInt(req.query.page, 10) || 1)
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
        const skip = (page - 1) * limit

        const userAccounts = await accountModel.find({ user: req.user._id }).select("_id")
        const userAccountIds = userAccounts.map((acc) => acc._id)

        if (userAccountIds.length === 0) {
            return res.status(200).json({
                transactions: [],
                pagination: { page, limit, total: 0 }
            })
        }

        let filter
        if (accountId) {
            if (!mongoose.Types.ObjectId.isValid(accountId)) {
                return res.status(400).json({ message: "Invalid accountId filter" })
            }
            const ownsAccount = userAccountIds.some((id) => id.toString() === accountId)
            if (!ownsAccount) {
                return res.status(403).json({ message: "Forbidden: You do not own this account" })
            }
            filter = { $or: [ { fromAccount: accountId }, { toAccount: accountId } ] }
        } else {
            filter = { $or: [ { fromAccount: { $in: userAccountIds } }, { toAccount: { $in: userAccountIds } } ] }
        }

        const [ transactions, total ] = await Promise.all([
            transactionModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "fromAccount",
                    select: "user currency status",
                    populate: { path: "user", select: "name email" }
                })
                .populate({
                    path: "toAccount",
                    select: "user currency status",
                    populate: { path: "user", select: "name email" }
                }),
            transactionModel.countDocuments(filter)
        ])

        return res.status(200).json({
            transactions,
            pagination: {
                page,
                limit,
                total
            }
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch transaction history"
        })
    }
}

/**
 * - Get immutable double-entry ledger records for the authenticated user's accounts
 * - GET /api/transactions/ledger?accountId=...&limit=50
 */
async function getLedgerEntriesController(req, res) {
    try {
        const { accountId } = req.query
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50))

        const userAccounts = await accountModel.find({ user: req.user._id }).select("_id")
        const userAccountIds = userAccounts.map((acc) => acc._id)

        if (userAccountIds.length === 0) {
            return res.status(200).json({ entries: [] })
        }

        let accountFilter = { $in: userAccountIds }
        if (accountId) {
            if (!mongoose.Types.ObjectId.isValid(accountId)) {
                return res.status(400).json({ message: "Invalid accountId filter" })
            }
            const ownsAccount = userAccountIds.some((id) => id.toString() === accountId)
            if (!ownsAccount) {
                return res.status(403).json({ message: "Forbidden: You do not own this account" })
            }
            accountFilter = accountId
        }

        const entries = await ledgerModel
            .find({ account: accountFilter })
            .sort({ _id: -1 })
            .limit(limit)
            .populate("account", "currency status")
            .populate("transaction", "fromAccount toAccount status idempotencyKey createdAt")

        return res.status(200).json({ entries })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch audit ledger entries"
        })
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistoryController,
    getLedgerEntriesController
}
