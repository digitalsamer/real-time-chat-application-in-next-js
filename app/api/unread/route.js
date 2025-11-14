import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import Message from "../../../models/Message";

export async function GET(req) {
  try {
    await connectDB();

    // Get receiverId from query params
    const { searchParams } = new URL(req.url);
    const receiverId = searchParams.get("receiverId");
    

    if (!receiverId)
      return new Response(
        JSON.stringify({ error: "receiverId required" }),
        { status: 400 }
      );

    // Find unread messages grouped by sender
    const unreadCounts = await Message.aggregate([
      { $match: { receiver: new mongoose.Types.ObjectId(receiverId), read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);

    return new Response(JSON.stringify(unreadCounts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching unread messages:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
