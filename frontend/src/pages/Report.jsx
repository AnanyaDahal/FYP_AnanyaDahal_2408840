import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { buildApiUrl, getAuthHeaders } from "../config/api";

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(buildApiUrl(`/api/scans/report/${id}`), { headers: getAuthHeaders() })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "Failed to load report");
        }
        setData(json);
      })
      .catch(err => console.error("Report Load Error:", err));
  }, [id]);

  const getPhishingInfo = (status) => {
    if (status === 'Malicious' || status === 'Phishing') {
      return "CLASSIFICATION RATIONALE: This URL has been classified as Phishing/Malicious because it exhibits definitive deceptive patterns. This typically includes direct matches with known threat intelligence databases, typosquatting (imitating legitimate domains like 'g00gle.com'), or structural traits specifically designed to bypass security filters and harvest user credentials.";
    } else if (status === 'Suspicious') {
      return "CLASSIFICATION RATIONALE: This URL has been flagged as Suspicious. While it lacks definitive malicious payloads, it contains anomalies common in early-stage attacks. These may include the use of URL shorteners to hide the true destination, non-standard Top-Level Domains (TLDs), abnormal string lengths, or a lack of established domain history.";
    }
    return "CLASSIFICATION RATIONALE: This URL is classified as Safe. It aligns with standard, benign domain structures, does not utilize known deceptive routing tactics, and shows no overlap with active phishing or malware distribution indicators.";
  };

  const getSafetyTips = () => {
    return [
      "Never trust the display name of an email or link; always verify the actual underlying sender address and URL.",
      "Hover over links to preview the destination before clicking.",
      "Routinely utilize Multi-Factor Authentication (MFA) on all critical accounts to neutralize stolen passwords.",
      "Be highly skeptical of urgency or fear-based language demanding immediate login or payment.",
      "When in doubt, manually type the known, legitimate website address into your browser rather than clicking a provided link."
    ];
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);

    doc.setFont("helvetica", "bold");
    doc.text("PHISHING DETECTION SYSTEM - ANALYSIS REPORT", margin, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, margin, 30);
    doc.line(margin, 35, pageWidth - margin, 35);

    doc.setFontSize(12);
    doc.text(`Scan ID: ${data._id}`, margin, 45);
    
    // Wrap Target URL in case it's very long
    const splitUrl = doc.splitTextToSize(`Target URL: ${data.value}`, maxLineWidth);
    doc.text(splitUrl, margin, 55);
    
    let currentY = 55 + (splitUrl.length * 6);
    doc.text(`Security Status: ${data.status.toUpperCase()}`, margin, currentY + 4);
    doc.text(`Calculated Risk Score: ${data.riskScore}%`, margin, currentY + 14);

    currentY += 28;
    doc.setFont("helvetica", "bold");
    doc.text("Detected Threat Factors:", margin, currentY);
    doc.setFont("helvetica", "normal");
    
    currentY += 8;
    data.reasons.forEach((reason) => {
      const splitReason = doc.splitTextToSize(`• ${reason}`, maxLineWidth - 5);
      doc.text(splitReason, margin + 5, currentY);
      currentY += (splitReason.length * 6);
    });

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Classification Details:", margin, currentY);
    doc.setFont("helvetica", "normal");
    
    currentY += 8;
    const splitInfo = doc.splitTextToSize(getPhishingInfo(data.status), maxLineWidth);
    doc.text(splitInfo, margin, currentY);
    currentY += (splitInfo.length * 6);

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("How to Stay Safe:", margin, currentY);
    doc.setFont("helvetica", "normal");

    currentY += 8;
    getSafetyTips().forEach((tip) => {
      const splitTip = doc.splitTextToSize(`- ${tip}`, maxLineWidth - 5);
      doc.text(splitTip, margin + 5, currentY);
      currentY += (splitTip.length * 6);
    });

    doc.save(`Phishing_Report_${data._id}.pdf`);
  };

  if (!data) return <div className="p-20 text-cyan-400 font-mono animate-pulse text-center">LOADING ENCRYPTED REPORT...</div>;

  const isDanger = data.status === 'Malicious' || data.status === 'Phishing';
  const isSuspicious = data.status === 'Suspicious';

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
          <p className="text-gray-500 font-mono text-sm break-all">Target: {data.value}</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Card */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h4 className="text-gray-600 text-xs uppercase font-bold mb-4">Threat Level</h4>
            <p className={`text-5xl font-black italic uppercase ${isDanger ? 'text-red-500' : isSuspicious ? 'text-yellow-400' : 'text-green-400'}`}>
              {data.status}
            </p>
          </div>

          {/* Score Card */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h4 className="text-gray-600 text-xs uppercase font-bold mb-4">Risk Score</h4>
            <div className="flex items-end gap-2">
              <p className={`text-5xl font-black font-mono ${isDanger ? 'text-red-500' : isSuspicious ? 'text-yellow-400' : 'text-cyan-400'}`}>
                {data.riskScore}%
              </p>
              <p className="text-gray-600 text-sm mb-2">probability</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Threat Factors */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h4 className="text-cyan-400 text-sm font-bold uppercase mb-4 tracking-widest">Flagged Indicators</h4>
            <div className="space-y-3">
              {data.reasons && data.reasons.length > 0 ? (
                data.reasons.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-lg border-l-2 ${isDanger ? 'border-red-500' : isSuspicious ? 'border-yellow-400' : 'border-cyan-400'}`}>
                    <span className={`${isDanger ? 'text-red-500' : isSuspicious ? 'text-yellow-400' : 'text-cyan-400'} text-xl`}>#</span>
                    <span className="text-gray-300 text-sm italic">{r}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic text-sm">No specific threat indicators flagged.</div>
              )}
            </div>
          </div>

          {/* Classification Rationale */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
            <h4 className="text-gray-400 text-sm font-bold uppercase mb-3">Classification Intelligence</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {getPhishingInfo(data.status)}
            </p>
          </div>

          {/* Security Education / Safety Tips */}
          <div className="bg-cyan-950/20 p-6 rounded-2xl border border-cyan-900/40">
            <h4 className="text-cyan-400 text-sm font-bold uppercase mb-4">Actionable Safety Measures</h4>
            <ul className="space-y-3">
              {getSafetyTips().map((tip, index) => (
                <li key={index} className="text-gray-300 text-sm flex gap-3 leading-relaxed">
                  <span className="text-cyan-400 font-bold">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Report;