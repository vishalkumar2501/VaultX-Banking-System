const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")
const redis = require("../config/redis")
const { addEmailJob } = require("../queues/email.queue")

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

// [REDIS CACHE INVALIDATION] Transfer commit hone ke baad purana cached balance delete karo
async function invalidateBalanceCaches(accountIds) {
    try {
        const keys = accountIds.map((id) => `balance:${id}`)
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } catch (err) {
        console.error("Redis cache invalidation error:", err.message)
    }
}

// [REDIS LOCK] Same idempotencyKey se same millisecond me double-transfer rokne ke liye ("NX" = set only if absent)
async function runWithIdempotencyLock(res, idempotencyKey, work) {
    const lockKey = `idemp_lock:${idempotencyKey}`
    const acquired = await redis.set(lockKey, "1", "EX", 30, "NX")
    if (!acquired) {
        res.status(409).json({
            message: "Transaction already in progress for this idempotencyKey"
        })
        return
    }

    try {
        if (await handleExistingIdempotencyKey(res, idempotencyKey)) {
            return
        }
        await work()
    } finally {
        await redis.del(lockKey)
    }
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

        // [REDIS LOCK + IDEMPOTENCY] Duplicate concurrent requests block karke atomic transfer chalao
        await runWithIdempotencyLock(res, idempotencyKey, async () => {
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

            await invalidateBalanceCaches([ fromUserAccount._id, toAccount ])

            res.status(201).json({
                message: "Transaction completed successfully",
                transaction: result.transaction
            })

            // [SYSTEM DESIGN: BULLMQ QUEUE] Transaction receipt email background worker queue me daalo
            addEmailJob("TRANSACTION_EMAIL", {
                email: req.user.email,
                name: req.user.name,
                amount: numericAmount,
                toAccount
            })
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

        // [REDIS LOCK + IDEMPOTENCY] Concurrent initial-funds duplicate requests prevent karne ke liye
        await runWithIdempotencyLock(res, idempotencyKey, async () => {
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

            await invalidateBalanceCaches([ fromUserAccount._id, toAccount ])

            return res.status(201).json({
                message: "Initial funds transaction completed successfully",
                transaction: result.transaction
            })
        })
    } catch (error) {
        return res.status(500).json({
            message: "Initial funds transaction failed due to an unexpected error"
        })
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
