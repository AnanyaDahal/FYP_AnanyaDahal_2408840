import React, { useState } from "react";
import axios from "axios";

const UrlChecker = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!url) return setError("Please enter a URL");
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/check-url", { url });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error checking URL");
      setResult(null);
    }
  };

  return (
    <div>
      <h2>URL Checker</h2>
      <input
        type="text"
        placeholder="Enter URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleCheck}>Check URL</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div>
          <p>URL: {result.url}</p>
          <p>
            Status: <span style={{ color: result.isPhishing ? "red" : "green" }}>
              {result.isPhishing ? "Phishing" : "Safe"}
            </span>
          </p>
          <p>Reason: {result.reason}</p>
        </div>
      )}
    </div>
  );
};

export default UrlChecker;
