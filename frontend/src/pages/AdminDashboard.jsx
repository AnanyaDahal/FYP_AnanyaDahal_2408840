import React from "react";

const AdminDashboard = () => {

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">

      <h1 className="text-3xl font-bold mb-6">
        Admin Dashboard
      </h1>

      <p className="text-gray-400 mb-8">
        Welcome back, {user?.name}
      </p>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="text-3xl mt-2 text-cyan-400">--</p>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-semibold">Total Scans</h2>
          <p className="text-3xl mt-2 text-cyan-400">--</p>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-semibold">Threats Detected</h2>
          <p className="text-3xl mt-2 text-red-400">--</p>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;