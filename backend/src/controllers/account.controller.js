const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const userModel = require("../models/user.model")

async function createAccountController(req, res) {
    try {
        const user = req.user

        const account = await accountModel.create({
            user: user._id
        })

        return res.status(201).json({
            account: {
                ...account.toObject(),
                balance: 0
            }
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to create account"
        })
    }
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id }).sort({ createdAt: -1 })

        const accountsWithBalance = await Promise.all(
            accounts.map(async (account) => {
                const balance = await account.getBalance()
                return {
                    ...account.toObject(),
                    balance
                }
            })
        )

        return res.status(200).json({
            accounts: accountsWithBalance
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

        const balance = await account.getBalance()

        return res.status(200).json({
            accountId: account._id,
            currency: account.currency,
            status: account.status,
            balance
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch account balance"
        })
    }
}

/**
 * Lookup destination accounts safely by Account ID or recipient email (never exposes balance).
 * GET /api/accounts/lookup?query=...
 */
async function lookupAccountController(req, res) {
    try {
        const rawQuery = (req.query.query || "").trim()
        if (!rawQuery) {
            return res.status(400).json({ message: "Search query (account ID or email) is required" })
        }

        let accounts = []
        if (mongoose.Types.ObjectId.isValid(rawQuery)) {
            const acc = await accountModel
                .findOne({ _id: rawQuery, status: "ACTIVE" })
                .populate("user", "name email")
            if (acc) accounts = [ acc ]
        } else {
            const targetUser = await userModel.findOne({ email: rawQuery.toLowerCase() }).select("name email")
            if (targetUser) {
                accounts = await accountModel
                    .find({ user: targetUser._id, status: "ACTIVE" })
                    .populate("user", "name email")
            }
        }

        return res.status(200).json({
            accounts: accounts.map((acc) => ({
                _id: acc._id,
                currency: acc.currency,
                status: acc.status,
                owner: acc.user ? { name: acc.user.name, email: acc.user.email } : null
            }))
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to lookup recipient account"
        })
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    lookupAccountController
}
