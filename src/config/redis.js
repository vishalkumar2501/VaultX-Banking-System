// [REDIS] Connects via Docker service DNS ("redis://redis:6379") or localhost for dev
const Redis = require("ioredis")

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
        if (times > 3) {
            return null // Do not keep spamming reconnect attempts if Redis container is not running
        }
        return Math.min(times * 1000, 3000)
    }
})

redis.on("connect", () => console.log("Redis connected"))
redis.on("error", (err) => {
    // Graceful log without crashing node process
    const reason = err.message || err.code || err.errors?.[ 0 ]?.code || "Connection failed"
    // console.warn("Redis status:", reason)
})

module.exports = redis
