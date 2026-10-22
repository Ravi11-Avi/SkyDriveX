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
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skydrivex";
  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}).`);
    if (mongoUri !== "mongodb://127.0.0.1:27017/skydrivex" && mongoUri !== "mongodb://localhost:27017/skydrivex") {
      try {
        console.log("Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/skydrivex)...");
        const localConn = await mongoose.connect("mongodb://127.0.0.1:27017/skydrivex", { serverSelectionTimeoutMS: 3000 });
        console.log(`Connected to Local Fallback MongoDB: ${localConn.connection.host}`);
        return localConn;
      } catch (fallbackErr) {
        console.error(`Local fallback MongoDB also failed: ${fallbackErr.message}`);
      }
    }
    console.error("Please verify your MONGO_URI in .env or ensure MongoDB is running.");
    process.exit(1);
  }
};

module.exports = connectDB;
