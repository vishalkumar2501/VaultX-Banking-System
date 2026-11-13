// [SYSTEM DESIGN: HEALTH CHECK] Deep health check endpoint for monitoring & Nginx upstream health
const express = require("express")
const mongoose = require("mongoose")
const os = require("os")
const redis = require("../config/redis")

const router = express.Router()

router.get("/", async (req, res) => {
    let mongoStatus = "DOWN"
    let redisStatus = "DOWN"

    try {
        if (mongoose.connection.readyState === 1) {
            mongoStatus = "UP"
        }
    } catch (e) {
        mongoStatus = "DOWN"
    }

    try {
        const ping = await redis.ping()
        if (ping === "PONG") {
            redisStatus = "UP"
        }
    } catch (e) {
        redisStatus = "DOWN"
    }

    const isHealthy = mongoStatus === "UP" && redisStatus === "UP"

    const response = {
        status: isHealthy ? "HEALTHY" : "DEGRADED",
        instance: os.hostname(),
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        services: {
            mongodb: mongoStatus,
            redis: redisStatus
        },
        memory: {
            rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
    }

    return res.status(isHealthy ? 200 : 503).json(response)
})

module.exports = router
