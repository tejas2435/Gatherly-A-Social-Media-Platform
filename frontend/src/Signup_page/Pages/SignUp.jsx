import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Facebook, AtSign, Eye, EyeOff } from 'lucide-react';
import PhotoScrollBackground from './PhotoScrollBg';
import logo from "../../assets/logo.svg";


const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate(); 


  useEffect(() => {
    document.title = "SignUp - Gatherly";
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .toast {
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg,rgb(255, 47, 96),rgb(195, 22, 253)); /* Vibrant gradient */
    color: white;
    padding: 16px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.4s ease, transform 0.4s ease;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
    `;
    document.head.appendChild(style);
  }, []);

  const showToast = (message, duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 500);
    }, duration);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }) 
      });

      const data = await res.json();


      if (res.ok) {
        showToast('Signup successful! Please Login Now ✅');
        setTimeout(() => navigate('/login'), 2000); 
      } else {
        showToast(data.message || 'Signup failed');
        console.error('Signup error:', data);
      }
    } catch (error) {
      showToast('An error occurred. Please try again.');
      console.error('Network/Server error:', error);
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

      <PhotoScrollBackground />

      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">

        <div className="text-center mb-8">
          <h2 className="flex flex-col items-center text-center font-bold text-gray-800">
            <img src={logo} alt="Gathearly Logo" className="w-16 h-16 mb-3 rounded-lg" />
            <span className="text-4xl">Create Account</span>
          </h2>

          <p className="text-gray-600 mt-2">Welcome to <span className="text-m font-bold" style={{ color: "rgba(180, 61, 236, 0.9)" }}> Gatherly</span> !!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

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

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transform hover:scale-[1.02] transition-all duration-300 shadow-lg"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
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
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;