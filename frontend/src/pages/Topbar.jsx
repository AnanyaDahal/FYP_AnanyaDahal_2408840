import React from "react";

const Topbar = ({ user }) => {
  // Extract the first letter of the email and make it uppercase
  const emailInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="h-16 bg-[#1e1e1e] flex items-center justify-end px-8 text-white border-b border-gray-800">
      <div className="text-right mr-4">
        {/* Removed "Guest" - only showing the email now */}
        <p className="text-sm font-medium text-cyan-400">{user?.email || "Loading..."}</p>
      </div>

      <div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center font-bold text-black uppercase shadow-lg shadow-cyan-400/20">
        {/* Displays the first letter of the email address */}
        {emailInitial}
      </div>
    </header>
  );
};

export default Topbar;