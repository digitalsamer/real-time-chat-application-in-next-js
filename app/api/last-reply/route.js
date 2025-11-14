import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const sender = searchParams.get("sender");   // receiverId (you’re checking if they replied)
  const receiver = searchParams.get("receiver"); // your ID (you sent last)
  const lastmsgTime = searchParams.get("last"); // timestamp of your last message

  if (!sender || !receiver || !lastmsgTime) {
    return new Response(
      JSON.stringify({ error: "sender, receiver, and last time required" }),
      { status: 400 }
    );
  }

  const senderId = new mongoose.Types.ObjectId(sender);
  const receiverId = new mongoose.Types.ObjectId(receiver);

  // Find any message sent by the receiver **after** your last message
  const reply = await Message.findOne({
    sender: senderId,      // reply came from the other person
    receiver: receiverId,  // to you
    // createdAt: { $gt: new Date(lastmsgTime) }, // after your last message
  }).select("text createdAt _id, sender")
    .sort({ createdAt: -1 })
    .lean();

  return new Response(
    JSON.stringify(reply || { replied: false }),
    { status: 200 }
  );
}
