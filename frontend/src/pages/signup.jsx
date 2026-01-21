import React from "react";
import "./signup.css"; 

const Signup = () => {
  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Create Account</h2>
        <p>Sign up to get started</p>

        <form>
          <input type="text" placeholder="Full Name" required />
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <input type="password" placeholder="Confirm Password" required />
          <button type="submit">Sign Up</button>
        </form>

        <span className="forgot">
          Already have an account? <a href="/login">Login</a>
        </span>
      </div>
    </div>
  );
};

export default Signup;
