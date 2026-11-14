// [SYSTEM DESIGN: BULLMQ QUEUE] Asynchronous email queue powered by Redis
const { Queue } = require("bullmq")
const IORedis = require("ioredis")

const queueConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
})

queueConnection.on("error", (err) => {
    // Suppress unhandled EventEmitter crash when Redis is offline
})

const emailQueue = new Queue("emailQueue", { connection: queueConnection })
emailQueue.on("error", (err) => {
    // Suppress unhandled EventEmitter crash when Redis is offline
})

async function addEmailJob(name, data) {
    try {
        return await emailQueue.add(name, data, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000
            },
            removeOnComplete: true,
            removeOnFail: 1000
        })
    } catch (err) {
        console.error("Failed to add job to emailQueue:", err.message)
    }
}

module.exports = {
    emailQueue,
    addEmailJob,
    queueConnection
}
