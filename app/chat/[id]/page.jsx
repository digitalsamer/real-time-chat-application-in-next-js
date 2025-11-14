"use client";
import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const socket = io();

export default function Chat({ params }) {

  const pathname = usePathname();

  const [msg, setMsg] = useState("");
  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [receiverUser, setReceiverUser] = useState(null);
  const [session, setSession] = useState(null);
  const [lastMsgTimes, setLastMsgTimes] = useState({});

  const receiverId = pathname.split("/").pop().trim();
  // const senderId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const loggedInUser = JSON.parse(localStorage.getItem('user') ?? {});
  const loggedInUserId = loggedInUser?._id;
  const senderId = loggedInUserId;


  const fetchLastMessages = async () => {
    if (!loggedInUserId) return;
    try {
        const res = await fetch(`/api/last-messages-all?sender=${senderId}&receiver=${receiverId}`);
        const data = await res.json();

        if (data && data.createdAt) {
          const lastMessageTime = new Date(data.createdAt);
          console.log("Last message sent:", lastMessageTime, "by", data.sender);

          const lastrep = await fetch(`/api/last-reply?sender=${receiverId}&receiver=${senderId}&last=${encodeURIComponent(lastMessageTime.toISOString())}`);
          const lastreplay = await lastrep.json();

          if (lastreplay && lastreplay.createdAt) {
            const replyTime = new Date(lastreplay.createdAt);
            const diffMinutes = Math.floor((replyTime - lastMessageTime) / (1000 * 60));
            
            timeCampaire(lastMessageTime, replyTime);

          // console.log(`Receiver replied after ${diffMinutes} minute(s) at ${replyTime.toLocaleTimeString()}`);
          } else {
            const now = new Date();
            const diffMinutes = Math.floor((now - lastMessageTime) / (1000 * 60));
            console.log(`⚠️ No reply received yet — ${diffMinutes} minute(s) since last message.`);
          }

        }
    } catch (err) {
      console.error("Error fetching message times:", err);
    }
  };
  
  useEffect(() => {
    if (!senderId || !receiverId) return;

    fetch("/api/socket");

    const socket = io({
      path: "/socket.io",
    });

    socket.on("connect", () => {
      // console.log("Connected to socket server:", socket.id);
    });

    socket.on("receiveMessage", (message) => {
      // console.log("📩 New message:", message);
      setMessages((prev) => [...prev, message]);
    });

    const handleUserActivity = () => {
      fetch("/api/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: senderId, receiverId: receiverId }),
      });

      socket.emit("markAsRead", { senderId, receiverId });
    };

    window.addEventListener("keydown", handleUserActivity);

    const fetchSessionCount = async () => {
      const res = await fetch(`/api/session-count?userId=${senderId}`);
      const data = await res.json();
      // console.log("Total Sessions This Month:", data.count);
      if (data.count >= 15) {
        alert("You’ve reached your session limit for this month!");
        // return;
      }
    };
    fetchSessionCount();

    const startSession = async () => {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user1: senderId, user2: receiverId }),
      });
      const data = await res.json();
      setSession(data.session);
      localStorage.setItem('sessionMy', JSON.stringify(data.session));
    };

    startSession();

    const fetchUser = async () => {
      try {
        fetch("/api/userfind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId }),
        })
          .then((res) => res.json())
          .then((data) => {
            setReceiverUser(data);
          });
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();

    fetch("/api/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: senderId, 
        receiverId: receiverId, 
      }),
    });

    const sessionStartId = JSON.parse(localStorage.getItem("sessionMy"));
    fetch(`/api/messages?sender=${senderId}&receiver=${receiverId}&sessionTime=${sessionStartId.startedAt}`)
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []));
        
    fetchLastMessages();

    const interval = setInterval(() => {
      fetchLastMessages();
    }, 5 * 60 * 1000); //1 * 60 * 1000

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleUserActivity);
      socket.disconnect();
    };

  }, [senderId, receiverId]);

  // Message भेजना
  const sendMessage = async (e) => {
    e.preventDefault();
    let imageUrl = "";

    if (image) {
      const formData = new FormData();
      formData.append("file", image);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
      
    }else{
      if (!msg.trim()) return;
    }

    const messageData = {
      sender: senderId,
      receiver: receiverId,
      text: msg,
      image: imageUrl,
      createdAt: new Date(),
    };

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: senderId,
        receiver: receiverId,
        text: msg,
        image: imageUrl,
        sessionId: session?._id,
      }),
    });

    socket.emit("sendMessage", messageData);
    
    if (res.ok) {
      const newMsg = await res.json();
      // setMessages((prev) => [...prev, newMsg]);
      setMsg("");
    }
  };

  const endSession = async () => {
    if (!session?._id) return alert("No active session found");

    const res = await fetch("/api/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session._id }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Session Ended! Duration: ${Math.round(data.session.duration / 60)} minutes`);
      setSession(null);
      localStorage.removeItem("sessionMy");

      fetch("/api/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: senderId, 
          receiverId: receiverId, 
        }),
      });

      window.location.href = `/users`
    } else {
      alert(data.error || "Error ending session");
    }
  };

  const timeCampaire = (lastMessageTime, replyTime) => {
    const sessionString = localStorage.getItem("sessionMy");

    if (!sessionString) {
      console.warn("⚠️ No session found in localStorage");
      return;
    }

    const session = JSON.parse(sessionString);

    if (!session.startedAt) {
      console.warn("⚠️ Session missing startedAt");
      return;
    }

    console.log("Session:", session._id);

    const sessionStart = new Date(session.startedAt);
    const sessionEnd = session.endedAt ? new Date(session.endedAt) : null;

    console.log("🕓 Session started at:", sessionStart.toLocaleTimeString());

    // 1️⃣ Check if the last message is part of this session
    const isMsgInSession =
      lastMessageTime >= sessionStart &&
      (!sessionEnd || lastMessageTime <= sessionEnd);

    // 2️⃣ Check if reply also happened in same session
    const isReplyInSession =
      replyTime &&
      replyTime >= sessionStart &&
      (!sessionEnd || replyTime <= sessionEnd);

    if (!isMsgInSession) {
      console.log("⚠️ The last message was sent outside of this session.");
      return;
    }

    if (isReplyInSession) {
      const diffMinutes = Math.floor((replyTime - lastMessageTime) / (1000 * 60));
      console.log(
        `✅ Reply received within the same session after ${diffMinutes} minute(s).`
      );

      if (diffMinutes > 1) {
        // console.log(`Reply came after more than 1 minutes!`)
        // alert("⚠️ Reply came after more than 1 minutes!");
      }
    } else {
      const now = new Date();
      const diffMinutes = Math.floor((now - lastMessageTime) / (1000 * 60));
      console.log(`❌ No reply yet within session — ${diffMinutes} min since last message.`);

      if (diffMinutes > 1) {
        console.log("⚠️ No reply for 1+ minutes during active session!");
      }
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold mb-4">Session Start with {receiverUser ? receiverUser.name : "Loading..."} </h2>

          {session && !session.endedAt && (
            <button
              onClick={endSession}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              End Session
            </button>
          )}
      </div>

      <div className="h-100 border p-2 overflow-y-auto mb-4 chat-box">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-1 mb-1 ${
              m.sender === senderId ? "text-right text-blue-600" : "text-left text-green-600"
            }`}
          >
            {m.sender === senderId ? (<span>{m.read ? "✔" : "✓"}</span>) : ("")}
            {m.text && <div className="inline-block bg-gray-100 px-2 py-1 rounded">{m.text}</div>}
            {m.image && (
              <div className="mt-2">
                <img
                  src={m.image}
                  alt="uploaded"
                  className={`inline-block max-w-[200px] rounded shadow ${
                    m.sender === senderId ? "ml-auto" : "mr-auto"
                  }`}
                />
              </div>
            )}
            {m.sender === senderId ? ("") : (<span>{m.read ? "✔" : "✓"}</span>)}
            <div className="text-xs text-gray-400 mt-1">
              {new Date(m.createdAt).toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        ))}
        
      </div>

      <input
        className="border p-2 w-full"
        placeholder="Type message..."
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white mt-2 px-4 py-2 rounded"
      >
        Send
      </button>
    </div>
  );
}
