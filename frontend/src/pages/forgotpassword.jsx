import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Reset link sent! Please check your email inbox.");
        setEmail(""); // Clear the input on success
      } else {
        setError(data.message || "Something went wrong. Please try again.");
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
        
        {/* Header */}
        <header className="mb-8 text-center">
          <h2 className="text-white text-3xl font-bold italic tracking-tighter uppercase">Reset Password</h2>
          <p className="text-gray-400 mt-2">No worries, we'll send you reset instructions.</p>
        </header>

        {/* Success/Error Alerts */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all active:scale-95 shadow-lg shadow-cyan-400/20"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;