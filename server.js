require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")

connectToDB()
// [REDIS] Startup par Redis client initialize karta hai (src/config/redis.js)
require("./src/config/redis")

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})