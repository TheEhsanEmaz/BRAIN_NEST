import mongoose from "mongoose";

let connectionPromise;

export function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas URI to .env.local.");
    }

    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    }).then(() => mongoose.connection).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}
