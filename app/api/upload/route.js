import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "chat", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate filename and path
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Write the file to disk
    await writeFile(filePath, buffer);

    // Return the file URL (served from /public)
    return new Response(JSON.stringify({ url: `/chat/uploads/${fileName}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
