import React, { useState } from "react";
import axios from "axios";

const EmailChecker = ({ darkMode, setHistory }) => {
  const [emailText, setEmailText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!emailText.trim()) {
      setError("Please enter email text");
      return;
    }
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/check-email", { emailText: emailText.trim() });
      setResult(res.data);

      setHistory(prev => [
        { type: "Email", ...res.data },
        ...prev
      ]);

      setEmailText("");
    } catch (err) {
      setError(err.response?.data?.message || "Error checking email");
      setResult(null);
    }
  };

  const cardStyle = {
    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
    color: darkMode ? "#f5f5f5" : "#1e1e1e",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: darkMode ? "0 2px 6px #000" : "0 2px 6px #ccc",
    marginTop: "15px",
  };

  return (
    <div>
      <h2>Email Checker</h2>
      <textarea
        rows={5}
        cols={50}
        placeholder="Enter email text here..."
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        style={{ padding: "8px", marginBottom: "10px" }}
      />
      <br />
      <button onClick={handleCheck} style={{ padding: "8px 12px", cursor: "pointer" }}>Check Email</button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {result && (
        <div style={cardStyle}>
          <p><strong>Total URLs Found:</strong> {result.totalUrls}</p>
          {result.analysis.map((item, index) => (
            <div key={index} style={{ ...cardStyle, marginTop: "10px" }}>
              <p><strong>URL:</strong> {item.url}</p>
              <p><strong>Status:</strong> <span style={{ color: item.isPhishing ? "red" : "green" }}>{item.isPhishing ? "Phishing" : "Safe"}</span></p>
              <p><strong>Reason:</strong> {item.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailChecker;
