
import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

function SearchMenu({ users, onSelect }) {
  const [profiles, setProfiles] = useState({});

  // Fetch profile data for a given username (this should return binary image data)
  const fetchProfile = async (username) => {
    try {
      // API call to get the profile photo for each user
      const response = await fetch(`http://localhost:3000/api/users/${username}/profilephoto`);
      if (response.ok) {
        // If the response is an image, we can store it as a Blob and generate a URL for it
        const imageBlob = await response.blob();  // Get the image as a Blob
        const imageUrl = URL.createObjectURL(imageBlob); // Create an Object URL for the Blob
        setProfiles((prevProfiles) => ({
          ...prevProfiles,
          [username]: imageUrl, // Store the image URL
        }));
      } else {
        console.error(`Failed to fetch profile for ${username}`);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Fetch profile data for all users
  useEffect(() => {
    users.forEach((user) => {
      if (!profiles[user.username]) {
        fetchProfile(user.username); // Fetch profile for the user if not already in state
      }
    });
  }, [users, profiles]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto relative z-50 dark:bg-gray-700 ">
      {users.map((user) => (
        <div
          key={user.username}
          className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-500"
          onClick={() => onSelect(user.username)}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">

            {profiles[user.username] ? (


              <img
                src={profiles[user.username]}
                alt={user.username}
                className="w-10 h-10 object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';
                }}
              />

            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.name || user.username}</p>
            <p className="text-sm text-gray-500 dark:text-white">@{user.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SearchMenu;
