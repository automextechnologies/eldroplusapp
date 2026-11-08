import mongoose from 'mongoose';
import './models/User.js';
import './models/Batch.js';
import './models/Package.js';
import './models/TaskLog.js';
import './models/SalesRep.js';
import './models/Video.js';
import './models/VideoCategory.js';
import './models/EnquiryTicket.js';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
