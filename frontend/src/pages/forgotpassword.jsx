import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldAlert, Key, CheckCircle, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { buildApiUrl } from "../config/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState("");

  // Live Password Checklist
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&.\-_+#=]/.test(password);
  const isMinLength = password.length >= 8;

  // Step 1: Send Reset Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    setDebugCode("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "A 6-digit verification code has been sent to your email.");
        if (data.debugCode) {
          setDebugCode(data.debugCode);
        }
        setStep(2);
      } else {
        setError(data.message || "Unable to send verification code. Please check the email.");
      }
    } catch (err) {
      setError("Cannot connect to security backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the 6-Digit Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (code.trim().length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/auth/verify-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Verification successful! You can now set your new credentials.");
        setStep(3);
      } else {
        setError(data.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      setError("Cannot connect to security backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!hasLetter || !hasNumber || !hasSpecial || !isMinLength) {
      setError("Your new password does not satisfy security complexity rules.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/auth/reset-password/${code.trim()}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password updated successfully! Redirecting you to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setError(data.message || "Token invalid or expired. Please request a new code.");
      }
    } catch (err) {
      setError("Cannot connect to security backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 relative overflow-hidden">
      
      {/* Background Neon Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[450px] bg-[#12141c]/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800 relative z-10 transition-all duration-300">
        
        {/* Logo Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="text-black fill-current" size={28} />
          </div>
        </div>

        {/* Wizard Titles */}
        <header className="mb-6 text-center">
          <h2 className="text-white text-3xl font-black italic tracking-tighter uppercase">
            {step === 1 && "Forgot Security Code?"}
            {step === 2 && "Verification Check"}
            {step === 3 && "Reset Credentials"}
          </h2>
          <p className="text-gray-400 mt-2 text-xs">
            {step === 1 && "Provide your email address to receive a secure verification code."}
            {step === 2 && `Enter the 6-digit security code dispatched to ${email}.`}
            {step === 3 && "Configure a premium complexity password to safeguard your account."}
          </p>
        </header>

        {/* Info alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs p-3.5 rounded-xl mb-5 flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs p-3.5 rounded-xl mb-5 flex items-start gap-2">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Local Test Helper Warning */}
        {debugCode && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs p-4 rounded-xl mb-5">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-300">
              <span>⚠️</span> Developer Sandbox Notice:
            </p>
            <p className="text-[11px] leading-relaxed">
              SMTP environment keys are not configured. Use this generated bypass code to proceed:
            </p>
            <div className="mt-2 text-center bg-black/40 py-2 rounded-lg border border-amber-500/20">
              <span className="font-mono text-lg font-black tracking-widest text-amber-300">{debugCode}</span>
            </div>
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-2">Registered Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171a22] border border-gray-800 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-400/20 text-xs tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? "Dispatched Code..." : "Receive Recovery Code"}
            </button>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-2">6-Digit Security Token</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171a22] border border-gray-800 text-white text-center font-mono text-lg tracking-[8px] outline-none focus:border-cyan-400 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-xl border border-gray-800 text-gray-400 font-bold text-xs uppercase hover:bg-gray-800/40 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-400/20 text-xs tracking-widest"
              >
                {loading ? "Validating Code..." : "Verify Code"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* New Password */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1.5">New Strong Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#171a22] border border-gray-800 text-white outline-none focus:border-cyan-400 text-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-cyan-400"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Lock size={15} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#171a22] border border-gray-800 text-white outline-none focus:border-cyan-400 text-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-cyan-400"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Password Complexity Checklist UI */}
            <div className="p-3 bg-black/40 border border-gray-800/80 rounded-xl space-y-1.5">
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Complexity Safeguard Rules:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`text-[10px] flex items-center gap-1.5 ${isMinLength ? "text-green-400" : "text-gray-500"}`}>
                  <span className="text-[12px]">{isMinLength ? "✓" : "○"}</span> Min 8 chars
                </div>
                <div className={`text-[10px] flex items-center gap-1.5 ${hasLetter ? "text-green-400" : "text-gray-500"}`}>
                  <span className="text-[12px]">{hasLetter ? "✓" : "○"}</span> At least 1 letter
                </div>
                <div className={`text-[10px] flex items-center gap-1.5 ${hasNumber ? "text-green-400" : "text-gray-500"}`}>
                  <span className="text-[12px]">{hasNumber ? "✓" : "○"}</span> At least 1 number
                </div>
                <div className={`text-[10px] flex items-center gap-1.5 ${hasSpecial ? "text-green-400" : "text-gray-500"}`}>
                  <span className="text-[12px]">{hasSpecial ? "✓" : "○"}</span> 1 Special Char
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-400/20 text-xs tracking-widest mt-2"
            >
              {loading ? "Reconfiguring Account..." : "Confirm Credentials"}
            </button>
          </form>
        )}

        {/* Footer Back Link */}
        {step < 3 && (
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft size={14} />
              Return to Login Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;