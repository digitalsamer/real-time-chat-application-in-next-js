"use client";
import { useEffect, useState } from "react";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  
  const [unreadCounts, setUnreadCounts] = useState({});
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser?._id;


  useEffect(() => {
    if (!loggedInUserId) return;


      fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));

      fetch(`/api/unread?receiverId=${loggedInUserId}`)
      .then((res) => res.json())  
      .then((data) => {
        const counts = {};
        data.forEach((item) => {
          counts[item._id] = item.count;
        });
        setUnreadCounts(counts);
      });


  }, [loggedInUserId]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">All Users</h2>
      <ul className="space-y-2">
        {users.filter((u) => u._id !== loggedInUserId).map((u) => (
          <li
            key={u._id}
            className="border p-2 rounded cursor-pointer hover:bg-gray-100"
            onClick={async () => {
              const res = await fetch("/api/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user1: loggedInUserId, user2: u._id }),
              });

              const data = await res.json();

              localStorage.setItem("sessionMy", JSON.stringify(data.session));

              window.location.href = `/chat/${u._id}`;
            }}
          >
            {u.name}

            {unreadCounts[u._id] > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                {unreadCounts[u._id]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
