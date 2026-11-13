// [SYSTEM DESIGN: WEBHOOK ROUTE]
const express = require("express")
const webhookController = require("../controllers/webhook.controller")

const router = express.Router()

router.post("/payment", webhookController.paymentWebhookController)

module.exports = router
