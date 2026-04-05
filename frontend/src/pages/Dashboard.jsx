// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { buildApiUrl, getAuthHeaders } from "../config/api";
// import ScanResultPieChart from "../components/admin/ScanResultPieChart"; 

// const Dashboard = () => {
//   const [textBody, setTextBody] = useState("");
//   const [url, setUrl] = useState("");
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState({ text: false, url: false });
//   const [result, setResult] = useState({ text: null, url: null });
//   const [textLogs, setTextLogs] = useState([]);
//   const [urlLogs, setUrlLogs] = useState([]);
  
//   // New state to hold the user's scan history for the charts
//   const [scanHistory, setScanHistory] = useState([]);

//   useEffect(() => {
//     const savedUser = localStorage.getItem("user");
//     if (savedUser) setUser(JSON.parse(savedUser));
//   }, []);

//   // Fetch the user's specific history securely
//   const fetchUserHistory = useCallback(async () => {
//     const userId = user?._id || user?.id;
//     if (!userId) return;

//     try {
//       const response = await fetch(buildApiUrl(`/api/scans/history/${userId}`), {
//         headers: getAuthHeaders(),
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setScanHistory(data);
//       }
//     } catch (error) {
//       console.error("Failed to fetch user scan history:", error);
//     }
//   }, [user]);

//   // Load history on mount or when user logs in
//   useEffect(() => {
//     if (user) {
//       fetchUserHistory();
//     }
//   }, [user, fetchUserHistory]);

//   // Calculate summaries for the pie charts
//   const { emailSummary, urlSummary } = useMemo(() => {
//     const eSummary = { Safe: 0, Suspicious: 0, Malicious: 0, Phishing: 0 };
//     const uSummary = { Safe: 0, Suspicious: 0, Malicious: 0, Phishing: 0 };

//     scanHistory.forEach((scan) => {
//       // Normalize status in case your db uses "Malicious" but chart expects "Phishing"
//       const status = scan.status === "Malicious" ? "Phishing" : scan.status;
      
//       if (scan.type === "email") {
//         eSummary[status] = (eSummary[status] || 0) + 1;
//       } else if (scan.type === "url") {
//         uSummary[status] = (uSummary[status] || 0) + 1;
//       }
//     });

//     return { emailSummary: eSummary, urlSummary: uSummary };
//   }, [scanHistory]);

//   const consumeSseResponse = async (response, type) => {
//     if (!response.body) {
//       setResult(prev => ({
//         ...prev,
//         [type]: { status: "ERROR", reasons: ["Streaming not supported in this browser."] }
//       }));
//       return;
//     }

//     const pushLog = type === "url" ? setUrlLogs : setTextLogs;
//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();
//     let buffer = "";
//     let donePayload = null;

//     while (true) {
//       const { value: chunk, done } = await reader.read();
//       if (done) break;

//       buffer += decoder.decode(chunk, { stream: true });
//       const events = buffer.split("\n\n");
//       buffer = events.pop() || "";

//       for (const eventChunk of events) {
//         const line = eventChunk
//           .split("\n")
//           .find((l) => l.startsWith("data: "));
//         if (!line) continue;

//         try {
//           const evt = JSON.parse(line.slice(6));

//           if (evt.type === "progress") {
//             pushLog((prev) => [
//               ...prev,
//               `${new Date().toLocaleTimeString()} - ${evt.message}`,
//             ]);
//           }

//           if (evt.type === "done") {
//             donePayload = evt.payload;
//           }

//           if (evt.type === "error") {
//             setResult(prev => ({
//               ...prev,
//               [type]: { status: "ERROR", reasons: [evt.message || "Stream error"] }
//             }));
//           }
//         } catch (err) {
//           // ignore malformed chunks
//         }
//       }
//     }

//     if (donePayload && (donePayload.success || donePayload.status)) {
//       setResult(prev => ({ ...prev, [type]: donePayload }));
//       // Refresh history to update the pie charts immediately after a scan!
//       fetchUserHistory();
//     } else {
//       setResult(prev => ({
//         ...prev,
//         [type]: { status: "ERROR", reasons: ["No final analysis payload received."] }
//       }));
//     }
//   };

//   const handleAnalysis = async (type, value) => {
//     if (!value.trim()) return;
//     const userId = user?._id || user?.id;

//     if (!userId) {
//       setResult(prev => ({
//         ...prev,
//         [type]: { status: "ERROR", reasons: ["Missing user session. Please log in again."] }
//       }));
//       return;
//     }

//     setLoading(prev => ({ ...prev, [type]: true }));
//     setResult(prev => ({ ...prev, [type]: null }));
//     if (type === "text") {
//       setTextLogs([]);
//     } else {
//       setUrlLogs([]);
//     }

//     try {
//       const isUrl = type === "url";
//       const endpoint = isUrl ? "/api/scans/analyze-stream" : "/api/email/check-email-stream";
//       const payload = isUrl
//         ? { userId, url: value }
//         : { userId, emailText: value };

//       const response = await fetch(buildApiUrl(endpoint), {
//         method: "POST",
//         headers: getAuthHeaders({ "Content-Type": "application/json" }),
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const data = await response.json().catch(() => ({}));
//         setResult(prev => ({
//           ...prev,
//           [type]: {
//             status: "ERROR",
//             reasons: [data?.message || "Request failed"]
//           }
//         }));
//         return;
//       }

//       await consumeSseResponse(response, type);
//     } catch (error) {
//       console.error("Connection Error:", error);
//       setResult(prev => ({ ...prev, [type]: { status: "OFFLINE", reasons: ["Backend Unreachable"] } }));
//     } finally {
//       setLoading(prev => ({ ...prev, [type]: false }));
//     }
//   };

//   if (!user) return null;

//   const getStatusClass = (status) => {
//     if (!status) return "text-gray-300";
//     if (status === "Phishing" || status === "Malicious") return "text-red-500";
//     if (status === "Suspicious") return "text-yellow-500";
//     if (status === "Safe") return "text-green-400";
//     return "text-gray-300";
//   };

//   return (
//     <div className="w-full mt-4 p-4">
//       <div className="flex flex-col lg:flex-row gap-6 mb-8">
        
//         {/* 01 Text Analysis */}
//         <div className="flex-1 bg-[#121212] p-6 rounded-2xl border border-gray-800 flex flex-col">
//           <h3 className="text-cyan-400 text-lg font-bold mb-4 uppercase tracking-widest">01 Text Analysis</h3>
//           <textarea
//             placeholder="Paste email content here..."
//             value={textBody}
//             onChange={(e) => setTextBody(e.target.value)}
//             className="w-full h-40 px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white mb-4 outline-none focus:border-cyan-400 transition-all"
//           />
//           <button
//             onClick={() => handleAnalysis('text', textBody)}
//             className="w-full py-3 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 disabled:opacity-50"
//             disabled={loading.text}
//           >
//             {loading.text ? "Analyzing..." : "Analyze Text"}
//           </button>

//           {(loading.text || textLogs.length > 0) && (
//             <div className="mt-4 rounded-xl border border-gray-800 bg-[#0b0b0b] p-3">
//               <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Live Analysis Logs</p>
//               <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
//                 {textLogs.map((log, i) => (
//                   <li key={i} className="text-[11px] text-gray-300 font-mono">{log}</li>
//                 ))}
//                 {loading.text && (
//                   <li className="text-[11px] text-cyan-300 font-mono animate-pulse">Waiting for next event...</li>
//                 )}
//               </ul>
//             </div>
//           )}

//           {result.text && (
//             <div className="mt-6 p-4 rounded-xl bg-black border border-gray-800 border-l-4 border-l-cyan-400">
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-[10px] text-gray-500 uppercase font-bold">Email Verdict</span>
//                 {result.text.riskScore !== undefined && (
//                   <span className="text-cyan-400 font-mono text-sm">{result.text.riskScore}% Risk</span>
//                 )}
//               </div>

//               <h4 className={`text-2xl font-black italic tracking-tighter ${getStatusClass(result.text.status)}`}>
//                 {result.text.status || "Unknown"}
//               </h4>

//               {typeof result.text.totalLinks === "number" && (
//                 <p className="mt-2 text-xs text-gray-400">
//                   URLs found in email: <span className="text-cyan-300 font-semibold">{result.text.totalLinks}</span>
//                 </p>
//               )}

//               {result.text.reasons && result.text.reasons.length > 0 && (
//                 <div className="mt-3 pt-2 border-t border-gray-900">
//                   <p className="text-[9px] text-gray-600 uppercase mb-1">Notes:</p>
//                   <ul className="space-y-1">
//                     {result.text.reasons.map((r, i) => (
//                       <li key={i} className="text-[11px] text-gray-400 flex items-center">
//                         <span className="text-cyan-500 mr-2">•</span> {r}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {Array.isArray(result.text.linkAnalysis) && result.text.linkAnalysis.length > 0 && (
//                 <div className="mt-3 pt-2 border-t border-gray-900">
//                   <p className="text-[9px] text-gray-600 uppercase mb-2">Extracted URL Checks:</p>
//                   <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
//                     {result.text.linkAnalysis.map((item, i) => (
//                       <li key={i} className="text-[11px] text-gray-300 bg-[#111] border border-gray-800 rounded-lg p-2">
//                         <p className="break-all text-cyan-300">{item.url}</p>
//                         <p className={
//                           item.status === 'Malicious' ? "text-red-400 mt-1 font-bold" : 
//                           item.status === 'Suspicious' ? "text-yellow-400 mt-1 font-bold" : 
//                           "text-green-400 mt-1 font-bold"
//                         }>
//                           Status: {item.status} {item.riskScore !== undefined && `(${item.riskScore}% Risk)`}
//                         </p>
//                         {item.reasons && item.reasons.length > 0 && (
//                           <p className="text-gray-400 mt-1 italic">Note: {item.reasons.join(", ")}</p>
//                         )}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* 02 URL Analysis */}
//         <div className="flex-1 bg-[#121212] p-6 rounded-2xl border border-gray-800 flex flex-col">
//           <h3 className="text-cyan-400 text-lg font-bold mb-4 uppercase tracking-widest">02 URL Analysis</h3>
//           <input
//             type="url"
//             placeholder="https://example.com"
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//             className="w-full px-4 py-3 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white mb-4 outline-none focus:border-cyan-400"
//           />
//           <button
//             onClick={() => handleAnalysis('url', url)}
//             className="w-full py-3 rounded-xl border-2 border-cyan-400 text-cyan-400 font-bold hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50"
//             disabled={loading.url}
//           >
//             {loading.url ? "Scanning..." : "Scan URL"}
//           </button>

//           {(loading.url || urlLogs.length > 0) && (
//             <div className="mt-4 rounded-xl border border-gray-800 bg-[#0b0b0b] p-3">
//               <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Live URL Logs</p>
//               <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
//                 {urlLogs.map((log, i) => (
//                   <li key={i} className="text-[11px] text-gray-300 font-mono">{log}</li>
//                 ))}
//                 {loading.url && (
//                   <li className="text-[11px] text-cyan-300 font-mono animate-pulse">Waiting for next event...</li>
//                 )}
//               </ul>
//             </div>
//           )}

//           {result.url && (
//             <div className="mt-6 p-4 rounded-xl bg-black border border-gray-800 border-l-4 border-l-cyan-400 animate-pulse-slow">
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-[10px] text-gray-500 uppercase font-bold">Analysis Result</span>
//                 {result.url.riskScore !== undefined && (
//                    <span className="text-cyan-400 font-mono text-sm">{result.url.riskScore}% Risk</span>
//                 )}
//               </div>
              
//               <h4 className={`text-2xl font-black italic tracking-tighter ${
//                 result.url.status === 'Malicious' ? 'text-red-500' : 
//                 result.url.status === 'Suspicious' ? 'text-yellow-500' : 'text-green-400'
//               }`}>
//                 {result.url.status}
//               </h4>

//               {result.url.reasons && result.url.reasons.length > 0 && (
//                 <div className="mt-3 pt-2 border-t border-gray-900">
//                   <p className="text-[9px] text-gray-600 uppercase mb-1">Detected Factors:</p>
//                   <ul className="space-y-1">
//                     {result.url.reasons.map((r, i) => (
//                       <li key={i} className="text-[11px] text-gray-400 flex items-center">
//                         <span className="text-cyan-500 mr-2">•</span> {r}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* --- NEW SECTION: User Statistics Pie Charts --- */}
//       <div className="mt-8 border-t border-gray-800 pt-8">
//         <h2 className="text-2xl font-black italic text-white tracking-tighter mb-6 uppercase">Your Scan Analytics</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800">
//             <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 text-center">Email Scans Distribution</h3>
//             <ScanResultPieChart scanResultSummary={emailSummary} />
//           </div>
          
//           <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800">
//             <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 text-center">URL Scans Distribution</h3>
//             <ScanResultPieChart scanResultSummary={urlSummary} />
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// };

// export default Dashboard;



import React, { useState, useEffect, useMemo, useCallback } from "react";
import { buildApiUrl, getAuthHeaders } from "../config/api";
import ScanResultPieChart from "../components/admin/ScanResultPieChart"; 
// Added Refresh Icon (assuming you might use Lucide or similar, but I'll use a text/emoji fallback)
import { RefreshCw } from "lucide-react"; 

const Dashboard = () => {
  const [textBody, setTextBody] = useState("");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState({ text: false, url: false, history: false }); // Added history loading
  const [result, setResult] = useState({ text: null, url: null });
  const [textLogs, setTextLogs] = useState([]);
  const [urlLogs, setUrlLogs] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchUserHistory = useCallback(async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    setLoading(prev => ({ ...prev, history: true })); // Start history loader
    try {
      const response = await fetch(buildApiUrl(`/api/scans/history/${userId}`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setScanHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch user scan history:", error);
    } finally {
      setLoading(prev => ({ ...prev, history: false })); // End history loader
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user, fetchUserHistory]);

  const { emailSummary, urlSummary } = useMemo(() => {
    const eSummary = { Safe: 0, Suspicious: 0, Malicious: 0, Phishing: 0 };
    const uSummary = { Safe: 0, Suspicious: 0, Malicious: 0, Phishing: 0 };

    scanHistory.forEach((scan) => {
      const status = scan.status === "Malicious" ? "Phishing" : scan.status;
      if (scan.type === "email") {
        eSummary[status] = (eSummary[status] || 0) + 1;
      } else if (scan.type === "url") {
        uSummary[status] = (uSummary[status] || 0) + 1;
      }
    });

    return { emailSummary: eSummary, urlSummary: uSummary };
  }, [scanHistory]);

  // ... (consumeSseResponse and handleAnalysis remain the same)
  // Ensure consumeSseResponse calls fetchUserHistory() as it already does in your snippet

  const consumeSseResponse = async (response, type) => {
    // ... (logic from your original code)
    // When done:
    if (donePayload && (donePayload.success || donePayload.status)) {
       setResult(prev => ({ ...prev, [type]: donePayload }));
       fetchUserHistory(); // Existing logic updates the charts
    }
    // ...
  };

  const handleAnalysis = async (type, value) => {
    if (!value.trim()) return;
    const userId = user?._id || user?.id;

    if (!userId) {
      setResult(prev => ({
        ...prev,
        [type]: { status: "ERROR", reasons: ["Missing user session. Please log in again."] }
      }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setResult(prev => ({ ...prev, [type]: null }));
    if (type === "text") setTextLogs([]); else setUrlLogs([]);

    try {
      const isUrl = type === "url";
      const endpoint = isUrl ? "/api/scans/analyze-stream" : "/api/email/check-email-stream";
      const payload = isUrl ? { userId, url: value } : { userId, emailText: value };

      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setResult(prev => ({
          ...prev,
          [type]: { status: "ERROR", reasons: [data?.message || "Request failed"] }
        }));
        return;
      }

      await consumeSseResponse(response, type);
    } catch (error) {
      setResult(prev => ({ ...prev, [type]: { status: "OFFLINE", reasons: ["Backend Unreachable"] } }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (!user) return null;

  const getStatusClass = (status) => {
    if (!status) return "text-gray-300";
    if (status === "Phishing" || status === "Malicious") return "text-red-500";
    if (status === "Suspicious") return "text-yellow-500";
    if (status === "Safe") return "text-green-400";
    return "text-gray-300";
  };

  return (
    <div className="w-full mt-4 p-4">
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* 01 Text Analysis & 02 URL Analysis (Stay the same) */}
        {/* ... Paste your Analysis UI code here ... */}
      </div>

      {/* --- REFRESHABLE SECTION: User Statistics --- */}
      <div className="mt-8 border-t border-gray-800 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase">
            Your Scan Analytics
          </h2>
          
          <button 
            onClick={fetchUserHistory}
            disabled={loading.history}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className={`text-sm font-bold uppercase tracking-widest ${loading.history ? 'animate-spin' : ''}`}>
               {loading.history ? "⟳" : "Refresh"} 
            </span>
          </button>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${loading.history ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 text-center">Email Scans Distribution</h3>
            <ScanResultPieChart scanResultSummary={emailSummary} />
          </div>
          
          <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 text-center">URL Scans Distribution</h3>
            <ScanResultPieChart scanResultSummary={urlSummary} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;