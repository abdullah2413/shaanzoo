"use strict";

const mongoose = require("mongoose");
const config = require("./env");

/**
 * Connect to MongoDB Atlas using Mongoose.
 * The database name is always supplied explicitly so we never fall back to a
 * default/test database. Connection errors are surfaced without leaking the
 * full URI.
 */
async function connectDatabase() {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    const name = mongoose.connection.name;
    // Log only the database name, never the credentials/URI.
    console.log(`[db] Connected to MongoDB database "${name}".`);
  });

  mongoose.connection.on("error", (err) => {
    console.error(`[db] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB connection disconnected.");
  });

  await mongoose.connect(config.db.uri, {
    dbName: config.db.name,
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10
  });

  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

module.exports = { connectDatabase, disconnectDatabase };
