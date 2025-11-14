import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🟢 Starting Socket.io server...");

    const io = new Server(res.socket.server, {
      path: "/socket.io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("✅ New client:", socket.id);

      socket.emit("welcome", `Welcome ${socket.id}`);

      socket.on("sendMessage", (msg) => {
        console.log("📩 Received:", msg);
        io.emit("receiveMessage", msg);
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("🟡 Socket.io already running");
  }

  res.end();
}
