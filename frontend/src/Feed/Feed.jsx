
import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share, Bookmark, Image, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import CommentPopup from './CommentPopup'; // adjust path if needed




function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    document.title = "Home - Gatherly";
  }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, []);



  const handlePost = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
      setPreviewUrl(null);
    }

    try {
      const token = localStorage.getItem('token');

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
      setProfileData(profileData);

      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const result = await response.json();
      console.log(result);
      onPostCreated(); // only pass the post object, not wrapper
      setContent('');
      setImage(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 dark:bg-gray-600">
      <div className="flex items-start space-x-4">
        <img
          src={
            profileData.profile_photo ||
            'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
          }
          alt="Profile"
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full border-none focus:ring-0 resize-none h-20 dark:bg-gray-600"
          />

          {previewUrl && (
            <div className="mt-4 pb-2 relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 rounded-lg object-contain border border-gray-300 dark:border-gray-700"
              />

              {/* 🗑️ Delete button */}
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition shadow-md"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-4">
              <label className="cursor-pointer text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-500">
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-500">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handlePost}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Post
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function Post({ post, commentCounts, refreshCommentCounts, onCommentClick }) {
  const author = post.user || {};
  const profilePhoto = author.profile_photo
    ? author.profile_photo
    : 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';
  const name = author.name || "Anonymous";
  const username = author.username || "unknown_user";
  const [likes, setLikes] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(post.isLiked || false); // `post.isLiked` should come from backend
  // const [commentCounts, setCommentCounts] = useState({});



  const fetchCommentCounts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/commentcount');
      const data = await res.json();
      // setCommentCounts(data); // [{ post_id: 1, comment_count: "3" }, ...]
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

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.liked) {
        setLikes((prev) => prev + 1);
        setIsLiked(true);
      } else {
        setLikes((prev) => Math.max(prev - 1, 0));
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Failed to like/unlike:', error);
    }
  };


  const fetchComments = async () => {
    const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comments`);
    const data = await res.json();
    setComments(data);
  };



  const formatDate = (dateString) => {
    try {
      // console.log("Raw input to formatDate:", dateString);

      if (!dateString) return 'Unknown time';

      // If the string already has "T" and ends with "Z", it's likely ISO UTC — so use it directly
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        //   console.warn("Invalid date parsed:", dateString);
        return 'Invalid time';
      }

      const formatted = date.toLocaleString('en-IN', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });

      // console.log("Formatted date:", formatted);
      return formatted;
    } catch (err) {
      console.error("Error in formatDate:", err);
      return 'Error formatting time';
    }
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };
  const handleCommentSubmit = async () => {
    if (commentText) return;
    const token = localStorage.getItem('token');

    await fetch(`http://localhost:3000/api/posts/${post.id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: commentText })
    });

    setCommentText('');
    fetchComments();
  };



  return (
    <div className="bg-white rounded-xl shadow-sm mb-6 dark:bg-gray-600">
      <div className="p-4">
        <Link to={`/profile/${username}`} className="flex items-center space-x-3">
          <img src={profilePhoto}
            alt="Profile" className="w-10 h-10 rounded-full" />
          <div>
            <div className="font-semibold dark:text-white">{name || 'Anonymous'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">
              @{username} · {formatDate(post.timestamp)}
            </div>
          </div>
        </Link>
        <p className="mt-3 dark:text-white">{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="mt-3 w-full rounded-lg"
          />
        )}
        <div className="mt-4 flex items-center justify-between pt-3 border-t">
          <div className="flex space-x-6 ">
            <button onClick={handleLike} className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500 dark:text-gray-200'}`}>
              {isLiked ? <Heart fill="currentColor" className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
              <span>{likes}</span>
            </button>
            <button
              onClick={onCommentClick}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 dark:text-gray-200 dark:hover:text-blue-500"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{getCommentCount(post.id)}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 dark:text-gray-200">
              <Share className="w-5 h-5" />
              <span>{post.shares || 0}</span>
            </button>
          </div>
          <button className="text-gray-500 hover:text-indigo-600 dark:text-gray-200">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>



    </div>

  );
}




function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [commentCounts, setCommentCounts] = useState([]);

  useEffect(() => {
    if (activePost) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup if component unmounts while popup is open
    return () => document.body.classList.remove('overflow-hidden');
  }, [activePost]);



  const fetchPosts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/api/posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
      console.log(data);

    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };



  const handlePostCreated = (newPost) => {
    fetchPosts(); // re-fetch the entire feed from server

  };

  useEffect(() => {
    fetchPosts();
  }, []);


  const fetchCommentCounts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/commentcount');
      const data = await res.json();
      setCommentCounts(data);
    } catch (err) {
      console.error('Failed to fetch comment counts:', err);
    }
  };

  useEffect(() => {
    fetchCommentCounts();
  }, []);

  const handleCommentAdded = () => {
    fetchCommentCounts();  // Refresh counts globally
  };



  return (
    <div className="min-h-screen bg-gray-50 flex justify-center dark:bg-gray-900">
      <main className="w-full px-4 py-8 max-w-2xl">
        <CreatePost onPostCreated={handlePostCreated} />
        {/* {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <p>{error}</p>
        ) : posts.length === 0 ? (
          <p>No posts yet. Be the first to post!</p>
        )  */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium animate-pulse">
              Loading posts...
            </p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">
              {error}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No posts yet. Be the first to post!
            </p>
          </div>
        )
          : (
            posts.map((post) => <Post key={post.id} post={post} commentCounts={commentCounts} refreshCommentCounts={fetchCommentCounts} onCommentClick={() => setActivePost(post)} />)
          )}
      </main>
      {activePost && (

        <CommentPopup
          post={activePost}
          onClose={() => {
            setActivePost(null);
            fetchCommentCounts();
          }}
        />
      )}

    </div>
  );
}

export default Feed;
