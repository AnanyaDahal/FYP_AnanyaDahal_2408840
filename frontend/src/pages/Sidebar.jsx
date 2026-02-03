import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login"; // Force refresh to clear states
  };

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "History", path: "/history" },
  ];

  return (
    <aside className="w-64 bg-[#121212] p-6 flex flex-col border-r border-gray-800">
      <h1 className="text-cyan-400 text-xl font-bold mb-10 tracking-tight">
        PhishingDetector
      </h1>

      <ul className="space-y-4 flex-1">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-cyan-400/10 text-cyan-400 font-semibold border-l-2 border-cyan-400"
                    : "text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50"
                }`}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="pt-6 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;