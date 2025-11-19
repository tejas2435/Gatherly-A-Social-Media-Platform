import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';  // Import useParams for URL parameter extraction
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
} from 'lucide-react';
import FollowButton from './FollowButton';
import { Link } from 'react-router-dom';
import PostPopup from './PostPopup';




function ProfilePage() {
  const { username } = useParams();  // Get the username from the URL params
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: '',
    profilePic: '',
    coverPhoto: '',
    profilePicFile: null,
    coverPhotoFile: null,
  });
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const [commentCounts, setCommentCounts] = useState([]);

  const fetchCommentCounts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/commentcount');
      const data = await res.json();
      setCommentCounts(data); // [{ post_id: 1, comment_count: "3" }, ...]
    } catch (err) {
      console.error('Failed to fetch comment counts:', err);
    }
  };

  useEffect(() => {
    fetchCommentCounts();
  }, []);

  const getCommentCount = (postId) => {
    const found = commentCounts.find(c => c.post_id === postId);
    return found ? parseInt(found.comment_count) : 0;
  };

  useEffect(() => {
    document.title = `${profile.name}'s Profile - Gatherly`;
  }, [profile.name]);


  useEffect(() => {
    const token = localStorage.getItem('token');

    // Ensure there is a valid token and username before fetching data
    if (token && username) {
      // Fetch user data
      fetchUserData(username, token);

      // Fetch friends data
      const fetchFriends = async () => {
        try {
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
    } else {
      console.error('No valid token or username found');
    }
  }, [username]);

  const onPostClick = (post) => {
    console.log('Post clicked:', post);

    setSelectedPost(post);
  };


  const fetchUserData = async (username, token) => {
    try {
      const profileResponse = await fetch(`http://localhost:3000/api/profile/${username}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!profileResponse.ok) {
        console.error('Failed to fetch profile:', profileResponse.statusText);
        return;
      }
      const profileData = await profileResponse.json();
      setProfile(prev => ({
        ...prev,
        ...profileData,
      }));

      const postsResponse = await fetch(`http://localhost:3000/api/posts/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!postsResponse.ok) throw new Error('Failed to fetch posts');
      const postsData = await postsResponse.json();
      setPosts(Array.isArray(postsData) ? postsData : []);

      const friendsResponse = await fetch(`http://localhost:3000/api/friends/by-username/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!friendsResponse.ok) throw new Error('Failed to fetch friends');
      const friendsData = await friendsResponse.json();
      setFriends(Array.isArray(friendsData) ? friendsData : []);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Photo */}
      <div className="relative h-80 bg-gray-300 dark:bg-gray-900">
        <img
          src={profile.coverPhoto || `http://localhost:3000/api/users/${username}/coverphoto`}
          onError={(e) => {
            e.target.onerror = null; // prevents looping
            e.target.src = 'https://i.postimg.cc/5tnWjn6B/JShine.png';
          }} alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
          <img
            src={profile.profilePhoto || `http://localhost:3000/api/users/${username}/profilephoto`}
            onError={(e) => {
              e.target.onerror = null; // prevent infinite loop
              e.target.src = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';
            }} alt="Profile"
            className="w-40 h-40 rounded-full border-4 border-white object-cover"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-24 text-center px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
        <p className="text-lg text-gray-600 mt-1 dark:text-indigo-300">@{profile.username}</p>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto dark:text-white">{profile.bio}</p>
        <div className="p-4">
          <FollowButton username={username} />
        </div>
      </div>

      <div className="mt-8 bg-white border-t border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <nav className="flex justify-center">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-center border-b-2 text-sm font-medium ${activeTab === 'posts'
              ? 'bg-blue-50 text-blue-600 border-blue-600 dark:bg-gray-700 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
          >
            Posts <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{posts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-6 py-4 text-center border-b-2 text-sm font-medium ${activeTab === 'friends'
              ? 'bg-blue-50 text-blue-600 border-blue-600 dark:bg-gray-700 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
          >
            Friends <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{friends.length}</span>
          </button>
        </nav>
      </div>


      {/* Content */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-8">
          {activeTab === 'posts' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-500 hover:-translate-y-1 dark:border-0 dark:hover:shadow-indigo-800/70 w-full max-w-xs mx-auto"

                  onClick={() => onPostClick(post)}
                >

                  <img
                    src={post.image}
                    alt={`Post ${post.id}`}
                    className="w-full h-64 object-cover" />

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">

                      <div className="flex items-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="w-7 h-7" />
                          <span className="text-sm font-bold">{post.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-7 h-7" />
                          <span className="text-sm font-medium">{getCommentCount(post.id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                  </div>
                </div>
              ))}

              {selectedPost && (
                <PostPopup
                  post={selectedPost}
                  author={profile}

                  onClose={() => {
                    setSelectedPost(null)
                    fetchCommentCounts();
                  }
                  }
                />
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
