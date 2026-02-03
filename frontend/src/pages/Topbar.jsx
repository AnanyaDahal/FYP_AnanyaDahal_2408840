import React from "react";

const Topbar = ({ user }) => {
  return (
    <header className="h-16 bg-[#1e1e1e] flex items-center justify-end px-6 text-white">
      <div className="text-right mr-4">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>

      <div className="w-9 h-9 rounded-full bg-cyan-400 flex items-center justify-center font-bold text-black">
        {user.name[0]}
      </div>
    </header>
  );
};

export default Topbar;
