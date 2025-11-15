import React, { useState } from "react";
import axios from "axios";

const EmailChecker = () => {
  const [emailText, setEmailText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!emailText) return setError("Please enter email text");
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/check-email", { emailText });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error checking email");
      setResult(null);
    }
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
      />
      <br />
      <button onClick={handleCheck}>Check Email</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div>
          <p>Total URLs Found: {result.totalUrls}</p>
          {result.analysis.map((item, index) => (
            <div key={index}>
              <p>URL: {item.url}</p>
              <p>Status: <span style={{ color: item.isPhishing ? "red" : "green" }}>
                {item.isPhishing ? "Phishing" : "Safe"}
              </span></p>
              <p>Reason: {item.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailChecker;
