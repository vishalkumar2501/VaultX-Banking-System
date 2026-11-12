const redis = require("../config/redis")

/**
 * [REDIS RATE LIMIT] Sliding-counter middleware per user/IP to stop brute-force and API spam.
 */
function createRateLimiter({ prefix, windowSeconds, maxRequests }) {
    return async function rateLimitMiddleware(req, res, next) {
        try {
            const identifier = req.user?._id?.toString() || req.ip
            const key = `rl:${prefix}:${identifier}`

            const currentCount = await redis.incr(key)
            if (currentCount === 1) {
                await redis.expire(key, windowSeconds)
            }

            if (currentCount > maxRequests) {
                return res.status(429).json({
                    message: `Too many requests. Limit is ${maxRequests} requests per ${windowSeconds}s`
                })
            }

            return next()
        } catch (error) {
            // Fail-open: skip rate limit if Redis is temporarily unreachable
            console.error("Rate limiter error:", error.message)
            return next()
        }
    }
}

module.exports = { createRateLimiter }
