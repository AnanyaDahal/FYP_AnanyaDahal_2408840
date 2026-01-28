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
    <div className="sidebar">
      <h1 className="logo">PhishingDetector</h1>
      <ul>
        {menu.map((item) => (
          <li key={item.name} className={location.pathname === item.path ? "active" : ""}>
            <Link to={item.path}>{item.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
