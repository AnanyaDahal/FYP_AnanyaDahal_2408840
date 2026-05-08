import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { buildApiUrl, getAuthHeaders } from "../config/api";
import ScanResultPieChart from "../components/admin/ScanResultPieChart"; 
import { Shield, UploadCloud, AlertCircle, FileText, RefreshCw } from "lucide-react";

const Dashboard = () => {
  const [textBody, setTextBody] = useState("");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);
  
  // Scans loading and state
  const [loading, setLoading] = useState({ text: false, url: false, file: false });
  const [result, setResult] = useState({ text: null, url: null, file: null });
  const [textLogs, setTextLogs] = useState([]);
  const [urlLogs, setUrlLogs] = useState([]);
  const [fileLogs, setFileLogs] = useState([]);
  
  // File Uploader state
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // User's scan history for the charts
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Fetch the user's specific history securely
  const fetchUserHistory = useCallback(async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;

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
    }
  }, [user]);

  // Load history on mount or when user logs in
  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user, fetchUserHistory]);

  // Calculate summaries for the pie charts
  const { emailSummary, urlSummary, attachmentSummary } = useMemo(() => {
    const eSummary = { Safe: 0, Suspicious: 0, Phishing: 0 };
    const uSummary = { Safe: 0, Suspicious: 0, Phishing: 0 };
    const aSummary = { Safe: 0, Suspicious: 0, Phishing: 0 };

    scanHistory.forEach((scan) => {
      // Normalize status in case your db uses "Malicious" but chart expects "Phishing"
      const status = (scan.status === "Malicious" || scan.status === "Phishing") ? "Phishing" : scan.status;
      
      if (scan.type === "email") {
        eSummary[status] = (eSummary[status] || 0) + 1;
      } else if (scan.type === "url") {
        uSummary[status] = (uSummary[status] || 0) + 1;
      } else if (scan.type === "attachment") {
        aSummary[status] = (aSummary[status] || 0) + 1;
      }
    });

    return { emailSummary: eSummary, urlSummary: uSummary, attachmentSummary: aSummary };
  }, [scanHistory]);

  // Handle stream reader
  const consumeSseResponse = async (response, type, customSetLogs) => {
    if (!response.body) {
      setResult(prev => ({
        ...prev,
        [type]: { status: "ERROR", reasons: ["Streaming not supported in this browser."] }
      }));
      return;
    }

    const pushLog = customSetLogs || (type === "url" ? setUrlLogs : setTextLogs);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let donePayload = null;

    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(chunk, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventChunk of events) {
        const line = eventChunk
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!line) continue;

        try {
          const evt = JSON.parse(line.slice(6));

          if (evt.type === "progress") {
            pushLog((prev) => [
              ...prev,
              `${new Date().toLocaleTimeString()} - ${evt.message}`,
            ]);
          }

          if (evt.type === "done") {
            donePayload = evt.payload;
            pushLog((prev) => [
              ...prev,
              `${new Date().toLocaleTimeString()} - ✓ Analysis complete.`,
            ]);
          }

          if (evt.type === "error") {
            setResult(prev => ({
              ...prev,
              [type]: { status: "ERROR", reasons: [evt.message || "Stream error"] }
            }));
            pushLog((prev) => [
              ...prev,
              `${new Date().toLocaleTimeString()} - ✗ Error: ${evt.message || "Stream error"}`,
            ]);
          }
        } catch (err) {
          // ignore malformed chunks
        }
      }
    }

    if (donePayload && (donePayload.success || donePayload.status)) {
      setResult(prev => ({ ...prev, [type]: donePayload }));
      fetchUserHistory(); // Refresh history charts
    } else {
      setResult(prev => ({
        ...prev,
        [type]: { status: "ERROR", reasons: ["No final analysis signature received from sandbox engine."] }
      }));
    }
  };

  // Run Text/URL scanning
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
    if (type === "text") {
      setTextLogs([]);
    } else {
      setUrlLogs([]);
    }

    try {
      const isUrl = type === "url";
      const endpoint = isUrl ? "/api/scans/analyze-stream" : "/api/email/check-email-stream";
      const payload = isUrl
        ? { userId, url: value }
        : { userId, emailText: value };

      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setResult(prev => ({
          ...prev,
          [type]: {
            status: "ERROR",
            reasons: [data?.message || "Request failed"]
          }
        }));
        return;
      }

      await consumeSseResponse(response, type);
    } catch (error) {
      console.error("Connection Error:", error);
      setResult(prev => ({ ...prev, [type]: { status: "OFFLINE", reasons: ["Backend Unreachable"] } }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Run File Attachment scanning
  const handleAttachmentScan = async (fileToScan) => {
    if (!fileToScan) return;
    const userId = user?._id || user?.id;

    if (!userId) {
      setResult(prev => ({
        ...prev,
        file: { status: "ERROR", reasons: ["Missing user session. Please log in again."] }
      }));
      return;
    }

    setLoading(prev => ({ ...prev, file: true }));
    setResult(prev => ({ ...prev, file: null }));
    setFileLogs([]);

    // File Reader to Base64 conversion
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;

        setFileLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Parsed file stream successfully.`]);

        const response = await fetch(buildApiUrl("/api/attachment/scan-stream"), {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            name: fileToScan.name,
            data: base64Data,
            userId: userId
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setResult(prev => ({
            ...prev,
            file: {
              status: "ERROR",
              reasons: [data?.message || "Attachment scanning aborted by host server."]
            }
          }));
          return;
        }

        await consumeSseResponse(response, "file", setFileLogs);
      } catch (error) {
        console.error("File upload error:", error);
        setResult(prev => ({
          ...prev,
          file: { status: "OFFLINE", reasons: ["Connection to scanning container interrupted."] }
        }));
      } finally {
        setLoading(prev => ({ ...prev, file: false }));
      }
    };

    reader.onerror = () => {
      setResult(prev => ({
        ...prev,
        file: { status: "ERROR", reasons: ["Unable to load file streams locally."] }
      }));
      setLoading(prev => ({ ...prev, file: false }));
    };

    reader.readAsDataURL(fileToScan);
  };

  // Drag and Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleAttachmentScan(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleAttachmentScan(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  if (!user) return null;

  const getStatusClass = (status) => {
    if (!status) return "text-gray-300";
    if (status === "Phishing" || status === "Malicious") return "text-red-500";
    if (status === "Suspicious") return "text-yellow-500";
    if (status === "Safe") return "text-green-400";
    return "text-gray-300";
  };

  const isScanComplete = (scanResult, scanLoading) => {
    return (
      scanResult &&
      !scanLoading &&
      !["ERROR", "OFFLINE"].includes(scanResult.status)
    );
  };

  return (
    <div className="w-full mt-2 space-y-8 pb-12">
      
      {/* Hero Welcome Panel */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#12141c] to-black border border-gray-800 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-[60px]" />
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            SECURITY <span className="text-cyan-400">CONSOLE</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1 font-mono">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-1 bg-[#1a1e28] px-3.5 py-1.5 rounded-2xl border border-cyan-400/20 text-cyan-400 text-xs font-black tracking-widest uppercase">
          <Shield size={14} className="fill-current text-cyan-400" />
          Active Shield
        </div>
      </div>

      {/* Grid containing scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 01 Text Analysis */}
        <div className="bg-[#12141c]/60 backdrop-blur-md p-6 rounded-3xl border border-gray-800 flex flex-col hover:border-gray-700 transition-all duration-300">
          <h3 className="text-cyan-400 text-sm font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            01 Email Scanner
          </h3>
          <textarea
            placeholder="Paste email headers and text block here for heuristic investigation..."
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
            className="w-full h-44 px-4 py-3 rounded-2xl bg-[#171a22] border border-gray-800 text-white mb-4 outline-none focus:border-cyan-400 text-xs transition-all placeholder:text-gray-600"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAnalysis('text', textBody)}
              className="flex-1 py-3.5 rounded-xl bg-cyan-400 text-black font-black uppercase italic hover:bg-cyan-300 disabled:opacity-50 text-xs tracking-widest transition-all"
              disabled={loading.text || !textBody.trim()}
            >
              {loading.text ? "Analyzing..." : "Analyze Email Content"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTextBody("");
                setResult(prev => ({ ...prev, text: null }));
                setTextLogs([]);
              }}
              className="py-3.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white uppercase text-xs tracking-widest transition-all disabled:opacity-50"
              disabled={loading.text || !textBody.trim()}
            >
              Clear Text
            </button>
          </div>

          {isScanComplete(result.text, loading.text) && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 px-4 py-3 text-xs uppercase tracking-widest font-black">
              Analysis complete. Review your results below.
            </div>
          )}

          {(loading.text || textLogs.length > 0) && (
            <div className="mt-4 rounded-2xl border border-gray-800 bg-black/60 p-4">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 font-bold flex items-center gap-1.5">
                <RefreshCw size={11} className={`text-cyan-400 ${loading.text ? 'animate-spin' : ''}`} /> Live Analysis Streams
              </p>
              <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {textLogs.map((log, i) => (
                  <li key={i} className="text-[10px] text-gray-400 font-mono leading-relaxed border-l border-gray-800 pl-2">{log}</li>
                ))}
                {loading.text && (
                  <li className="text-[10px] text-cyan-400/80 font-mono animate-pulse pl-2 border-l border-gray-800">Interrogating models...</li>
                )}
              </ul>
            </div>
          )}

          {result.text && (
            <div className="mt-5 p-4.5 rounded-2xl bg-black border border-gray-800 border-l-4 border-l-cyan-400">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Email Verdict</span>
                {result.text.riskScore !== undefined && (
                  <span className="text-cyan-400 font-mono text-xs">{result.text.riskScore}% Risk Score</span>
                )}
              </div>

              <h4 className={`text-2xl font-black italic tracking-tighter ${getStatusClass(result.text.status)}`}>
                {result.text.status || "Unknown"}
              </h4>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-900">
                <div className="bg-[#171a22]/50 rounded-lg p-3">
                  <p className="text-[9px] text-gray-600 uppercase mb-2 font-black">Risk Assessment</p>
                  <p className="text-sm font-bold text-cyan-400">{result.text.riskScore}%</p>
                </div>
                {Array.isArray(result.text.linkAnalysis) && result.text.linkAnalysis.length > 0 && (
                  <div className="bg-[#171a22]/50 rounded-lg p-3">
                    <p className="text-[9px] text-gray-600 uppercase mb-2 font-black">URLs Detected</p>
                    <p className="text-sm font-bold text-cyan-400">{result.text.linkAnalysis.length} link{result.text.linkAnalysis.length !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>

              {result.text.reasons && result.text.reasons.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-900">
                  <p className="text-[9px] text-gray-600 uppercase mb-3 font-black">Email Content Analysis:</p>
                  <ul className="space-y-2">
                    {result.text.reasons.map((r, i) => (
                      <li key={i} className="text-[11px] text-gray-300 flex items-start gap-2 leading-relaxed bg-[#171a22]/50 rounded-lg p-2.5">
                        <span className="text-cyan-400 mt-0.5 font-bold">→</span> <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.text.linkAnalysis) && result.text.linkAnalysis.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-900">
                  <p className="text-[9px] text-gray-600 uppercase mb-3 font-black">URL-Level Verdicts:</p>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {result.text.linkAnalysis.map((item, i) => (
                      <div key={i} className="text-[11px] text-gray-300 bg-[#171a22] border border-gray-800 rounded-xl p-3">
                        <p className="break-all font-mono text-[10px] text-cyan-300">{item.url}</p>
                        <p className={`font-black uppercase text-[10px] mt-1.5 ${getStatusClass(item.status)}`}>
                          Status: {item.status} {item.riskScore !== undefined && `(${item.riskScore}% Risk)`}
                        </p>
                        {item.reasons && item.reasons.length > 0 && (
                          <p className="text-gray-500 mt-1 italic text-[10px]">Factor: {item.reasons.join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 02 URL Analysis */}
        <div className="bg-[#12141c]/60 backdrop-blur-md p-6 rounded-3xl border border-gray-800 flex flex-col hover:border-gray-700 transition-all duration-300">
          <h3 className="text-cyan-400 text-sm font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            02 URL Scanner
          </h3>
          <input
            type="url"
            placeholder="https://malicious-gateway.net/secure-login"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-[#171a22] border border-gray-800 text-white mb-4 outline-none focus:border-cyan-400 text-xs transition-all placeholder:text-gray-600"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAnalysis('url', url)}
              className="flex-1 py-3.5 rounded-xl border border-cyan-400 text-cyan-400 font-bold hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50 text-xs tracking-widest"
              disabled={loading.url || !url.trim()}
            >
              {loading.url ? "Scanning Destination..." : "Scan URL Destination"}
            </button>
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setResult(prev => ({ ...prev, url: null }));
                setUrlLogs([]);
              }}
              className="py-3.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white uppercase text-xs tracking-widest transition-all disabled:opacity-50"
              disabled={loading.url || !url.trim()}
            >
              Clear URL
            </button>
          </div>

          {isScanComplete(result.url, loading.url) && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 px-4 py-3 text-xs uppercase tracking-widest font-black">
              URL analysis complete. Review the reputation verdict below.
            </div>
          )}

          {(loading.url || urlLogs.length > 0) && (
            <div className="mt-4 rounded-2xl border border-gray-800 bg-black/60 p-4">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 font-bold flex items-center gap-1.5">
                <RefreshCw size={11} className={`text-cyan-400 ${loading.url ? 'animate-spin' : ''}`} /> Live URL Reputations
              </p>
              <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {urlLogs.map((log, i) => (
                  <li key={i} className="text-[10px] text-gray-400 font-mono leading-relaxed border-l border-gray-800 pl-2">{log}</li>
                ))}
                {loading.url && (
                  <li className="text-[10px] text-cyan-400/80 font-mono animate-pulse pl-2 border-l border-gray-800">Verifying domain DNS structure...</li>
                )}
              </ul>
            </div>
          )}

          {result.url && (
            <div className="mt-5 p-4.5 rounded-2xl bg-black border border-gray-800 border-l-4 border-l-cyan-400">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">URL Rep Verdict</span>
                {result.url.riskScore !== undefined && (
                   <span className="text-cyan-400 font-mono text-xs">{result.url.riskScore}% Risk</span>
                )}
              </div>
              
              <h4 className={`text-2xl font-black italic tracking-tighter ${
                result.url.status === 'Malicious' || result.url.status === 'Phishing' ? 'text-red-500' : 
                result.url.status === 'Suspicious' ? 'text-yellow-500' : 'text-green-400'
              }`}>
                {result.url.status}
              </h4>

              {result.url.reasons && result.url.reasons.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-gray-900">
                  <p className="text-[9px] text-gray-600 uppercase mb-2 font-black">Identified URL Factors:</p>
                  <ul className="space-y-1.5">
                    {result.url.reasons.map((r, i) => (
                      <li key={i} className="text-[11px] text-gray-400 flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">•</span> <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 03 Attachment Analysis Full Width Panel */}
      <div className="bg-[#12141c]/60 backdrop-blur-md p-6 rounded-3xl border border-gray-800 hover:border-gray-700 transition-all duration-300">
        <h3 className="text-cyan-400 text-sm font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          03 Attachment Scanner
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Uploader Section */}
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                dragActive 
                  ? "border-cyan-400 bg-cyan-950/10 shadow-lg shadow-cyan-400/5" 
                  : "border-gray-800 bg-[#171a22]/50 hover:border-gray-700 hover:bg-[#171a22]"
              }`}
              onClick={onButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <UploadCloud size={44} className={`text-gray-500 mb-3 transition-colors ${dragActive ? "text-cyan-400" : ""}`} />
              
              <p className="text-xs text-white font-bold text-center">
                Drag and drop your attachment here, or <span className="text-cyan-400 hover:underline">browse files</span>
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-2 text-center">
                Analyzes macro signatures, droppers, and double extensions. Max 10MB.
              </p>
            </div>

            {selectedFile && (
              <div className="bg-[#171a22] border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black border border-gray-800 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white font-bold truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB size</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(prev => ({ ...prev, file: null }));
                      setFileLogs([]);
                    }}
                    className="py-2 px-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-[10px] uppercase tracking-widest"
                  >
                    Clear File
                  </button>
                  <div className="text-[10px] font-black uppercase text-gray-500 border border-gray-800 rounded-lg px-2.5 py-1">
                    Ready
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sandbox Logs & Results */}
          <div className="space-y-4">
            {(loading.file || fileLogs.length > 0) && (
              <div className="rounded-2xl border border-gray-800 bg-black/60 p-4">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-2.5 font-black flex items-center gap-1.5">
                  <RefreshCw size={11} className={`text-cyan-400 ${loading.file ? 'animate-spin' : ''}`} /> Sandboxed Execution Log Output
                </p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {fileLogs.map((log, i) => (
                    <li key={i} className="text-[10px] text-gray-400 font-mono leading-relaxed border-l border-gray-800 pl-2">{log}</li>
                  ))}
                  {loading.file && (
                    <li className="text-[10px] text-cyan-400/80 font-mono animate-pulse pl-2 border-l border-gray-800">Hashing binary buffers...</li>
                  )}
                </ul>
              </div>
            )}

            {result.file && (
              <div className="p-5 rounded-2xl bg-black border border-gray-800 border-l-4 border-l-cyan-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Sandbox Investigation</span>
                  {result.file.riskScore !== undefined && (
                    <span className="text-cyan-400 font-mono text-xs">{result.file.riskScore}% Sandbox Risk</span>
                  )}
                </div>

                <h4 className={`text-2xl font-black italic tracking-tighter ${getStatusClass(result.file.status)}`}>
                  {result.file.status || "Unknown"}
                </h4>

                {result.file.fileHash && (
                  <p className="mt-2 text-[10px] text-gray-400 font-mono break-all">
                    SHA-256: <span className="text-cyan-400">{result.file.fileHash}</span>
                  </p>
                )}

                {result.file.reasons && result.file.reasons.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-gray-900">
                    <p className="text-[9px] text-gray-600 uppercase mb-2 font-black">Sandbox Flagged Behaviors:</p>
                    <ul className="space-y-1.5">
                      {result.file.reasons.map((r, i) => (
                        <li key={i} className="text-[11px] text-gray-400 flex items-start gap-2 leading-relaxed">
                          <span className="text-cyan-500 mt-0.5">•</span> <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!loading.file && !result.file && (
              <div className="border border-gray-800 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center bg-black/20 h-44 text-center">
                <AlertCircle size={24} className="text-gray-600 mb-2" />
                <p className="text-xs text-gray-400">Waiting for binary scan stream input.</p>
                <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">Upload a file to trigger sandboxed analysis.</p>
              </div>
            )}

          </div>

        </div>
      </div>

      {/*  User Statistics Pie Charts */}
      <div className="mt-8 border-t border-gray-800/60 pt-8">
        <h2 className="text-2xl font-black italic text-white tracking-tighter mb-6 uppercase">
          Your Investigation Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#12141c]/60 p-6 rounded-3xl border border-gray-800 flex flex-col items-center">
            <h3 className="text-gray-400 text-xs font-black tracking-widest uppercase mb-4 text-center">Email Scans Distribution</h3>
            <div className="w-full flex-grow flex items-center justify-center">
              <ScanResultPieChart scanResultSummary={emailSummary} />
            </div>
          </div>
          
          <div className="bg-[#12141c]/60 p-6 rounded-3xl border border-gray-800 flex flex-col items-center">
            <h3 className="text-gray-400 text-xs font-black tracking-widest uppercase mb-4 text-center">URL Scans Distribution</h3>
            <div className="w-full flex-grow flex items-center justify-center">
              <ScanResultPieChart scanResultSummary={urlSummary} />
            </div>
          </div>

          <div className="bg-[#12141c]/60 p-6 rounded-3xl border border-gray-800 flex flex-col items-center">
            <h3 className="text-gray-400 text-xs font-black tracking-widest uppercase mb-4 text-center">Attachment Scans Distribution</h3>
            <div className="w-full flex-grow flex items-center justify-center">
              <ScanResultPieChart scanResultSummary={attachmentSummary} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;


