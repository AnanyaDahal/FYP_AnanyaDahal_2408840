import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [textBody, setTextBody] = useState("");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState({ text: false, url: false });
  const [result, setResult] = useState({ text: null, url: null });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleAnalysis = async (type, value) => {
    if (!value.trim()) return;

    setLoading(prev => ({ ...prev, [type]: true }));
    setResult(prev => ({ ...prev, [type]: null }));

    try {
      const response = await fetch("http://localhost:5000/api/scans/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?._id || user?.id, 
          type: type, 
          url: type === 'url' ? value : undefined,
          text: type === 'text' ? value : undefined
        }),
      });

      const data = await response.json();
      
      if (data.success || data.status) {
        setResult(prev => ({ ...prev, [type]: data }));
      } else {
        setResult(prev => ({ ...prev, [type]: { status: "ERROR", reasons: ["Unexpected Response"] } }));
      }
    } catch (error) {
      console.error("Connection Error:", error);
      setResult(prev => ({ ...prev, [type]: { status: "OFFLINE", reasons: ["Backend Unreachable"] } }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (!user) return null;

  return (
    <div className="w-full mt-4 p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 01 Text Analysis */}
        <div className="flex-1 bg-[#121212] p-6 rounded-2xl border border-gray-800 flex flex-col">
          <h3 className="text-cyan-400 text-lg font-bold mb-4 uppercase tracking-widest">01 Text Analysis</h3>
          <textarea
            placeholder="Paste email content here..."
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
            className="w-full h-40 px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white mb-4 outline-none focus:border-cyan-400 transition-all"
          />
          <button
            onClick={() => handleAnalysis('text', textBody)}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 disabled:opacity-50"
            disabled={loading.text}
          >
            {loading.text ? "Analyzing..." : "Analyze Text"}
          </button>
        </div>

        {/* 02 URL Analysis */}
        <div className="flex-1 bg-[#121212] p-6 rounded-2xl border border-gray-800 flex flex-col">
          <h3 className="text-cyan-400 text-lg font-bold mb-4 uppercase tracking-widest">02 URL Analysis</h3>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white mb-4 outline-none focus:border-cyan-400"
          />
          <button
            onClick={() => handleAnalysis('url', url)}
            className="w-full py-3 rounded-xl border-2 border-cyan-400 text-cyan-400 font-bold hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50"
            disabled={loading.url}
          >
            {loading.url ? "Scanning..." : "Scan URL"}
          </button>

          {/* Detailed Result Card */}
          {result.url && (
            <div className="mt-6 p-4 rounded-xl bg-black border border-gray-800 border-l-4 border-l-cyan-400 animate-pulse-slow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Analysis Result</span>
                {result.url.riskScore !== undefined && (
                   <span className="text-cyan-400 font-mono text-sm">{result.url.riskScore}% Risk</span>
                )}
              </div>
              
              <h4 className={`text-2xl font-black italic tracking-tighter ${
                result.url.status === 'Malicious' ? 'text-red-500' : 
                result.url.status === 'Suspicious' ? 'text-yellow-500' : 'text-green-400'
              }`}>
                {result.url.status}
              </h4>

              {result.url.reasons && result.url.reasons.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-900">
                  <p className="text-[9px] text-gray-600 uppercase mb-1">Detected Factors:</p>
                  <ul className="space-y-1">
                    {result.url.reasons.map((r, i) => (
                      <li key={i} className="text-[11px] text-gray-400 flex items-center">
                        <span className="text-cyan-500 mr-2">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;