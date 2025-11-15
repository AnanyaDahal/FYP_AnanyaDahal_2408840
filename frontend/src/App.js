import React from "react";
import UrlChecker from "./components/UrlChecker";
import EmailChecker from "./components/EmailChecker";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Phishing Detection System</h1>
      <UrlChecker />
      <hr />
      <EmailChecker />
    </div>
  );
}

export default App;


