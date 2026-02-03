import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Dashboard = () => {
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Email: ${email}\nURL: ${url}`);
  };

  const user = {
    name: "Ananya Dahal",
    email: "ananyadahal@gmail.com",
  };

  return (
    <div className="flex min-h-screen bg-[#0f2027]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar user={user} />

        <main className="flex-1 p-10">
          <div className="bg-[#121212] max-w-lg p-8 rounded-2xl shadow-2xl">
            <h2 className="text-white text-2xl font-semibold mb-6">
              Enter Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 outline-none"
                required
              />

              <input
                type="url"
                placeholder="Enter URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 outline-none"
                required
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold transition shadow-lg shadow-cyan-400/20"
              >
                Submit
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
