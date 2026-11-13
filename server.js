require("dotenv").config()
const mongoose = require("mongoose")
const app = require("./src/app")
const connectToDB = require("./src/config/db")
const redis = require("./src/config/redis")

// [SYSTEM DESIGN: BULLMQ WORKER] Background email queue worker start karta hai
const emailWorker = require("./src/workers/email.worker")

connectToDB()

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// [SYSTEM DESIGN: GRACEFUL SHUTDOWN] Container stop/restart hone par clean resource cleanup
async function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`)

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

    // Force exit if cleanup takes longer than 10 seconds
    setTimeout(() => {
        console.error("Forcefully shutting down due to timeout.")
        process.exit(1)
    }, 10000).unref()
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
