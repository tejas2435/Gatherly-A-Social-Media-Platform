// ChatContext.jsx
import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState } from "react";

const ChatContext = createContext();
const API_URL = "http://localhost:3000";

export function ChatProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // 🧠 Detect token changes (login/logout)
  useEffect(() => {
    const handleStorage = () => {
      const newToken = localStorage.getItem("token");
      console.log("🧠 [ChatContext] Storage event fired! New token =", newToken);
      setToken(newToken);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 🌐 Initialize socket connection
  useEffect(() => {
    if (socket) return;

    console.log("🌐 [ChatContext] Initializing socket connection...");
    const newSocket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ [ChatContext] Connected to socket:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("🔴 [ChatContext] Socket disconnected:", reason);
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 [ChatContext] Cleaning up socket...");
      newSocket.disconnect();
    };
  }, []);

  // 💬 Function to check unread chats
  async function fetchUnread() {
    if (!token) return;
    try {
      // console.log("💬 [ChatContext] Fetching unread chats...");
      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const hasUnread = data.some((c) => (c.unread_count || 0) > 0);
        setUnreadChats(hasUnread ? 1 : 0);
        // console.log("📦 [ChatContext] Unread result =", hasUnread);
      } else {
        console.warn("⚠️ [ChatContext] Unexpected unread data:", data);
      }
    } catch (err) {
      console.error("❌ [ChatContext] Failed to fetch unread chats:", err);
    }
  }

  // 🔁 Check unread messages every 5 seconds (global)
  useEffect(() => {
    if (!token) return;
    console.log("⏱️ [ChatContext] Starting unread message polling...");
    fetchUnread(); // initial check

    const interval = setInterval(fetchUnread, 5000);

    return () => {
      clearInterval(interval);
      console.log("🧹 [ChatContext] Stopped unread polling");
    };
  }, [token]);

  return (
    <ChatContext.Provider value={{ socket, unreadChats, setUnreadChats }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
