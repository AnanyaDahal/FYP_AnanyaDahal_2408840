import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // 🔐 later connect to backend
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2c2c2c] to-[#3d3d3d] px-4">
      <div className="w-full max-w-[400px] bg-[#141414] p-8 rounded-2xl shadow-2xl border border-gray-800">
        
        <header className="mb-8">
          <h2 className="text-white text-3xl font-bold">Create Account</h2>
          <p className="text-gray-400 mt-2">
            Sign up to get started
          </p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
            required
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold transform active:scale-[0.98] transition-all shadow-lg shadow-cyan-400/20"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
