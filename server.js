require("dotenv").config()
const mongoose = require("mongoose")
const app = require("./src/app")
const connectToDB = require("./src/config/db")
const redis = require("./src/config/redis")

// [MICROSERVICES: BULLMQ WORKER] Start background queue worker
const emailWorker = require("./src/workers/email.worker")

connectToDB()

const serviceName = (process.env.SERVICE_NAME || "monolith").toUpperCase()
const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`VaultX [${serviceName}] Microservice is running on port ${PORT}`)
})

// [SYSTEM DESIGN: GRACEFUL SHUTDOWN] Clean resource shutdown
async function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Starting graceful shutdown for ${serviceName}...`)

    server.close(async () => {
        console.log("HTTP server closed. No new requests will be accepted.")
        try {
            await emailWorker.close()
            console.log("BullMQ worker closed.")
            await redis.quit()
            console.log("Redis connection closed.")
            await mongoose.connection.close(false)
            console.log("MongoDB connection closed.")
            console.log("Graceful shutdown completed.")
            process.exit(0)
        } catch (err) {
            console.error("Error during graceful shutdown:", err.message)
            process.exit(1)
        }
    })

    setTimeout(() => {
        console.error("Forcefully shutting down due to timeout.")
        process.exit(1)
    }, 10000).unref()
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// [PRODUCTION SAFETY: UNCAUGHT ERROR GUARDS]
process.on("unhandledRejection", (reason, promise) => {
    console.error("[PRODUCTION WARNING] Unhandled Rejection at:", promise, "reason:", reason)
})

process.on("uncaughtException", (error) => {
    console.error("[PRODUCTION ERROR] Uncaught Exception thrown:", error)
})
