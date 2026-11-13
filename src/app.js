const express = require("express")
const cookieParser = require("cookie-parser")
const os = require("os")

const app = express()

app.use(express.json())
app.use(cookieParser())

// [SYSTEM DESIGN / LOAD BALANCER] Har response par container instance ID bhejo taaki pata chale kis replica ne handle kiya
app.use((req, res, next) => {
    res.set("X-Handled-By", os.hostname())
    next()
})

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

/**
 * - Use Routes
 */
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Ledger Service is up and running",
        instance: os.hostname()
    })
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

// Handle unknown routes with clean JSON
app.use((req, res) => {
    return res.status(404).json({
        message: "Route not found"
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
