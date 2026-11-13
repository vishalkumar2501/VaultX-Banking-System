// [SYSTEM DESIGN: WEBHOOK] Fintech payment webhook handler with HMAC SHA256 signature verification and Redis idempotency
const crypto = require("crypto")
const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const redis = require("../config/redis")

async function paymentWebhookController(req, res) {
    try {
        const signature = req.headers[ "x-webhook-signature" ]
        const secret = process.env.WEBHOOK_SECRET || "vaultx_webhook_secret_key_2026"

        // 1. HMAC SHA256 Signature Verification
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(JSON.stringify(req.body))
            .digest("hex")

        if (!signature || signature !== expectedSignature) {
            return res.status(401).json({
                message: "Invalid webhook signature"
            })
        }

        const { event, paymentId, accountId, amount } = req.body

        if (event !== "payment.captured" || !paymentId || !accountId || !amount) {
            return res.status(400).json({
                message: "Invalid webhook payload structure"
            })
        }

        const numericAmount = Number(amount)
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            })
        }

        // 2. Redis Idempotency Gate (Prevents duplicate processing if webhook is retried)
        const idempotencyKey = `wh:${paymentId}`
        const acquired = await redis.set(idempotencyKey, "PROCESSED", "EX", 86400, "NX")
        if (!acquired) {
            return res.status(200).json({
                message: "Webhook already processed (Idempotent)"
            })
        }

        // 3. Verify Account
        const account = await accountModel.findById(accountId)
        if (!account) {
            await redis.del(idempotencyKey)
            return res.status(404).json({ message: "Account not found" })
        }

        if (account.status !== "ACTIVE") {
            await redis.del(idempotencyKey)
            return res.status(400).json({ message: "Account is not ACTIVE" })
        }

        // 4. Atomic Double-Entry Ledger Credit inside MongoDB ACID Transaction
        const session = await mongoose.startSession()
        try {
            session.startTransaction()

            const [ createdTx ] = await transactionModel.create([ {
                fromAccount: null,
                toAccount: account._id,
                amount: numericAmount,
                idempotencyKey: `webhook_${paymentId}`,
                status: "COMPLETED"
            } ], { session })

            await ledgerModel.create([ {
                account: account._id,
                amount: numericAmount,
                transaction: createdTx._id,
                type: "CREDIT"
            } ], { session })

            await session.commitTransaction()
        } catch (txError) {
            if (session.inTransaction()) await session.abortTransaction()
            await redis.del(idempotencyKey)
            throw txError
        } finally {
            await session.endSession()
        }

        // 5. Invalidate Balance Cache in Redis
        await redis.del(`balance:${account._id}`)

        return res.status(200).json({
            status: "success",
            message: "Payment webhook processed and funds credited",
            paymentId,
            creditedAmount: numericAmount
        })
    } catch (error) {
        console.error("Webhook processing error:", error.message)
        return res.status(500).json({
            message: "Internal server error while processing webhook"
        })
    }
}

module.exports = {
    paymentWebhookController
}
