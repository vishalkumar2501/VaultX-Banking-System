require('dotenv').config();
const mongoose = require('mongoose');
const accountModel = require('../src/models/account.model');
const userModel = require('../src/models/user.model');
const aiController = require('../src/controllers/ai.controller');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const user = await userModel.findOne();
        if (!user) {
            console.log("No user found");
            process.exit(0);
        }
        console.log("Found user:", user.email, user._id);

        const req = {
            user: { _id: user._id },
            body: { message: "Mera account status aur balance kya hai?" }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log("Response status:", this.statusCode);
                console.log("Response data:", data);
                return this;
            }
        };

        console.log("\n--- Testing Spending Insights ---");
        await aiController.getSpendingInsightsController(req, res);

        console.log("\n--- Testing Chat Assistant ---");
        await aiController.chatWithAiController(req, res);

        await mongoose.disconnect();
        process.exit(0);
    } catch (e) {
        console.error("Test error:", e);
        process.exit(1);
    }
}

test();
