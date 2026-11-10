const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")

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
        name: user.name,
        isSystemUser: Boolean(user.systemUser),
        createdAt: user.createdAt
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

        // Dispatch welcome email asynchronously without blocking response
        emailService.sendRegistrationEmail(user.email, user.name).catch((err) => {
            console.error("Failed to send registration email:", err.message)
        })
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

        const user = await userModel.findOne({ email: email.trim().toLowerCase() }).select("+password +systemUser")

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
 * - Get Current Authenticated User
 * - GET /api/auth/me
 */
async function getCurrentUserController(req, res) {
    return res.status(200).json({
        user: formatUserResponse(req.user)
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

        if (token) {
            // Upsert avoids duplicate-key error if logout is called twice with the same token
            await tokenBlackListModel.updateOne(
                { token },
                { $setOnInsert: { token } },
                { upsert: true }
            )
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

module.exports = {
    userRegisterController,
    userLoginController,
    getCurrentUserController,
    userLogoutController
}
