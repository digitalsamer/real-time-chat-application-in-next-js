import { connectDB } from "@/lib/db";
import User from "../../../models/User";

export async function GET() {
  await connectDB();

  try {
    const users = await User.find({}, { password: 0 }); // password hide
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
    });
  }
}
