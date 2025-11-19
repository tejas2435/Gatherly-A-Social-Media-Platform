import React, { useEffect, useState, useRef } from 'react';
import { X, Heart, MessageCircle, Share2, MapPin, Clock, Tag } from 'lucide-react';
import { useParams } from 'react-router-dom';


const PostPopup = ({ post, author, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [liked, setLiked] = useState(false);
    const [imageAspectRatio, setImageAspectRatio] = useState('landscape');
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [likesCount, setLikesCount] = useState(post.likes || 0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [popupHeight, setPopupHeight] = useState(400); // set a min height

    useEffect(() => {
        if (post?.image) {
            const img = new Image();
            img.src = post.image;
            img.onload = () => {
                const height = Math.max(400, img.height); // set minimum 400px
                const max = window.innerHeight * 0.95; // cap at 95% of screen
                setPopupHeight(Math.min(height, max));
            };
        }
    }, [post]);

    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden'; // Disable background scroll
        } else {
            document.body.style.overflow = 'auto';   // Re-enable scroll when closed
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isVisible]);


    useEffect(() => {
        if (post) {
            setIsVisible(true);
            // Detect image aspect ratio
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                setImageAspectRatio(ratio > 1 ? 'landscape' : 'portrait');
            };
            img.src = post.image;
        } else {
            setIsVisible(false);
        }
    }, [post]);

    useEffect(() => {
        const checkLiked = async () => {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/api/posts/${post.id}/liked`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setLiked(data.liked);
        };
        checkLiked();

        const fetchComments = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setComments(data);
            } catch (err) {
                console.error("Failed to fetch comments:", err);
            }
        };
        fetchComments();

    }, [post.id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comment`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newComment })
            });

            const data = await res.json();
            setComments(prev => [...prev, data]);
            setNewComment('');
        } catch (err) {
            console.error("Error posting comment:", err);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleLikeToggle = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:3000/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setLiked(data.liked);
            setLikesCount((prev) => data.liked ? prev + 1 : prev - 1);
        } catch (err) {
            console.error("Failed to like/unlike:", err);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
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

                const data = await profileResponse.json();
                setLoggedInUser(data);  // data should include name, username, profile
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    // const handleSubmitComment = async () => {
    //     if (!newComment.trim()) return;
    //     const token = localStorage.getItem("token");

    //     try {
    //         const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comment`, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ content: newComment }),
    //         });

    //         const data = await res.json();
    //         if (res.ok) {
    //             setComments(prev => [...prev, data]);  // assuming API returns the new comment
    //             setNewComment('');
    //         } else {
    //             console.error("Failed to add comment:", data.error);
    //         }
    //     } catch (err) {
    //         console.error("Comment error:", err);
    //     }
    // };



    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // const detectAspectRatio = () => {
    //     const img = new Image();
    //     img.src = post.image;
    //     img.onload = () => {
    //         const ratio = img.height / img.width;
    //         setImageAspectRatio(ratio > 1 ? 'portrait' : 'landscape');
    //     };
    // };


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
                timeZone: 'Asia/Kolkata',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            // console.log("Formatted date:", formatted);
            return formatted;
        } catch (err) {
            console.error("Error in formatDate:", err);
            return 'Error formatting time';
        }
    };



    useEffect(() => {
        console.log("Post timestamp:", post?.created_at);
    }, [post]);



    if (!post) return null;

    return (

        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Popup Container */}
            <div className={`relative h-full flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'scale-100' : 'scale-95'} dark:bg-white/10`}>
                <div
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl shadow-2xl max-w-7xl w-full overflow-hidden"
                    style={{ height: popupHeight }}
                >


                    {/* Layout */}
                    <div className={`flex h-full ${imageAspectRatio === 'portrait' ? 'flex-col xl:flex-row' : 'flex-col lg:flex-row'}`}>

                        {/* Image Section */}


                        <div
                            className={`relative flex items-center justify-center 
                            ${imageAspectRatio === 'portrait' ? 'xl:w-2/5 h-64 xl:h-full' : 'lg:w-3/5 h-64 lg:h-full'}
                            bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
                            from-white via-gray-200 to-gray-300 
                            dark:from-gray-700 dark:via-gray-800 dark:to-gray-900`}
                        >

                            <img
                                src={post.image}
                                alt="Post"
                                className="object-contain max-w-full max-h-full"
                            />

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>


                        </div>

                        {/* Content Section */}
                        {/* Right Section */}
                        <div className={`${imageAspectRatio === 'portrait' ? 'xl:w-3/5' : 'lg:w-2/5'} flex flex-col max-h-[calc(100vh-40px)]`}>

                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-400 flex-shrink-0">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={author?.profile_photo || "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"}
                                        alt={author?.username}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="font-semibold">{author?.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">@{author?.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>{post?.created_at ? formatDate(post.created_at) : 'No timestamp'}</span>
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-400 flex-shrink-0">
                                <p className="leading-relaxed mb-4">{post.content}</p>

                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={handleLikeToggle}
                                        className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500 dark:text-gray-200'}`}
                                    >
                                        <Heart className={`w-5 h-5 transition-transform duration-200 ${liked ? 'fill-current' : 'fill-transparent'}`} />
                                        <span className="font-semibold">{likesCount}</span>
                                    </button>

                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="font-semibold">{comments.length}</span>
                                    </div>

                                    <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
                                        <Share2 className="w-5 h-5" />
                                        <span className="font-semibold">Share</span>
                                    </button>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                <h4 className="font-semibold text-gray-900 mb-4 dark:text-white">
                                    Comments ({comments.length})
                                </h4>

                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <img
                                                src={comment.avatar}
                                                alt={comment.username}
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="bg-gray-50 rounded-xl p-3 dark:bg-gray-600">
                                                    <div className="flex items-center gap-2 mb-1 ">
                                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                            {comment.username}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(comment.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-white">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {comments.length === 0 && (
                                        <div className="text-center py-8">
                                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 dark:text-gray-200">No comments yet. Be the first to comment!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Comment Input */}

                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <form onSubmit={handleCommentSubmit} className="flex items-start gap-3">
                                    <img
                                        src={loggedInUser?.profile_photo || "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"}
                                        alt="You"
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                    />
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        disabled={isSubmitting}
                                        className="flex-1 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-blue-500 text-white hover:bg-blue-600 font-medium text-sm mt-2  whitespace-nowrap px-4 py-1 rounded-full "
                                    >
                                        Post
                                    </button>
                                </form>
                            </div>
                        </div>




                    </div>
                </div>
            </div>
        </div>




    );
};

export default PostPopup;