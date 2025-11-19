import { useState } from 'react'
import React from 'react'
import { Outlet } from "react-router-dom";
import { ScrollRestoration } from 'react-router-dom';

import Header from './Header/Header'
import Footer from './Footer/Footer'

function Layout() {
  const [count, setCount] = useState(0)

  console.log("✅ Layout Component Loaded");  // Debugging Log

  return (
    <>

      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Left Sidebar */}
        <div className="w-64 fixed left-0 top-0 h-full bg-white shadow-lg dark:bg-gray-900 z-20">
          <Header />
        </div>

        {/* Right Sidebar */}
        <div className="w-64 fixed right-0 top-0 h-full bg-white shadow-lg dark:bg-gray-900 z-20">
          <Footer />
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 mr-64 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
            <ScrollRestoration />
          </div>
        </div>

      </div>
    </>
  )
}

export default Layout
