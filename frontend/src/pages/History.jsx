import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Eye, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import { buildApiUrl, getAuthHeaders } from "../config/api";

const History = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Filter States
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      fetchHistory(savedUser._id || savedUser.id);
    }
  }, []);

  const fetchHistory = async (userId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(buildApiUrl(`/api/scans/history/${userId}`), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to load historical scan logs");
      }

      const data = await response.json();
      setScans(data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Unable to download scanning history logs.");
    } finally {
      setLoading(false);
    }
  };

  // Normalizes and filters local data
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Normalize status matches
      const scanStatus = (scan.status === "Malicious" || scan.status === "Phishing") ? "Phishing" : scan.status;
      const scanType = scan.type || "url";

      const matchType = typeFilter === "All" || scanType.toLowerCase() === typeFilter.toLowerCase();
      const matchStatus = statusFilter === "All" || scanStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchType && matchStatus;
    });
  }, [scans, typeFilter, statusFilter]);

  const getStatusIcon = (status) => {
    if (status === "Phishing" || status === "Malicious") return <ShieldAlert size={14} className="text-red-500 shrink-0" />;
    if (status === "Suspicious") return <HelpCircle size={14} className="text-yellow-500 shrink-0" />;
    return <CheckCircle size={14} className="text-green-400 shrink-0" />;
  };

  const getStatusClass = (status) => {
    if (status === "Phishing" || status === "Malicious") return "text-red-500 border-red-500/20 bg-red-500/5";
    if (status === "Suspicious") return "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";
    return "text-green-400 border-green-400/20 bg-green-400/5";
  };

  return (
    <div className="w-full mt-2 space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
          SCAN <span className="text-cyan-400">HISTORY</span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">Review all your previous Email, URL, and Attachment sandbox checks.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#12141c]/60 backdrop-blur-md p-4 rounded-3xl border border-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Scan Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#171a22] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 transition-all capitalize"
            >
              <option value="All">All Types</option>
              <option value="url">URLs Only</option>
              <option value="email">Emails Only</option>
              <option value="attachment">Attachments Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Verdict:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#171a22] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 transition-all"
            >
              <option value="All">All Verdicts</option>
              <option value="Safe">Safe</option>
              <option value="Suspicious">Suspicious</option>
              <option value="Phishing">Phishing</option>
            </select>
          </div>

        </div>

        {/* Counter Info */}
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
          Scans listed: <span className="text-cyan-400">{filteredScans.length}</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-3xl border border-gray-800 bg-[#12141c]/40 backdrop-blur-md shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#171a22]/70 text-gray-500 text-[10px] uppercase tracking-widest font-black border-b border-gray-800/80">
            <tr>
              <th className="px-6 py-4">Scan Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Scan Target Checked</th>
              <th className="px-6 py-4">Risk %</th>
              <th className="px-6 py-4">Threat Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/60">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-cyan-400 font-mono text-xs animate-pulse">
                  Querying threat history database...
                </td>
              </tr>
            ) : filteredScans.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-xs italic">
                  {scans.length === 0 ? "You have not completed any security scans yet." : "No scan logs match your selected filter query."}
                </td>
              </tr>
            ) : (
              filteredScans.map((scan) => {
                const normStatus = (scan.status === "Malicious" || scan.status === "Phishing") ? "Phishing" : scan.status;
                return (
                  <tr key={scan._id} className="hover:bg-cyan-500/5 transition-all duration-200">
                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                      {new Date(scan.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-lg border border-gray-800 text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/20">
                        {scan.type || "url"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold truncate max-w-xs text-gray-300" title={scan.value}>
                      {scan.value}
                    </td>
                    <td className="px-6 py-4 text-cyan-400 font-mono text-xs font-bold">
                      {scan.riskScore !== undefined ? `${scan.riskScore}%` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black italic uppercase ${getStatusClass(normStatus)}`}>
                        {getStatusIcon(normStatus)}
                        {normStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => navigate(`/report/${scan._id}`)}
                        className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 text-xs font-black uppercase tracking-wider hover:bg-cyan-400 hover:text-black transition-all"
                      >
                        <Eye size={12} />
                        Report
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default History;