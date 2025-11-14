import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectDB();
    const { receiverId } = await req.json();

    if (!receiverId) {
      return new Response(JSON.stringify({ error: "receiverId is required" }), { status: 400 });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return new Response(JSON.stringify({ error: "Invalid receiverId format" }), { status: 400 });
    }

    const user = await User.findById(receiverId).select("name email _id");

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    console.error("POST /api/userfind error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
