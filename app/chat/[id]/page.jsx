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
  const [fileKey, setFileKey] = useState(Date.now());

  const receiverId = pathname.split("/").pop().trim();
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

      // socket.emit("markAsRead", { senderId, receiverId });
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
    setFileKey(Date.now());
    socket.emit("sendMessage", messageData);
    
    if (res.ok) {
      const newMsg = await res.json();
      // setMessages((prev) => [...prev, newMsg]);
      setMsg("");       // clear message
      setImage(null);   // clear image state (removes preview)
      setFileKey(Date.now());
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
    <div className="p-6 max-w-[900px] mx-auto">
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

      {/* <div className="h-100 border p-2 overflow-y-auto mb-4 border-b-0 space-y-2"> */}
      <div className="h-100 border p-2 overflow-y-auto mb-4 border-b-0 space-y-4">
        {messages.map((m, i) => (
          
          <div
            key={i}
            className={`flex items-end gap-2 ${m.sender === senderId ? "justify-end" : "justify-start"}`}
          >

            {m.sender !== senderId && (
              <img
                src='https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png' 
                alt="user"
                className="w-8 h-8 rounded-full border"
              />
            )}
            
            <div
              className={`
                max-w-[70%] p-2 rounded-2xl shadow
                ${m.sender === senderId 
                  ? "bg-[#712cf9] text-white rounded-br-none" 
                  : "bg-[#ced4da] text-black rounded-bl-none"}
              `}
            >
              
              {m.text && (
                <div className="mb-1 whitespace-pre-wrap">{m.text}</div>
              )}

              
              {m.image && (
                <img
                  src={m.image}
                  alt="uploaded"
                  className="rounded-lg max-w-[250px] mb-1"
                />
              )}

              
              <div className="flex justify-end items-center gap-1 text-xs opacity-80">
                <span>
                  {new Date(m.createdAt).toLocaleString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>

                {m.sender === senderId && (
                  <span>{m.read ? "✔" : "✓"}</span>
                )}
              </div>
            </div>
            {m.sender === senderId && (
              <img
                src='https://styles.redditmedia.com/t5_2s0fe/styles/communityIcon_2cbkzwfs6kr21.png'
                alt="me"
                className="w-8 h-8 rounded-full border"
              />
            )}
          </div>
        ))}
        
      </div>

      <input
        className="border rounded-xl w-full p-2 pb-10 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder="Type your message..."
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <div className="flex items-center justify-between">
        {/* <input className="p-4" type="file" onChange={(e) => setImage(e.target.files[0])} /> */}
        <label className="flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" 
              fill="none" viewBox="0 0 24 24" strokeWidth="1.5" 
              stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M12 16.5V9m0 0l3 3m-3-3l-3 3m9 3.75V18a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18v-.75"/>
          </svg>
          {image ? (
            <span className="text-green-600 font-medium">
              {image.name}
            </span>
          ) : (
            <span>Attach File</span>
          )}
          <input type="file" key={fileKey} className="hidden" onChange={(e) => setImage(e.target.files[0])} />
          
        </label>

        <button onClick={sendMessage} className="flex items-center gap-2 bg-purple-500 text-white px-5 py-2 rounded-xl      hover:bg-purple-600 transition" >
          Send message
          <svg xmlns="http://www.w3.org/2000/svg" 
           fill="none" viewBox="0 0 24 24" strokeWidth="1.5" 
           stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M4.5 12h15m0 0l-6-6m6 6l-6 6"/>
          </svg>
        </button>

      </div>
    </div>
  );
}
