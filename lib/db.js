import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error("Add MongoDB URI to .env.local");

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  const db = await mongoose.connect(MONGODB_URI);
  isConnected = db.connections[0].readyState;
  console.log("✅ MongoDB Connected");
};
