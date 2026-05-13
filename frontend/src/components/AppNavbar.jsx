import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { Shield, User, LogOut, ChevronDown } from "lucide-react";

const AppNavbar = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const handleUserUpdate = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      }
    };

    window.addEventListener("userProfileUpdated", handleUserUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleUserUpdate);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");

  return (
    <nav className="h-16 bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-800 px-8 flex items-center justify-between sticky top-0 z-50">
      
      {/* Brand Logo - Left */}
      <Link to={isAdmin ? "/admin-dashboard" : "/dashboard"} className="flex items-center gap-2 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
          <Shield className="text-black fill-current" size={18} />
        </div>
        <span className="text-white text-lg font-black italic tracking-tighter uppercase group-hover:text-cyan-400 transition-colors">
          PHISH<span className="text-cyan-400">GUARD</span>
        </span>
      </Link>

      {/* Middle Links (User / Admin Dynamic Links) */}
      <div className="hidden md:flex items-center gap-2 bg-[#171a22] p-1 rounded-xl border border-gray-800">
        {!isAdmin ? (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-md shadow-cyan-500/10"
                    : "text-gray-400 hover:text-white"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-md shadow-cyan-500/10"
                    : "text-gray-400 hover:text-white"
                }`
              }
            >
              History
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-md shadow-cyan-500/10"
                    : "text-gray-400 hover:text-white"
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-md shadow-cyan-500/10"
                    : "text-gray-400 hover:text-white"
                }`
              }
            >
              Users
            </NavLink>
            <NavLink
              to="/admin/scans"
              className={({ isActive }) =>
                `px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-md shadow-cyan-500/10"
                    : "text-gray-400 hover:text-white"
                }`
              }
            >
              Scans
            </NavLink>
          </>
        )}
      </div>

      {/* Profile Dropdown - Right */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 bg-[#12141c] hover:bg-[#1a1d28] border border-gray-800 p-1.5 pr-3 rounded-full transition-all focus:outline-none"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-cyan-400/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cyan-400 text-black font-extrabold flex items-center justify-center text-xs">
              {userInitial}
            </div>
          )}
          
          <span className="text-xs text-gray-300 font-semibold max-w-[100px] truncate hidden sm:inline">
            {user?.name || "Profile"}
          </span>
          <ChevronDown className={`text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} size={14} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-[#12141c] border border-gray-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-gray-800/60 mb-1.5">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-xs text-white font-bold truncate mt-0.5">{user?.email}</p>
              <p className="inline-block px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-400 font-black text-[9px] uppercase tracking-wider mt-1.5">
                {user?.role || "user"} Account
              </p>
            </div>

            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800/40 rounded-lg transition-all"
            >
              <User size={15} className="text-cyan-400" />
              My Profile
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all mt-1 border-t border-gray-800/40 pt-2"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}
      </div>

    </nav>
  );
};

export default AppNavbar;
