import { connectDB } from "@/lib/db";
import User from "../../../models/User"
// export const User = mongoose.model("User", userSchema);
import bcrypt from "bcrypt";

export async function POST(req) {
  await connectDB();
  const { name, email, password } = await req.json();

  const existing = await User.findOne({ email });
  if (existing) {
    return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashed });
  await newUser.save();

  return new Response(JSON.stringify({ message: "User registered" }), { status: 201 });
}
