import React, { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

const CommentPopup = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [user, setUser] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);

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

        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await fetch('http://localhost:3000/api/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error("Failed to load profile:", err);
            }
        };

        fetchComments();
        fetchProfile();
    }, [post.id]);

    const handleCommentSubmit = async () => {
        const token = localStorage.getItem("token");
        if (!commentText.trim()) return;

        try {
            const res = await fetch(`http://localhost:3000/api/posts/${post.id}/comment`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: commentText })
            });

            const newComment = await res.json();
            setComments(prev => [newComment, ...prev]);
            setCommentText('');
            onCommentAdded();
        } catch (err) {
            console.error("Failed to post comment:", err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="absolute inset-0" onClick={handleClose}></div>

            <div
                className={`bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl w-full max-w-lg mx-auto
                            transition-all duration-300
                            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                            relative z-10 max-h-[70vh] flex flex-col`}
            >
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-600">
                    <h2 className="text-lg font-semibold dark:text-white">Comments</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-red-500">
                        <X />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center text-gray-500">
                            <MessageCircle className="w-10 h-10 mx-auto mb-2" />
                            No comments yet.
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <img
                                    src={comment.avatar || "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"}
                                    alt="User"
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium dark:text-gray-200">
                                        <span>{comment.username}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-300">{formatDate(comment.timestamp)}</span>
                                    </div>
                                    <p className="text-sm dark:text-gray-200">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t dark:border-gray-600 flex items-center gap-3">
                    <img
                        src={user?.profile_photo || "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"}
                        alt="Me"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                        placeholder="Add a comment..."
                        className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm outline-none dark:text-gray-200"
                    />
                    <button
                        onClick={handleCommentSubmit}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-full transition"
                    >Post</button>
                </div>
            </div>
        </div>
    );
};

export default CommentPopup;
