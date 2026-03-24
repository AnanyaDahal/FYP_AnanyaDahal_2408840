import React, { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/admin/AdminNav";
import { getAdminScans } from "../services/adminApi";

const AdminScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <h1 className="mb-2 text-3xl font-bold">Admin - Scans</h1>
      <p className="mb-6 text-gray-400">Track all scan activity across users.</p>

      <AdminNav />

      {error && <div className="mb-4 rounded-lg border border-red-700 bg-red-700/10 p-3 text-red-300">{error}</div>}

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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!loading && scans.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No scans found.
                </td>
              </tr>
            )}

            {scans.map((scan) => (
              <tr key={scan._id} className="hover:bg-[#1a1a1a]">
                <td className="px-6 py-3 text-sm text-gray-400">{new Date(scan.createdAt).toLocaleString()}</td>
                <td className="px-6 py-3 text-sm">{scan.userId?.name || "Unknown"}</td>
                <td className="px-6 py-3 text-sm uppercase text-gray-300">{scan.type || "url"}</td>
                <td className="px-6 py-3 max-w-[360px] truncate text-sm" title={scan.value}>{scan.value}</td>
                <td className="px-6 py-3 text-sm font-mono text-cyan-300">{scan.riskScore ?? 0}%</td>
                <td className="px-6 py-3 text-sm">
                  <span className={`font-semibold ${
                    scan.status === "Malicious" ? "text-red-400" :
                    scan.status === "Suspicious" ? "text-yellow-400" :
                    "text-green-400"
                  }`}>
                    {scan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminScans;