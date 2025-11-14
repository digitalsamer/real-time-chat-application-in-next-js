import { connectDB } from "@/lib/db";
import Message from "../../../models/Message";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectDB();
    const { senderId, receiverId } = await req.json();
    // http://localhost:3000/api/unread?sender=6914226d007378053931f461&receiver=691457d486ba8992e2faf387
    if (!senderId || !receiverId) {
      return new Response(
        JSON.stringify({ error: "senderId and receiverId required" }),
        { status: 400 }
      );
    }

    const result = await Message.updateMany(
      {
        sender: new mongoose.Types.ObjectId(receiverId),
        receiver: new mongoose.Types.ObjectId(senderId),
        read: false,
      },
      { $set: { read: true } }
    );

    // Mark all messages from sender → receiver as read
    // const result = await Message.updateMany(
    //   {
    //     sender: new mongoose.Types.ObjectId(senderId),
    //     receiver: new mongoose.Types.ObjectId(receiverId),
    //     read: false,
    //   },
    //   { $set: { read: true } }
    // );

    return new Response(
      JSON.stringify({ success: true, updated: result.modifiedCount, matched:result.matchedCount }),
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 mark-read error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
