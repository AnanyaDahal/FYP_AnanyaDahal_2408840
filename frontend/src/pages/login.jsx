import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { buildApiUrl } from "../config/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log("Login response:", data);

      if (response.ok) {
        // Store user data/token for session management
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token); // Common practice to store JWT

        // Redirect to dashboard
        // navigate("/dashboard");
        if (data.user.role === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate("/dashboard");
          }
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2c2c2c] to-[#3d3d3d] px-4">
      <div className="w-full max-w-[400px] bg-[#141414] p-8 rounded-2xl shadow-2xl border border-gray-800">
        
        {/* Header Section */}
        <header className="mb-8 text-center">
          <h2 className="text-white text-3xl font-bold italic tracking-tighter uppercase">
            Welcome Back
          </h2>
          <p className="text-gray-400 mt-2">Enter your credentials to access your account</p>
        </header>

        {/* Error Message Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-xs p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white outline-none focus:ring-2 focus:ring-cyan-400 pr-12 transition-all"
              required
            />
            {/* Password Visibility Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-cyan-400 transition-colors"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all active:scale-95 shadow-lg shadow-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-cyan-400 hover:underline font-bold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;