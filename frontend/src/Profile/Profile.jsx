
import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Trash2,
  Edit3,
  X,
  Camera,
  Save,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import FriendsList from './FriendsList';
import PostPopup from './PostPopup';


function Profile() {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: '',
    profilePhoto: '',
    coverPhoto: '',
    profilePhotoFile: null,
    coverPhotoFile: null,
  });
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const profilePhotoInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
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

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleClosePopup = () => {
    setSelectedPost(null);
  };



  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    } else {
      console.error('No valid token found');
    }
  }, []);

  const fetchUserData = async (token) => {
    try {

      // Fetching profile data
      const profileResponse = await fetch('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        console.error('Failed to fetch profile:', profileResponse.statusText);
        return;
      }

      const profileData = await profileResponse.json();
      setProfile(profileData);

      // Fetching posts data
      const postsResponse = await fetch(`http://localhost:3000/api/posts/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!postsResponse.ok) {
        throw new Error('Failed to fetch posts');
      }

      const postsData = await postsResponse.json();
      setPosts(postsData);

      // Fetching following users (friends)
      const friendsResponse = await fetch(`http://localhost:3000/api/friends/by-username/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!friendsResponse.ok) {
        throw new Error('Failed to fetch friends');
      }
      console.log(friendsResponse);
      const friendsData = await friendsResponse.json();
      console.log(friendsData);
      setFriends(friendsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({
        ...prev,
        [type]: reader.result,
        [`${type}File`]: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const onPostClick = (post) => {
    console.log('Post clicked:', post);

    setSelectedPost(post);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();

    // Append profile data
    formData.append('name', profile.name || '');
    formData.append('username', profile.username || '');
    formData.append('bio', profile.bio || '');

    // Append files if selected
    if (profile.profilePhotoFile) {
      formData.append('profilePhoto', profile.profilePhotoFile);
    }
    if (profile.coverPhotoFile) {
      formData.append('coverPhoto', profile.coverPhotoFile);
    }

    try {
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type here, let the browser handle it
        },
        body: formData,
      });

      if (!response.ok) {
        const errorResponse = await response.text();
        console.error('Error response from server:', errorResponse);
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      console.log("Updated Profile:", updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };


  const handleDeletePost = async () => {
    if (!postToDelete) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${postToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete post");
      }

      setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postToDelete.id));
      setShowDeletePopup(false);
      setPostToDelete(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Could not delete the post.");
    }
  };




  const renderImage = (image, fallback, altText) => {
    return image ? (image.startsWith('data:image') ? image : `data:image/jpeg;base64,${image}`) : fallback;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Photo */}
      <div className="relative h-80 bg-gray-300 dark:bg-gray-900">
        <img
          src={renderImage(profile.cover_photo, 'https://i.postimg.cc/5tnWjn6B/JShine.png', 'Cover')}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
          <img
            src={renderImage(profile.profile_photo, 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg', 'Profile')}
            alt="Profile"
            className="w-40 h-40 rounded-full border-4 border-white object-cover"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-24 text-center px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
        <p className="text-lg text-gray-600 mt-1 dark:text-indigo-300">@{profile.username}</p>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto dark:text-white">{profile.bio}</p>
        <button
          onClick={() => setIsEditing(true)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-600 dark:text-white"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </button>
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


      {/* Tab Content */}
      <div className="mt-6">
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-500 hover:-translate-y-1 dark:border-0 dark:hover:shadow-indigo-800/70 w-full max-w-xs mx-auto"

                onClick={() => onPostClick(post)}
              >
                {post.image ? (
                  <div>
                    <img src={post.image}
                      alt={`Post ${post.id}`}
                      className="w-full h-64 object-cover" />
                  </div>
                ) : (
                  <p className="text-center p-4 text-gray-500 dark:text-white">No image available</p>
                )}

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
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div
                    className="bg-black rounded-full p-3 cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostToDelete(post);
                      setShowDeletePopup(true);
                    }}
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* ✅ PostPopup should go here — outside the post grid but inside the return block */}
        {selectedPost && (
          <PostPopup
            post={selectedPost}
            author={profile} // 👈 pass the full profile object

            onClose={() => {
              setSelectedPost(null)
              fetchCommentCounts();
            }}

          />
        )}

        {showDeletePopup && postToDelete && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Delete Post</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeletePopup(false);
                    setPostToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={async () => {
                    await handleDeletePost(postToDelete.id);
                    setShowDeletePopup(false);
                    setPostToDelete(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 gap-6 p-4">
            <FriendsList username={username} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {
        isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Profile Picture</label>
                    <div className="mt-1 flex items-center">
                      <img
                        src={
                          profile.profilePhoto || profile.profile_photo ||
                          'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
                        } alt="Profile Preview"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={profilePhotoInputRef}
                        onChange={(e) => handleImageChange(e, "profilePhoto")}
                      />
                      <button
                        type="button"
                        onClick={() => profilePhotoInputRef.current.click()}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Cover Photo</label>
                    <div className="mt-1 flex items-center">
                      <img
                        src={
                          profile.coverPhoto || profile.cover_photo ||
                          'https://i.postimg.cc/5tnWjn6B/JShine.png'
                        } alt="Cover Preview"
                        className="h-20 w-32 object-cover rounded"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={coverPhotoInputRef}
                        onChange={(e) => handleImageChange(e, "coverPhoto")}
                      />
                      <button
                        type="button"
                        onClick={() => coverPhotoInputRef.current.click()}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="mt-1 block w-full rounded-md  px-1 py-2  border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Username</label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="mt-1 block w-full rounded-md px-1 py-2  border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md  px-1 py-2  border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter your profile bio..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setIsEditing(false)} className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default Profile;
