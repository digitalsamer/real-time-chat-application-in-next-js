import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const sender = searchParams.get("sender");
  const receiver = searchParams.get("receiver");

  if (!sender || !receiver) {
    return new Response(JSON.stringify({ error: "sender and receiver required" }), { status: 400 });
  }

  const senderId = new mongoose.Types.ObjectId(sender);
  const receiverId = new mongoose.Types.ObjectId(receiver);

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: senderId, receiver: receiverId },
        //   { sender: receiverId, receiver: senderId },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        text: 1,
        sender: 1,
        receiver: 1,
        createdAt: 1,
      },
    },
  ]);

  return new Response(JSON.stringify(messages[0] || {}), { status: 200 });
}
