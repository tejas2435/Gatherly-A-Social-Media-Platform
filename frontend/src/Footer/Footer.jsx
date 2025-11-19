import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  HelpCircle,
  Shield,
  FileText,
  AlertCircle,
  Mail,
  Globe,
  Copyright,
} from 'lucide-react';


function Footer() {
  const [followedUsers, setFollowedUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/users/suggested", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch suggestions");

        const data = await res.json();
        setSuggestedUsers(data);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };

    fetchSuggested();
  }, []);

  const toggleFollow = async (targetUsername) => {
    const token = localStorage.getItem("token");
    const isAlreadyFollowing = followedUsers.includes(targetUsername);

    try {
      const res = await fetch(`http://localhost:3000/api/follow/${isAlreadyFollowing ? 'unfollow' : 'follow'}/${targetUsername}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Follow toggle failed');

      setFollowedUsers((prev) =>
        isAlreadyFollowing
          ? prev.filter((uname) => uname !== targetUsername)
          : [...prev, targetUsername]
      );
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };



  const links = [
    { icon: HelpCircle, text: 'Help Center' },
    { icon: FileText, text: 'Terms of Service' },
    { icon: Shield, text: 'Privacy Policy' },
    { icon: AlertCircle, text: 'Guidelines' },
    { icon: Users, text: 'Community' },
    { icon: Mail, text: 'Contact Us' },
    { icon: Globe, text: 'Languages' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex dark:bg-gray-900">

      <aside className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col h-screen sticky top-0 dark:bg-gray-900">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Users size={20} className="text-blue-600 dark:text-indigo-300" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Suggested Users</h2>
          </div>
          <div className="space-y-4">
            {suggestedUsers.map((user) => {
              const isFollowing = followedUsers.includes(user.username);

              return (
                <div key={user.id} className="flex items-center gap-3">
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                    <img
                      src={
                        user.profile_photo
                          ? user.profile_photo
                          : 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
                      }
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleFollow(user.username)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${isFollowing
                      ? 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-600'
                      : 'text-blue-500 hover:text-blue-600 hover:bg-blue-200 dark:hover:text-indigo-300 '
                      }`}
                    style={{ marginRight: '-1em' }}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="mt-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 dark:text-white">Quick Links</h3>
          <div className="space-y-3">
            {links.map((link, index) => (
              <a
                key={index}
                href="#"
                className="flex items-center text-sm text-gray-600 dark:text-white hover:text-blue-600 dark:hover:text-indigo-300 transition-colors"
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.text}
              </a>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center text-xs text-gray-500">
              <Copyright className="w-3 h-3 mr-1" />
              <span>{new Date().getFullYear()} Gatherly. All rights reserved.</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Footer;
