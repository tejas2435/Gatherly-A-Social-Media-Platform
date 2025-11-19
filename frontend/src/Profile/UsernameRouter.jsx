import { useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Profile from "./Profile";
import ProfilePage from "./ProfilePage";

export default function UsernameRouter() {
  const { username } = useParams();
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const loggedInUsername = decoded?.username;

  if (!username || !loggedInUsername) {
    return <Navigate to="/login" />;
  }

  return username === loggedInUsername ? <Profile /> : <ProfilePage />;
}

const getLoggedInUsername = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    return payload.username;
  } catch (err) {
    console.error("Token decode failed:", err);
    return null;
  }
};