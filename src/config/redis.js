// [REDIS] Connects via Docker service DNS ("redis://redis:6379") or localhost for dev
const Redis = require("ioredis")

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        return Math.min(times * 1000, 5000)
    }
})

redis.on("connect", () => console.log("Redis connected"))
redis.on("error", (err) => {
    const reason = err.message || err.code || err.errors?.[ 0 ]?.code || "Connection failed"
    console.error("Redis error:", reason)
})

module.exports = redis
