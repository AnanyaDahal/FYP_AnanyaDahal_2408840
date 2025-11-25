import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UrlChecker from "./components/UrlChecker";
import EmailChecker from "./components/EmailChecker";
import HistoryPage from "./components/HistoryPage";

function App() {
  const [history, setHistory] = useState([]); // shared history for all checks
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial", background: darkMode ? "#1e1e1e" : "#f5f5f5", minHeight: "100vh", color: darkMode ? "#f5f5f5" : "#1e1e1e" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Phishing Detection System</h1>
          <div>
            <Link to="/" style={{ marginRight: "10px", color: darkMode ? "#f5f5f5" : "#1e1e1e" }}>Dashboard</Link>
            <Link to="/history" style={{ color: darkMode ? "#f5f5f5" : "#1e1e1e" }}>History</Link>
            <button onClick={() => setDarkMode(!darkMode)} style={{ marginLeft: "15px", padding: "5px 10px" }}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>

        <hr />

        <Routes>
          <Route path="/" element={<>
            <UrlChecker darkMode={darkMode} history={history} setHistory={setHistory} />
            <hr />
            <EmailChecker darkMode={darkMode} history={history} setHistory={setHistory} />
          </>} />
          <Route path="/history" element={<HistoryPage darkMode={darkMode} history={history} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
