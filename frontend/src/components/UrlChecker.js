
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
