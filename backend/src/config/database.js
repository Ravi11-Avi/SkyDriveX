const mongoose = require("mongoose");
const dns = require("dns");

// Optional custom DNS configuration for environments requiring specific resolvers
if (process.env.DNS_SERVERS) {
  try {
    const customServers = process.env.DNS_SERVERS.split(",").map((s) => s.trim());
    dns.setServers(customServers);
  } catch (e) {
    console.warn("Could not set custom DNS servers:", e.message);
  }
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/skydrivex";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error("Please verify your MONGO_URI in .env or ensure MongoDB is running.");
    process.exit(1);
  }
};

module.exports = connectDB;
