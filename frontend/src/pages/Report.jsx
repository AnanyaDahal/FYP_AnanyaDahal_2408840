import React from "react";
import { useParams } from "react-router-dom";

const Report = () => {
  const { id } = useParams();

  // Mock report data
  const report = {
    value: "http://secure-login-paypal.com",
    type: "URL",
    status: "Phishing",
    riskScore: 92,
    reasons: [
      "Domain impersonates a well-known brand (PayPal)",
      "URL uses misleading keywords like 'secure' and 'login'",
      "Domain age is less than 7 days",
      "No valid SSL certificate found",
      "Detected in phishing threat databases",
    ],
    advice: [
      "Do not enter personal or financial information",
      "Avoid clicking links from unknown sources",
      "Report this URL to your email provider",
      "Enable two-factor authentication on your accounts",
    ],
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#121212] rounded-2xl shadow-2xl p-8">
        <h1 className="text-white text-3xl font-bold mb-6">Phishing Report</h1>

        <div className="mb-6">
          <p className="text-gray-400 text-sm">Scanned {report.type}</p>
          <p className="text-white break-all font-medium">{report.value}</p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <span className="px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-semibold">
            {report.status}
          </span>
          <span className="text-gray-400">
            Risk Score: <span className="text-white font-bold">{report.riskScore}%</span>
          </span>
        </div>

        <section className="mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">Why this is phishing</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {report.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-white text-xl font-semibold mb-4">Recommended Actions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {report.advice.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Report;
