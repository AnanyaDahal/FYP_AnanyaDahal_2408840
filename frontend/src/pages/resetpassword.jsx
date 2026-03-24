import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { buildApiUrl } from "../config/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl(`/api/auth/reset-password/${token}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Your password has been reset successfully. Redirecting to login...");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Unable to reset password. Please check your link or try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2c2c2c] to-[#3d3d3d] px-4">
      <div className="w-full max-w-[430px] bg-[#141414] p-8 rounded-2xl shadow-2xl border border-gray-800">

        <header className="mb-8 text-center">
          <h2 className="text-white text-3xl font-bold italic tracking-tighter uppercase">Reset Your Password</h2>
          <p className="text-gray-400 mt-2">Set a new password for your account.</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-xs p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-cyan-500/10 border border-cyan-500 text-cyan-400 text-xs p-3 rounded-lg mb-6 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-cyan-400"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 text-gray-500 hover:text-cyan-400"
            >
              {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all active:scale-95 shadow-lg shadow-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
