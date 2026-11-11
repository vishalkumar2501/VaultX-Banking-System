const dns = require("dns")
const mongoose = require("mongoose")

async function connectToDB() {
    if (!process.env.MONGO_URI) {
        console.error("Error connecting to DB: MONGO_URI is missing in .env")
        process.exit(1)
    }

    // Prefer IPv4 on Windows dual-stack networks where IPv6 DNS proxies refuse SRV lookups
    dns.setDefaultResultOrder("ipv4first")

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("server is connected to DB")
    } catch (err) {
        const isSrvDnsError =
            err?.syscall === "querySrv" ||
            err?.code === "ECONNREFUSED" ||
            err?.code === "ETIMEOUT"

        if (isSrvDnsError) {
            console.warn("System DNS refused MongoDB SRV lookup; retrying with public DNS (8.8.8.8, 1.1.1.1)...")
            try {
                dns.setServers([ "8.8.8.8", "8.8.4.4", "1.1.1.1" ])
                await mongoose.connect(process.env.MONGO_URI)
                console.log("server is connected to DB")
                return
            } catch (retryErr) {
                console.error("Error connecting to DB:", retryErr.message)
                console.error("Tip: Check your internet connection, Atlas Network Access (0.0.0.0/0), or use a standard mongodb:// URI without +srv.")
                process.exit(1)
            }
        }

        console.error("Error connecting to DB", err)
        process.exit(1)
    }
}

module.exports = connectToDB
