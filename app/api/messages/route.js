import { connectDB } from "@/lib/db";
import Message from "@/models/Message";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sender = searchParams.get("sender");
    const receiver = searchParams.get("receiver");
    const sessionTime = searchParams.get("sessionTime");

    if (!sender || !receiver) {
      return new Response(JSON.stringify({ error: "Sender or receiver missing" }), { status: 400 });
    }

    // Sender aur Receiver dono ke messages laa rahe hai
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
      createdAt: { $gte: new Date(sessionTime) }
    }).sort({ createdAt: 1 });

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (err) {
    console.error("GET /messages error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { sender, receiver, text, image, sessionId } = await req.json();
    const read = 0;
    if (!sender || !receiver || !text) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const message = await Message.create({ sender, receiver, text, image, sessionId, read });
    return new Response(JSON.stringify(message), { status: 201 });
  } catch (err) {
    console.error("POST /messages error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
