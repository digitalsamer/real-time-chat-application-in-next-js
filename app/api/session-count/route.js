import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return new Response(JSON.stringify({ error: "Invalid or missing userId" }), {
        status: 400,
      });
    }

    // Get the first and last day of current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Count sessions where this user is user1 and started in current month
    const count = await ChatSession.countDocuments({
      user1: new mongoose.Types.ObjectId(userId),
      startedAt: { $gte: firstDay, $lte: lastDay },
    });

    return new Response(JSON.stringify({ month: now.getMonth() + 1, count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /session-count error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
