const express = require("express")
const authController = require("../controllers/auth.controller")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")

const router = express.Router()

// [REDIS RATE LIMIT] Brute-force / spam login-register rokne ke liye: 10 req / 60s per IP
const authLimiter = createRateLimiter({ prefix: "auth", windowSeconds: 60, maxRequests: 10 })

/* POST /api/auth/register */
router.post("/register", authLimiter, authController.userRegisterController)

/* POST /api/auth/login */
router.post("/login", authLimiter, authController.userLoginController)

/* POST /api/auth/logout */
router.post("/logout", authController.userLogoutController)

module.exports = router
