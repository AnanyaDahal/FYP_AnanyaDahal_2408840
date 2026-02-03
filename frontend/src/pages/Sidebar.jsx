import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "History", path: "/history" },
    { name: "Report", path: "/report" },
  ];

  return (
    <aside className="w-56 bg-[#121212] p-6 flex flex-col">
      <h1 className="text-cyan-400 text-xl font-bold mb-10">
        PhishingDetector
      </h1>

      <ul className="space-y-5">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`block text-sm transition ${
                  isActive
                    ? "text-cyan-400 font-semibold"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
