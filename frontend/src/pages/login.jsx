import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError(""); 


    if (formData.email === "admin@test.com" && formData.password === "password123") {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password. Try admin@test.com / password123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-4">
      <div className="w-full max-w-[400px] bg-[#121212] p-8 rounded-2xl shadow-2xl border border-gray-800">
        
        <header className="mb-8">
          <h2 className="text-white text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Enter your credentials to access your account</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold transform active:scale-[0.98] transition-all shadow-lg shadow-cyan-400/20"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-400">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;