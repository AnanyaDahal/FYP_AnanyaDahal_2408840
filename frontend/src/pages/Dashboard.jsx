import React, { useState } from "react";

const Dashboard = () => {
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Email: ${email}\nURL: ${url}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#121212] p-8 rounded-2xl shadow-2xl">
        <h2 className="text-white text-2xl font-bold mb-6">Enter Details</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            required
          />
          <input
            type="url"
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            required
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold transform active:scale-[0.98] transition-all shadow-lg shadow-cyan-400/20"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
