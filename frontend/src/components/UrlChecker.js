// import React, { useState } from "react";
// import axios from "axios";

// const UrlChecker = ({ darkMode, setHistory }) => {
//   const [url, setUrl] = useState("");
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState("");

//   const handleCheck = async () => {
//     if (!url.trim()) {
//       setError("Please enter a URL");
//       return;
//     }
//     setError("");

//     try {
//       const res = await axios.post("http://localhost:5000/api/check-url", { url: url.trim() });
//       setResult(res.data);

//       setHistory(prev => [
//         { type: "URL", ...res.data },
//         ...prev
//       ]);

//       setUrl("");
//     } catch (err) {
//       setError(err.response?.data?.message || "Error checking URL");
//       setResult(null);
//     }
//   };

//   const cardStyle = {
//     backgroundColor: darkMode ? "#2a2a2a" : "#fff",
//     color: darkMode ? "#f5f5f5" : "#1e1e1e",
//     padding: "15px",
//     borderRadius: "8px",
//     boxShadow: darkMode ? "0 2px 6px #000" : "0 2px 6px #ccc",
//     marginTop: "15px",
//   };

//   return (
//     <div>
//       <h2>URL Checker</h2>
//       <input
//         type="text"
//         placeholder="Enter URL"
//         value={url}
//         onChange={(e) => setUrl(e.target.value)}
//         style={{ width: "70%", padding: "8px", marginRight: "10px" }}
//       />
//       <button onClick={handleCheck} style={{ padding: "8px 12px", cursor: "pointer" }}>Check URL</button>

//       {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

//       {result && (
//         <div style={cardStyle}>
//           <p><strong>URL:</strong> {result.url}</p>
//           <p><strong>Status:</strong> <span style={{ color: result.isPhishing ? "red" : "green" }}>{result.isPhishing ? "Phishing" : "Safe"}</span></p>
//           <p><strong>Reason:</strong> {result.reason}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UrlChecker;


import { useState } from "react";
import axios from "axios";

export default function UrlChecker() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", { url });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Something went wrong" });
    }
  };

  return (
    <div>
      <h2>URL Checker</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          required
        />
        <button type="submit">Check URL</button>
      </form>

      {result && (
        <div style={{ marginTop: "20px" }}>
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <>
              <p><strong>URL:</strong> {result.url}</p>
              <p><strong>Prediction:</strong> {result.prediction}</p>
              <p><strong>Probability:</strong> {result.probability}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
