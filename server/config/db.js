const mongoose = require('mongoose');
const env = require('./env');

let memServer = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to primary URI (${env.MONGODB_URI}): ${err.message}`);

    // If in development mode and primary connection failed, try in-memory server as a zero-setup fallback
    if (env.NODE_ENV === 'development') {
      try {
        console.log('[MongoDB] Starting zero-config in-memory MongoDB for local development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memServer = await MongoMemoryServer.create({
          instance: { dbName: 'stepup_shoes' }
        });
        const memoryUri = memServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] In-memory database connected at: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error('[MongoDB] In-memory database could not be initialized:', memErr.message);
      }
    }

    console.error('[MongoDB] Critical: Database connection failed. Please ensure MongoDB is running or check your MONGODB_URI.');
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
