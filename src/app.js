const express = require("express")
const cookieParser = require("cookie-parser")
const os = require("os")

const app = express()

app.use(express.json())
app.use(cookieParser())

// [MICROSERVICES: SERVICE DISPATCHER] Identify running microservice instance
const serviceName = (process.env.SERVICE_NAME || "all").toLowerCase()

app.use((req, res, next) => {
    res.set("X-Service-Name", serviceName)
    res.set("X-Handled-By", os.hostname())
    next()
})

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const healthRouter = require("./routes/health.routes")
const webhookRouter = require("./routes/webhook.routes")
const aiRouter = require("./routes/ai.routes")

/**
 * - Health & Root check
 */
app.get("/", (req, res) => {
    res.status(200).json({
        message: `VaultX ${serviceName.toUpperCase()} service is up and running`,
        service: serviceName,
        instance: os.hostname()
    })
})

// [MICROSERVICES: HEALTH CHECK] Every microservice exposes its health check
app.use("/api/health", healthRouter)

// [MICROSERVICES: SELECTIVE ROUTE MOUNTING] Mounts specific domain routes per microservice
if (serviceName === "all" || serviceName === "auth") {
    app.use("/api/auth", authRouter)
}

if (serviceName === "all" || serviceName === "account") {
    app.use("/api/accounts", accountRouter)
}

if (serviceName === "all" || serviceName === "transaction") {
    app.use("/api/transactions", transactionRoutes)
    app.use("/api/webhooks", webhookRouter)
    app.use("/api/ai", aiRouter)
}

// Handle unknown routes with clean JSON
app.use((req, res) => {
    return res.status(404).json({
        message: `Route not found on ${serviceName} service`
    })
})

// Global error handler (e.g. malformed JSON payloads)
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON payload" })
    }
    return res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    })
})

module.exports = app
