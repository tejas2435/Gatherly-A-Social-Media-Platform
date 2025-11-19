
import React, { useEffect, useState } from 'react';

function FollowButton({ username }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!token) {
        console.log('No token found');
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/api/follow/status/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.log('Unauthorized');
          return;
        }

        const data = await res.json();
        setIsFollowing(data.following);
      } catch (error) {
        console.error('Error checking follow status:', error);
        setError('Failed to load follow status');
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [username, token]);

  const handleFollowToggle = async () => {
    if (!token) return;

    setButtonLoading(true);
    setError(null);

    const url = `http://localhost:3000/api/follow/${isFollowing ? 'unfollow' : 'follow'}/${username}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      } else {
        const errorMsg = await res.text();
        setError(`Follow/unfollow failed: ${errorMsg}`);
        console.error('Follow/unfollow failed:', errorMsg);
      }
    } catch (error) {
      setError('An error occurred while following/unfollowing');
      console.error('Follow/unfollow error:', error);
    } finally {
      setButtonLoading(false);
    }
  };

  if (loading) {
    return (
      <button className="px-4 py-2 rounded bg-gray-200 text-gray-600 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  return (
    <div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handleFollowToggle}
        disabled={buttonLoading}
        className={`px-4 w-[150px] py-2 rounded transition ${isFollowing
            ? 'bg-red-200 text-black hover:bg-red-400 rounded-full'
            : 'bg-blue-300  hover:bg-blue-500 rounded-full'
          } ${buttonLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {buttonLoading ? (
          <span>Loading...</span>
        ) : isFollowing ? (
          'Unfollow'
        ) : (
          'Follow'
        )}
      </button>
    </div>
  );
}

export default FollowButton;
