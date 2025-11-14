import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";

export async function POST(req) {
  await connectDB();
  const { user1, user2 } = await req.json();

  // देखो कि पहले से कोई active session तो नहीं है
  let session = await ChatSession.findOne({
    user1,
    user2,
    endedAt: { $exists: false },
  });

  // session
  if (!session) {
    session = await ChatSession.create({ user1, user2 });
  }

  return new Response(JSON.stringify({ session: session }), { status: 201 });
  // return new Response(JSON.stringify(session), { status: 201 });
}
