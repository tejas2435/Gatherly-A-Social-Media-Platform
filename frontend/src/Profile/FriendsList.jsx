import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from "react-router-dom";


export default function FriendsList({ userId }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { username } = useParams();



  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:3000/api/friends/by-username/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch friends");
        const data = await res.json();
        setFriends(data);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError("Could not load friends.");
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [username]);


  if (loading) {
    return <p className="text-center text-gray-500">Loading friends...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }



  return (
    <div className="p-4">
      {friends.length === 0 ? (
        <p className="text-center text-gray-500">No friends yet</p>
      ) : (

        <div className="grid grid-cols-3 gap-6 px-4">
          {friends.map(friend => (
            <Link
              key={friend.id}
              to={`/profile/${friend.username}`}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow hover:shadow-lg dark:hover:shadow-indigo-600/40 transition-shadow w-full max-w-xs mx-auto"
            >
              <img
                src={
                  friend.profile_photo ||
                  'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
                }
                alt={friend.name || 'User'}
                className="w-24 h-24 rounded-full mx-auto object-cover mb-3"
              />
              <p className="font-semibold text-gray-900 dark:text-white">
                {friend.name || 'Unnamed'}
              </p>
              <p className="text-gray-500 text-sm">@{friend.username}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
