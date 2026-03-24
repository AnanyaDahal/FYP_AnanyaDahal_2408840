import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin-dashboard", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/scans", label: "Scans" },
];

const AdminNav = () => {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg border transition-all ${
              isActive
                ? "border-cyan-400 bg-cyan-400 text-black"
                : "border-gray-700 text-gray-300 hover:border-cyan-500 hover:text-cyan-400"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
};

export default AdminNav;