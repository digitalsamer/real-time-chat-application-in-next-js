import { connectDB } from "@/lib/db";
import ChatSession from "../../../models/ChatSession";
import User from "../../../models/User";

export async function GET() {
  await connectDB();

  try {
    const sessions = await ChatSession.find({})
      .populate("user1", "name email")
      .populate("user2", "name email")
      .lean()
      .sort({ startedAt: -1 });

    return new Response(JSON.stringify(sessions), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch sessions" }), {
      status: 500
    });
  }
}
