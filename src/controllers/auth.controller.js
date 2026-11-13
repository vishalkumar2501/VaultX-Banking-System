const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const emailService = require("../services/email.service")
const redis = require("../config/redis")
const { addEmailJob } = require("../queues/email.queue")

/**
 * Standard secure cookie options matching the 3-day JWT lifecycle.
 */
function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production"
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
    }
}

function formatUserResponse(user) {
    return {
        _id: user._id,
        email: user.email,
        name: user.name
    }
}

/**
 * - User register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Name, email, and password are required",
                status: "failed"
            })
        }

        const normalizedEmail = email.trim().toLowerCase()
        const isExists = await userModel.findOne({ email: normalizedEmail })

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with email.",
                status: "failed"
            })
        }

        const user = await userModel.create({
            email: normalizedEmail,
            password,
            name: name.trim()
        })

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

        res.cookie("token", token, getCookieOptions())

        res.status(201).json({
            user: formatUserResponse(user),
            token
        })

        // [SYSTEM DESIGN: BULLMQ QUEUE] Welcome email Redis queue me add karo (background retry support)
        addEmailJob("REGISTRATION_EMAIL", { email: user.email, name: user.name })
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message)
            return res.status(400).json({
                message: messages[ 0 ] || "Invalid registration details",
                status: "failed"
            })
        }
        return res.status(500).json({
            message: "Unable to register user right now",
            status: "failed"
        })
    }
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            })
        }

        const user = await userModel.findOne({ email: email.trim().toLowerCase() }).select("+password")

        if (!user) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            })
        }

        const isValidPassword = await user.comparePassword(password)

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

        res.cookie("token", token, getCookieOptions())

        return res.status(200).json({
            user: formatUserResponse(user),
            token
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to login right now"
        })
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

        if (token) {
            // [REDIS BLACKLIST] Token ki bachi hui expiry (seconds) tak hi Redis me blacklist rakho
            const decoded = jwt.decode(token)
            const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 60 * 60 * 24 * 3
            if (ttl > 0) {
                await redis.set(`bl:${token}`, "1", "EX", ttl)
            }
        }

        const { maxAge, ...clearCookieOptions } = getCookieOptions()
        res.clearCookie("token", clearCookieOptions)

        return res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to logout right now"
        })
    }
}

/**
 * - Send 6-digit OTP & store in Redis for 5 minutes
 * - POST /api/auth/send-otp
 */
async function sendOtpController(req, res) {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            })
        }

        const normalizedEmail = email.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            })
        }

        const otp = crypto.randomInt(100000, 1000000).toString()

        // [REDIS OTP] 6-digit OTP ko 300s (5 min) expiry ke saath Redis RAM me store karo (MongoDB schema ki zaroorat nahi)
        await redis.set(`otp:${normalizedEmail}`, otp, "EX", 300)

        // [SYSTEM DESIGN: BULLMQ QUEUE] OTP email ko background queue me bhejo
        addEmailJob("OTP_EMAIL", { email: normalizedEmail, otp })

        return res.status(200).json({
            message: "OTP sent successfully",
            expiresInSeconds: 300,
            ...(process.env.NODE_ENV !== "production" ? { otp } : {})
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to send OTP right now"
        })
    }
}

/**
 * - Verify OTP against Redis & delete after one-time use
 * - POST /api/auth/verify-otp
 */
async function verifyOtpController(req, res) {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            })
        }

        const normalizedEmail = email.trim().toLowerCase()

        // [REDIS OTP] Redis se OTP match karo; galat/expired par 400 aur verify hone par delete (one-time use)
        const cachedOtp = await redis.get(`otp:${normalizedEmail}`)

        if (!cachedOtp) {
            return res.status(400).json({
                message: "OTP not found or has been expired"
            })
        }

        if (cachedOtp !== String(otp).trim()) {
            return res.status(400).json({
                message: "Incorrect OTP"
            })
        }

        await redis.del(`otp:${normalizedEmail}`)

        return res.status(200).json({
            message: "OTP verified successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Unable to verify OTP right now"
        })
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    sendOtpController,
    verifyOtpController
}
