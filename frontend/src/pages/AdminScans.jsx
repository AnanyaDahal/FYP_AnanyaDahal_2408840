import React, { useCallback, useEffect, useState, useMemo } from "react";
import AdminNav from "../components/admin/AdminNav";
import { getAdminScans, deleteAdminScan } from "../services/adminApi";

// Helper function to map Malicious to Phishing
const normalizeStatus = (status) => {
  if (!status) return "Unknown";
  if (status === "Malicious") return "Phishing";
  return status;
};

const AdminScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [userFilter, setUserFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminScans();
      setScans(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch scans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Handle Delete Scan
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;
    
    try {
      await deleteAdminScan(id);
      // Remove the deleted scan from the UI instantly
      setScans((prevScans) => prevScans.filter((scan) => scan._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete scan");
    }
  };

  // Dynamically extract unique options for our dropdowns
  const uniqueUsers = useMemo(() => {
    const users = scans.map(s => s.userId?.name || "Unknown");
    return ["All", ...new Set(users)];
  }, [scans]);

  const uniqueStatuses = useMemo(() => {
    // Normalize statuses so 'Malicious' becomes 'Phishing' in the dropdown
    const statuses = scans.map(s => normalizeStatus(s.status));
    return ["All", ...new Set(statuses)];
  }, [scans]);

  const uniqueTypes = useMemo(() => {
    const types = scans.map(s => (s.type || "url").toLowerCase());
    return ["All", ...new Set(types)];
  }, [scans]);

  // Filter the scans based on selected dropdown values
  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const scanUser = scan.userId?.name || "Unknown";
      // Normalize the status here as well so the filter logic catches both
      const scanStatus = normalizeStatus(scan.status); 
      const scanType = (scan.type || "url").toLowerCase();

      const matchUser = userFilter === "All" || scanUser === userFilter;
      const matchStatus = statusFilter === "All" || scanStatus === statusFilter;
      const matchType = typeFilter === "All" || scanType === typeFilter.toLowerCase();

      return matchUser && matchStatus && matchType;
    });
  }, [scans, userFilter, statusFilter, typeFilter]);

  // Reset filters
  const clearFilters = () => {
    setUserFilter("All");
    setStatusFilter("All");
    setTypeFilter("All");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Admin - Scans</h1>
          <p className="text-gray-400">Track all scan activity across users.</p>
        </div>
      </div>

      <AdminNav />

      {error && <div className="mb-4 rounded-lg border border-red-700 bg-red-700/10 p-3 text-red-300">{error}</div>}

      {/* Filters Section */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-[#141414] p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Filter by User</label>
          <select 
            value={userFilter} 
            onChange={(e) => setUserFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-cyan-400 min-w-[150px]"
          >
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Filter by Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-cyan-400 min-w-[150px]"
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Filter by Type</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-cyan-400 min-w-[150px] capitalize"
          >
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {(userFilter !== "All" || statusFilter !== "All" || typeFilter !== "All") && (
          <button 
            onClick={clearFilters}
            className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#141414]">
        <table className="w-full text-left">
          <thead className="bg-black text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Target</th>
              <th className="px-6 py-3">Risk</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!loading && filteredScans.length === 0 && (
              <tr>
                {/* Updated colSpan to 7 to match the new Actions column */}
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  {scans.length === 0 ? "No scans found in database." : "No scans match your current filters."}
                </td>
              </tr>
            )}

            {filteredScans.map((scan) => {
              // Apply normalized status for the UI display
              const displayStatus = normalizeStatus(scan.status);
              
              return (
                <tr key={scan._id} className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-3 text-sm text-gray-400">{new Date(scan.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm">{scan.userId?.name || "Unknown"}</td>
                  <td className="px-6 py-3 text-sm uppercase text-gray-300">{scan.type || "url"}</td>
                  <td className="px-6 py-3 max-w-[360px] truncate text-sm" title={scan.value}>{scan.value}</td>
                  <td className="px-6 py-3 text-sm font-mono text-cyan-300">{scan.riskScore ?? 0}%</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`font-semibold ${
                      displayStatus === "Phishing" ? "text-red-400" :
                      displayStatus === "Suspicious" ? "text-yellow-400" :
                      "text-green-400"
                    }`}>
                      {displayStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right">
                    <button 
                      onClick={() => handleDelete(scan._id)}
                      className="rounded bg-red-600/10 px-3 py-1 text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                      title="Delete Scan"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminScans;