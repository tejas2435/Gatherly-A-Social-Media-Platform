import React, { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Search } from "lucide-react";
import { useChat } from "./ChatContext.jsx";
import { Trash2 } from "lucide-react";


const API_URL = "http://localhost:3000";

export default function Chat() {
  const { socket, setUnreadChats } = useChat();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const messagesRef = useRef(null);


  useEffect(() => {
    document.title = "Chat - Gatherly";
  }, []);

  useEffect(() => {
    if (!socket) return; // 🧠 prevents 'reading on of null'

    const handleConnect = () => console.log("✅ Socket connected:", socket.id);
    const handleDisconnect = () => console.log("❌ Socket disconnected");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  // ✅ Listen for real-time messages (safe)
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      console.log("📩 New message received:", msg);

      setConversations((prev) => {
        const updated = prev.map((c) =>
          Number(c.id) === Number(msg.conversation_id)
            ? {
              ...c,
              last_message: msg.content,
              updated_at: msg.created_at || new Date().toISOString(),
              unread_count:
                selectedChat && Number(selectedChat.id) === Number(c.id)
                  ? 0
                  : (c.unread_count || 0) + 1,
            }
            : c
        );

        const hasUnread = updated.some((c) => (c.unread_count || 0) > 0);
        setUnreadChats(hasUnread ? 1 : 0);

        return [...updated].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
      });

      // If message belongs to open chat → show it
      if (selectedChat && Number(selectedChat.id) === Number(msg.conversation_id)) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [socket, selectedChat, setUnreadChats]);

  // ✅ Scroll to bottom when messages update
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, selectedChat]);

  // ✅ Load conversations initially
  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setConversations(data);
        const hasUnread = data.some((c) => (c.unread_count || 0) > 0);
        setUnreadChats(hasUnread ? 1 : 0);
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
    }
  }

  async function fetchMessages(convoId) {
    try {
      const res = await fetch(`${API_URL}/api/messages/${convoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
      if (socket) socket.emit("joinRoom", String(convoId)); // ✅ guard
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  }

  function selectChat(c) {
    setSelectedChat(c);
    fetchMessages(c.id);
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === c.id ? { ...conv, unread_count: 0 } : conv
      );
      const hasUnread = updated.some((x) => (x.unread_count || 0) > 0);
      setUnreadChats(hasUnread ? 1 : 0);
      return updated;
    });
  }

  async function handleSearch(e) {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    }
  }

  async function startConversation(otherUserId) {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();
      if (data?.id) {
        setConversations((prev) =>
          prev.some((c) => c.id === data.id) ? prev : [data, ...prev]
        );
        setSearch("");
        setSearchResults([]);
        selectChat(data);
      }
    } catch (err) {
      console.error("Start conversation error:", err);
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!msgInput.trim() || !selectedChat) return;

    const newMsg = {
      conversation_id: selectedChat.id,
      sender_id: user.id,
      content: msgInput.trim(),
      created_at: new Date().toISOString(),
    };

    // setMessages((prev) => [...prev, newMsg]);

    if (socket) {
      socket.emit("sendMessage", {
        conversationId: selectedChat.id,
        senderId: user.id,
        text: msgInput.trim(),
      });
    }

    setMsgInput("");
  }

  async function handleDeleteChat(convoId) {
    if (!window.confirm("Delete this entire chat? This cannot be undone.")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/conversations/${convoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = await res.json();
      if (data.success) {
        // Remove deleted chat from UI
        setConversations((prev) => prev.filter((c) => c.id !== convoId));
        setSelectedChat(null);
        setMessages([]);
        console.log("✅ Chat deleted successfully");
      } else {
        console.error("❌ Failed to delete chat:", data.error);
        alert("Failed to delete chat: " + data.error);
      }
    } catch (err) {
      console.error("Delete chat error:", err);
      alert("Something went wrong deleting the chat.");
    }
  }


  return (
    <div className="fixed inset-0 md:left-64 md:right-64 px-4 py-6 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto h-full flex">
        <div className="flex w-full h-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden">
          {/* Sidebar */}
          <div className="hidden md:flex md:w-1/3 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>

            <div className="p-3 flex-shrink-0">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full">
                <Search size={18} className="text-gray-500 dark:text-gray-300" />
                <input
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search users..."
                  className="bg-transparent outline-none ml-2 flex-1 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
              {(searchResults.length > 0 ? searchResults : conversations).map((c) => {
                const isSearch = searchResults.length > 0;
                const id = isSearch ? c.id : c.other_id;
                const name = isSearch ? c.name || c.username : c.other_name;
                const username = isSearch ? c.username : c.other_username;
                const avatar = isSearch
                  ? `${API_URL}/api/users/${username}/profilephoto`
                  : c.other_profile_photo;

                return (
                  <div
                    key={`convo-${id}`}
                    onClick={() => (isSearch ? startConversation(c.id) : selectChat(c))}
                    className={`relative flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition ${selectedChat?.id === c.id ? "bg-gray-100 dark:bg-gray-700" : ""
                      }`}
                  >
                    <img
                      src={
                        avatar ||
                        "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
                      }
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-xs text-gray-500 truncate">@{username}</div>
                    </div>
                    {c.unread_count > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {selectedChat ? (
              <>
                {/* <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <img
                    src={
                      selectedChat.other_profile_photo ||
                      "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
                    }
                    alt={selectedChat.other_name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <div>
                    <div className="font-semibold">{selectedChat.other_name}</div>
                    <div className="text-sm text-gray-500">@{selectedChat.other_username}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteChat(selectedChat.id)}
                    className="text-red-500 hover:text-red-700 transition "
                    title="Delete Chat"
                  >
                    <Trash2 size={20} />
                  </button>
                </div> */}


                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  {/* LEFT SECTION — avatar + username */}
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedChat.other_profile_photo ||
                        "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
                      }
                      alt={selectedChat.other_name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    />
                    <div className="flex flex-col">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedChat.other_name}
                      </div>
                      <div className="text-sm text-gray-500">@{selectedChat.other_username}</div>
                    </div>
                  </div>

                  {/* RIGHT SECTION — delete button */}
                  <button
                    onClick={() => handleDeleteChat(selectedChat.id)}
                    className="text-red-500 hover:text-red-700 transition-colors ml-auto"
                    title="Delete Chat"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>


                <div
                  ref={messagesRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700"
                >
                  {/* {messages.length > 0 ? (
                    messages.map((m, i) => {
                      const isOwn = Number(m.sender_id) === Number(user.id);
                      return (
                        <div key={`msg-${m.id || i}`} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          {!isOwn && (
                            <img
                              src={
                                m.sender_avatar ||
                                "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
                              }
                              alt={m.sender_name}
                              className="w-8 h-8 rounded-full mr-2 object-cover border border-gray-200 dark:border-gray-600"
                            />
                          )}
                          <div
                            className={`p-3 rounded-2xl max-w-[70%] text-sm ${isOwn
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none"
                              }`}
                          >
                            {m.text || m.content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 h-full flex items-center justify-center">
                      No messages yet.
                    </div>
                  )} */}

                  {messages.length > 0 ? (
                    messages.map((m, i) => {
                      const isOwn = Number(m.sender_id) === Number(user.id);

                      // 🕒 Format date & time — e.g. "2 Jun, 3:45 PM"
                      const messageDate = new Date(m.created_at);
                      const formattedTime = messageDate.toLocaleString("en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }); // Output: "2 Jun, 3:45 PM"

                      return (
                        <div
                          key={`msg-${m.id || i}`}
                          className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                        >
                          {/* Message bubble */}
                          <div className={`flex ${isOwn ? "justify-end" : "justify-start"} w-full`}>
                            {!isOwn && (
                              <img
                                src={
                                  m.sender_avatar ||
                                  "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
                                }
                                alt={m.sender_name}
                                className="w-8 h-8 rounded-full mr-2 object-cover border border-gray-200 dark:border-gray-600"
                              />
                            )}
                            <div
                              className={`p-3 rounded-2xl max-w-[70%] text-sm ${isOwn
                                  ? "bg-blue-500 text-white rounded-br-none"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none"
                                }`}
                            >
                              {m.text || m.content}
                            </div>
                          </div>

                          {/* 🕒 Timestamp below bubble */}
                          <span
                            className={`text-xs mt-1 ${isOwn ? "text-right text-gray-500" : "text-gray-500"
                              }`}
                          >
                            {formattedTime}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 h-full flex items-center justify-center">
                      No messages yet.
                    </div>
                  )}

                </div>

                <form onSubmit={sendMessage} className="p-3 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <input
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition">
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={48} className="mb-4" />
                <p>Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
