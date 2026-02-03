import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const validateForm = () => {
    // 1. Name Validation (Letters and spaces only)
    if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      return "Invalid name: Only letters and spaces are allowed.";
    }

    // 2. Email Validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    // 3. Password Complexity (1 upper, 1 number, 1 special, min 8 chars)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return "Password must include 1 uppercase letter, 1 number, 1 special character, and be at least 8 characters long.";
    }

    // 4. Match Validation
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        navigate("/login");
      } else {
        // This will catch "Email already in use" from backend
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Server unreachable. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-[400px] bg-[#141414] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <header className="mb-6 text-center">
          <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter">Join Us</h2>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-4 rounded-xl mb-6 leading-relaxed">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input name="name" type="text" placeholder="Full Name" onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-700 text-white outline-none focus:ring-2 focus:ring-cyan-400" required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-800 text-white focus:ring-2 focus:ring-cyan-400" required />
          
          <div className="relative">
            <input name="password" type={showPass ? "text" : "password"} placeholder="Password" onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-800 text-white focus:ring-2 focus:ring-cyan-400 pr-12" required />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-500 hover:text-cyan-400">
              {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div className="relative">
            <input name="confirmPassword" type={showConf ? "text" : "password"} placeholder="Confirm Password" onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[#1f1f1f] border border-gray-800 text-white focus:ring-2 focus:ring-cyan-400 pr-12" required />
            <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-3.5 text-gray-500 hover:text-cyan-400">
              {showConf ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all active:scale-95 shadow-lg shadow-cyan-400/20">
            {loading ? "VERIFYING..." : "SIGN UP"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">Already a member? <Link to="/login" className="text-cyan-400 font-bold hover:underline">Login</Link></p>
      </div>
    </div>
  );
};

export default Signup;