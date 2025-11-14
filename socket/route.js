import { Server } from "socket.io";

let io;

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🟢 Socket.io server starting...");
    io = new Server(res.socket.server, {
      path: "/socket.io",
      cors: { 
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
       },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join", (userId) => {
        socket.join(userId);
        console.log("User joined room:", userId);
      });
      
      socket.on("sendMessage", (message) => {
        // msg specific user
        // io.emit("receiveMessage", message);
        io.to(message.receiver).emit("receiveMessage", message);

        io.to(message.receiver).emit("updateUnreadCount", {
          senderId: message.sender,
          receiverId: message.receiver,
        });

      });

      socket.on("markAsRead", ({ senderId, receiverId }) => {
        io.to(senderId).emit("markAsRead", { senderId, receiverId });
        io.to(receiverId).emit("updateUnreadCount", { senderId, receiverId });
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });

    });

    res.socket.server.io = io;
  } else {
    console.log("🟡 Socket.io already running.");
  }

  res.end();
}
