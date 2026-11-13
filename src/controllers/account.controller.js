const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const redis = require("../config/redis")

// [REDIS CACHE] Shared helpers: cache read/write/delete fail hone par bhi API crash nahi hogi
async function getCachedValue(key) {
    try {
        return await redis.get(key)
    } catch (err) {
        console.error("Redis cache read error:", err.message)
        return null
    }
}

async function setCachedValue(key, value, ttlSeconds = 60) {
    try {
        await redis.set(key, value, "EX", ttlSeconds)
    } catch (err) {
        console.error("Redis cache write error:", err.message)
    }
}

async function deleteCachedKey(key) {
    try {
        await redis.del(key)
    } catch (err) {
        console.error("Redis cache delete error:", err.message)
    }
}

async function createAccountController(req, res) {
    try {
        const user = req.user

        const account = await accountModel.create({
            user: user._id
        })

        // [REDIS CACHE INVALIDATION] Naya account bante hi user ki purani accounts list cache delete karo
        await deleteCachedKey(`accounts:${user._id}`)

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
        // [REDIS CACHE] Pehle RAM me user ke accounts check karo (HIT -> <5ms, MISS -> MongoDB + cache)
        const cacheKey = `accounts:${req.user._id}`
        const redis_hit = await getCachedValue(cacheKey)

        if (redis_hit) {
            res.set("X-Cache", "HIT")
            return res.status(200).json({
                source: "redis_hit",
                accounts: JSON.parse(redis_hit)
            })
        }

        const accounts = await accountModel.find({ user: req.user._id })
        await setCachedValue(cacheKey, JSON.stringify(accounts), 60)

        res.set("X-Cache", "MISS")
        return res.status(200).json({
            source: "mongodb_miss",
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

        // [REDIS CACHE] HIT -> seedha cached balance (<5ms), MISS -> MongoDB ledger aggregation + 60s save
        const cacheKey = `balance:${account._id}`
        const redis_hit = await getCachedValue(cacheKey)

        if (redis_hit !== null) {
            res.set("X-Cache", "HIT")
            return res.status(200).json({
                source: "redis_hit",
                accountId: account._id,
                balance: Number(redis_hit)
            })
        }

        const balance = await account.getBalance()
        await setCachedValue(cacheKey, String(balance), 60)

        res.set("X-Cache", "MISS")
        return res.status(200).json({
            source: "mongodb_miss",
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
