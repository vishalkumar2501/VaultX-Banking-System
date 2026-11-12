const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const redis = require("../config/redis")

/**
 * Shared authentication helper that extracts the JWT from cookies or Authorization header,
 * ensures it has not been blacklisted, verifies the signature, and loads the user record.
 */
async function authenticateRequest(req, res, { requireSystemUser = false } = {}) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
        return null
    }

    // [REDIS BLACKLIST] Logout ho chuka token RAM se <1ms me reject karne ke liye
    const isBlacklisted = await redis.get(`bl:${token}`)

    if (isBlacklisted) {
        res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
        return null
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const query = userModel.findById(decoded.userId)
        if (requireSystemUser) {
            query.select("+systemUser")
        }

        const user = await query

        if (!user) {
            res.status(401).json({
                message: "Unauthorized access, user not found"
            })
            return null
        }

        if (requireSystemUser && !user.systemUser) {
            res.status(403).json({
                message: "Forbidden access, not a system user"
            })
            return null
        }

        return user
    } catch (err) {
        res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
        return null
    }
}

async function authMiddleware(req, res, next) {
    const user = await authenticateRequest(req, res)
    if (!user) return
    req.user = user
    return next()
}

async function authSystemUserMiddleware(req, res, next) {
    const user = await authenticateRequest(req, res, { requireSystemUser: true })
    if (!user) return
    req.user = user
    return next()
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}
