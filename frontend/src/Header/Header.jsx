import { Search, Home, Bell, Send, Settings, User, Image, Smile } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // ✅ Correct default import
import { useNotification } from './NotificationContext.jsx';
import logo from "../assets/logo.svg";
import { useChat } from "../Chat/ChatContext.jsx";




const getLoggedInUsername = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    return payload.username; // Make sure you're sending `username` in the token
  } catch (err) {
    console.error("Token decode failed:", err);
    return null;
  }
};



function Header() {
  const [notificationCount, setNotificationCount] = useState(); // or from props/context
  const loggedInUsername = getLoggedInUsername(); // ✅ Get username from token
  const { unreadCount } = useNotification();
  const { unreadChats } = useChat();


  useEffect(() => {
    console.log("🔵 [Header] unreadChats =", unreadChats);
  }, [unreadChats]);






  const fetchNotificationCount = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setNotificationCount(data.count);
    } catch (err) {
      console.error('Failed to fetch notification count', err);
    }
  };


  useEffect(() => {
    fetchNotificationCount();
  }, []);


  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-4 text-black dark:bg-gray-900">
      <div className="flex items-center mb-8">
        <NavLink to="/home" className="flex items-center space-x-2">
          <img src={logo} alt="Gathearly Logo" className="w-8 h-8 rounded-lg" />
          <span className="text-2xl font-bold" style={{ color: "rgba(174, 0, 255, 0.9)" }}
          >
            Gatherly
          </span>
        </NavLink>
      </div>
      <nav className="space-y-4">
        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
            <li>
              <NavLink to="/home" className={({ isActive }) => `flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg 
               hover:dark:text-gray-700 pr-[130px] ${isActive ? "text-indigo-700  dark:text-indigo-300 " : "text-gray-700  dark:text-white "}
              `}>
                <Home className="w-5 h-5" />
                <span>Home</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg  ">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">

            <li>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-white pr-[130px]"}
      flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg hover:dark:text-gray-700`
                }
              >
                <div className="relative">
                  <Send className="w-5 h-5" />
                  {unreadChats > 0 && (
                    <span className="absolute -top-1 -right-7 bg-red-600 text-white text-xs font-bold px-[5px] py-[0.5px] rounded-full">
                      New
                    </span>
                  )}
                </div>


                <span>Chat</span>
              </NavLink>
            </li>

          </ul>
        </div>

        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">

            <li>
              <NavLink to="/explore" className={({ isActive }) => `${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-white pr-[125px]"}
              flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg  hover:dark:text-gray-700`}>
                <Search className="w-5 h-5" />
                <span>Search</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">

            <li>
              <NavLink to="/notify" className={({ isActive }) => `${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-white pr-[80px]"}
              flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg  hover:dark:text-gray-700`}>
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span>Notifications</span>

              </NavLink>
            </li>
          </ul>
        </div>
        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">

            <li>
              <NavLink to="/settings" className={({ isActive }) => `${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-white"}
              flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg  hover:dark:text-gray-700 pr-[115px]`}>
                <Settings className="w-5 h-5" />
                {/* Settings */}
                <span>Settings</span>
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
            <li>
              <NavLink to={loggedInUsername ? `/profile/${loggedInUsername}` : "/login"} className={({ isActive }) => `${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-white pr-[125px]"}
                 flex items-center space-x-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg  hover:dark:text-gray-700`}>
                <User className="w-5 h-5" />
                {/* Profile */}
                <span>Profile</span>
              </NavLink>
            </li>


          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Header;

