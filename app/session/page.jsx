"use client";
import { useEffect, useState } from "react";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser?._id;


  useEffect(() => {
    if (!loggedInUserId) return;

      fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setUsers(data));


      const interval = setInterval(() => {
        // console.log(users);
      }, 1000); //1 * 60 * 1000

      return () => clearInterval(interval);

  }, [loggedInUserId]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">All Session</h2>
      <ul className="space-y-2">
        {users.map((s) => (
           <li key={s._id} className="border p-3 rounded-lg hover:bg-gray-100" >
            <div className="flex items-center gap-3">
                
                {/* User 1 */}
                <img 
                src='https://styles.redditmedia.com/t5_2s0fe/styles/communityIcon_2cbkzwfs6kr21.png' 
                className="w-10 h-10 rounded-full" 
                />
                <span className="font-semibold">{s.user1?.name}</span>

                <span className="mx-2 font-bold">vs</span>

                {/* User 2 */}
                <img 
                src='https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png' 
                className="w-10 h-10 rounded-full" 
                />
                <span className="font-semibold">{s.user2?.name}</span>
            </div>

            {/* Duration */}
            <div className="text-sm text-gray-600 mt-1">
                Duration: {Math.round(s.duration / 60)} min
            </div>

            {/* Time */}
            <div className="text-xs text-gray-500">
                Started: {new Date(s.startedAt).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
                Ended: {new Date(s?.endedAt).toLocaleString()}
            </div>
           </li>
        ))}
      </ul>

    </div>
  );
}
