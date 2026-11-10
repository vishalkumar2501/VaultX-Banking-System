const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const mongoose = require("mongoose")

const app = express()

const allowedOrigins = (
    process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174,http://localhost:3000"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

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
    res.send("AegisLedger Core Banking Service is up and running")
})

app.get("/api/health", (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1
    return res.status(200).json({
        status: "ok",
        service: "AegisLedger Core Engine",
        database: dbConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
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

// Global error handler (e.g. malformed JSON or CORS error)
app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ message: err.message })
    }
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON payload" })
    }
    return res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    })
})

module.exports = app
