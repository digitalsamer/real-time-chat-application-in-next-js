import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 },
});

export default mongoose.models.ChatSession ||
  mongoose.model("ChatSession", chatSessionSchema);
