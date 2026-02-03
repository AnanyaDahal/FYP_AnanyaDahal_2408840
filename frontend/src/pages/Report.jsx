import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/scans/report/${id}`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Report Load Error:", err));
  }, [id]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("PHISHING DETECTION SYSTEM - ANALYSIS REPORT", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.text(`Scan ID: ${data._id}`, 20, 45);
    doc.text(`Target URL: ${data.value}`, 20, 55);
    doc.text(`Security Status: ${data.status.toUpperCase()}`, 20, 65);
    doc.text(`Calculated Risk Score: ${data.riskScore}%`, 20, 75);

    doc.text("Detected Threat Factors:", 20, 90);
    data.reasons.forEach((reason, index) => {
      doc.text(`• ${reason}`, 25, 100 + (index * 10));
    });

    doc.save(`Phishing_Report_${data._id}.pdf`);
  };

  const getPhishingInfo = (status) => {
    if (status === 'Malicious') {
      return "Phishing is a type of social engineering where attackers deceive users into revealing sensitive data. This URL matched multiple malicious patterns used in credential harvesting.";
    } else if (status === 'Suspicious') {
      return "This URL contains elements often found in phishing attacks, such as high-risk TLDs or unusual keywords, but did not meet the full threshold for a malicious classification.";
    }
    return "This URL is classified as Safe. It does not exhibit common phishing characteristics and matches known safe domain structures.";
  };

  if (!data) return <div className="p-20 text-cyan-400 font-mono animate-pulse text-center">LOADING ENCRYPTED REPORT...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/history')} className="text-gray-500 hover:text-cyan-400 transition-colors">
          &larr; BACK TO RECORDS
        </button>
        <button onClick={downloadPDF} className="bg-cyan-400 text-black px-8 py-2 rounded-full font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          DOWNLOAD PDF
        </button>
      </div>

      <div className="bg-[#121212] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-gray-800 bg-gradient-to-r from-[#121212] to-black">
          <h1 className="text-4xl font-black italic text-cyan-400 tracking-tighter mb-2">TECHNICAL ANALYSIS</h1>
          <p className="text-gray-500 font-mono text-sm">Target: {data.value}</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Card */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h4 className="text-gray-600 text-xs uppercase font-bold mb-4">Threat Level</h4>
            <p className={`text-5xl font-black italic uppercase ${data.status === 'Malicious' ? 'text-red-500' : 'text-green-400'}`}>
              {data.status}
            </p>
          </div>

          {/* Score Card */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h4 className="text-gray-600 text-xs uppercase font-bold mb-4">Risk Score</h4>
            <div className="flex items-end gap-2">
              <p className="text-5xl font-black text-cyan-400 font-mono">{data.riskScore}%</p>
              <p className="text-gray-600 text-sm mb-2">probability</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="bg-black p-6 rounded-2xl border border-gray-800 mb-8">
            <h4 className="text-cyan-400 text-sm font-bold uppercase mb-4 tracking-widest">Why was this flagged?</h4>
            <div className="space-y-3">
              {data.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-lg border-l-2 border-cyan-400">
                  <span className="text-cyan-400 text-xl">#</span>
                  <span className="text-gray-300 text-sm italic">{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cyan-950/10 p-6 rounded-2xl border border-cyan-900/30">
            <h4 className="text-cyan-400 text-sm font-bold uppercase mb-2">Security Education</h4>
            <p className="text-gray-400 text-sm leading-relaxed italic">
              {getPhishingInfo(data.status)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;