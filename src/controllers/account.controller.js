const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const redis = require("../config/redis")

async function createAccountController(req, res) {
    try {
        const user = req.user

        const account = await accountModel.create({
            user: user._id
        })

        return res.status(201).json({
            account
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to create account"
        })
    }
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id })

        return res.status(200).json({
            accounts
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch accounts"
        })
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params

        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                message: "Invalid account ID"
            })
        }

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        })

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            })
        }

        // [REDIS CACHE] Pehle RAM cache check karo taaki har GET par MongoDB ledger aggregation na chale
        const cacheKey = `balance:${account._id}`
        try {
            const cachedBalance = await redis.get(cacheKey)
            if (cachedBalance !== null) {
                return res.status(200).json({
                    accountId: account._id,
                    balance: Number(cachedBalance)
                })
            }
        } catch (err) {
            console.error("Redis cache read error:", err.message)
        }

        const balance = await account.getBalance()

        // [REDIS CACHE] 60s ke liye cache save karo (transfer hone par delete ho jayega)
        try {
            await redis.set(cacheKey, String(balance), "EX", 60)
        } catch (err) {
            console.error("Redis cache write error:", err.message)
        }

        return res.status(200).json({
            accountId: account._id,
            balance
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch account balance"
        })
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}
