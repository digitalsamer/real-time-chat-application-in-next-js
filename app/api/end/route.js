import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";

export async function POST(req) {
  try {
    await connectDB();

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session ID" }), { status: 400 });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }

    session.endedAt = new Date();
    session.duration = (session.endedAt - session.startedAt) / 1000; // seconds
    await session.save();

    return new Response(JSON.stringify({ message: "Session ended", session }), { status: 200 });
  } catch (err) {
    console.error("Error ending session:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
