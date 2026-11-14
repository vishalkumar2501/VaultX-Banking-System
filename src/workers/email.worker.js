// [SYSTEM DESIGN: BULLMQ WORKER] Background consumer for processing email jobs with auto-retry
const { Worker } = require("bullmq")
const emailService = require("../services/email.service")
const { queueConnection } = require("../queues/email.queue")

const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
        const { name, data } = job
        switch (name) {
            case "REGISTRATION_EMAIL":
                await emailService.sendRegistrationEmail(data.email, data.name)
                break
            case "TRANSACTION_EMAIL":
                await emailService.sendTransactionEmail(data.email, data.name, data.amount, data.toAccount, data.options)
                break
            case "OTP_EMAIL":
                await emailService.sendOtpEmail(data.email, data.otp)
                break
            default:
                console.warn(`Unknown email job type: ${name}`)
        }
    },
    { connection: queueConnection }
)

emailWorker.on("completed", (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} (${job.name}) completed successfully`)
})

emailWorker.on("failed", (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} (${job?.name}) failed:`, err.message)
})

emailWorker.on("error", (err) => {
    // Suppress unhandled crash when Redis container is not running during local testing
})

module.exports = emailWorker
