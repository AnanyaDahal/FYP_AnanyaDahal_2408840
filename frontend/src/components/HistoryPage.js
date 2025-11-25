import React from "react";
import jsPDF from "jspdf";


const HistoryPage = ({ darkMode, history }) => {

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(12);
    history.forEach((item, index) => {
      doc.text(`${index + 1}. Type: ${item.type}`, 10, y); y += 6;
      if(item.type === "URL") {
        doc.text(`URL: ${item.url}`, 10, y); y += 6;
        doc.text(`Status: ${item.isPhishing ? "Phishing" : "Safe"}`, 10, y); y += 6;
        doc.text(`Reason: ${item.reason}`, 10, y); y += 10;
      } else if(item.type === "Email") {
        doc.text(`Total URLs: ${item.totalUrls}`, 10, y); y += 6;
        item.analysis.forEach((a, i) => {
          doc.text(`URL ${i+1}: ${a.url}`, 10, y); y += 6;
          doc.text(`Status: ${a.isPhishing ? "Phishing" : "Safe"}`, 10, y); y += 6;
          doc.text(`Reason: ${a.reason}`, 10, y); y += 6;
        });
        y += 4;
      }
    });
    doc.save("history_report.pdf");
  };

  const cardStyle = {
    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
    color: darkMode ? "#f5f5f5" : "#1e1e1e",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: darkMode ? "0 2px 6px #000" : "0 2px 6px #ccc",
    marginBottom: "15px"
  };

  return (
    <div>
      <h2>History</h2>
      {history.length === 0 && <p>No history yet.</p>}
      {history.length > 0 && <>
        {history.map((item, index) => (
          <div key={index} style={cardStyle}>
            <p><strong>Type:</strong> {item.type}</p>
            {item.type === "URL" && <>
              <p><strong>URL:</strong> {item.url}</p>
              <p><strong>Status:</strong> {item.isPhishing ? "Phishing" : "Safe"}</p>
              <p><strong>Reason:</strong> {item.reason}</p>
            </>}
            {item.type === "Email" && <>
              <p><strong>Total URLs:</strong> {item.totalUrls}</p>
              {item.analysis.map((a, i) => (
                <div key={i} style={{ marginLeft: "10px", marginBottom: "5px" }}>
                  <p>URL: {a.url}</p>
                  <p>Status: {a.isPhishing ? "Phishing" : "Safe"}</p>
                  <p>Reason: {a.reason}</p>
                </div>
              ))}
            </>}
          </div>
        ))}
        <button onClick={downloadPDF} style={{ padding: "8px 12px", cursor: "pointer" }}>
          Download PDF
        </button>
      </>}
    </div>
  );
};

export default HistoryPage;
