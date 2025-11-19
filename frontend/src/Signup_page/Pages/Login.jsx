import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Mail, Lock, Github, Eye, EyeOff, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PhotoScrollBackground from './PhotoScrollBg';
import { useNotification } from '../../Header/NotificationContext.jsx';
import logo from "../../assets/logo.svg";




const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Add this at the top with other states
  const { fetchUnreadCount } = useNotification();




  useEffect(() => {
    document.title = "Login - Gatherly";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // ✅ Store token
        localStorage.setItem('token', data.token);

        window.dispatchEvent(new Event("storage"));

        // ✅ Store user object for later use
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // fallback: decode from token if backend doesn’t send user
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          localStorage.setItem('user', JSON.stringify({ id: payload.id }));
        }

        fetchUnreadCount();

        // ✅ Simulate loading and redirect
        setTimeout(() => {
          setIsLoading(false);
          navigate('/home');
        }, 1500);
      } else {
        setIsLoading(false);
        setMessageType('error');
        setMessage(data.message || 'Login failed.');
      }
    } catch (err) {
      setIsLoading(false);
      setMessageType('error');
      setMessage('Something went wrong.');
      console.error('Login error:', err);
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

      <PhotoScrollBackground />

      <div className="bg-white  rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div>
            <div className="flex flex-col items-center">
              <img src={logo} alt="Gathearly Logo" className="w-16 h-16 mb-3 rounded-lg" />
            </div>
            <p className="text-3xl font-bold" style={{ color: "rgba(180, 61, 236, 0.9)" }}>Gatherly</p></div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-gray-600 mt-2">Please  login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-purple-600 hover:text-purple-800 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-500">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            // className={`w-full bg-purple-600 text-white py-2 px-4 rounded-lg transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
            className={`w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transform hover:scale-[1.02] transition-all duration-300 shadow-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}

          >
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        {message && (
          <p className={`text-sm mt-4 ${messageType === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}


        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="ml-2">Facebook</span>
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <AtSign className="h-5 w-5" />
              <span className="ml-2">Google</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
            Sign up
          </Link>
        </p>
      </div>

    </div>
  );
};

export default Login;
