import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "../components/admin/AdminNav";
import ScanResultPieChart from "../components/admin/ScanResultPieChart";
import { getAdminStats } from "../services/adminApi";

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = useMemo(() => {
    if (!stats) return [];

    return [
      { label: "Total Users", value: stats.totalUsers, color: "text-cyan-400" },
      { label: "Total Scans", value: stats.totalScans, color: "text-cyan-400" },
      { label: "Total Phishing", value: stats.scanResultSummary?.Phishing || 0, color: "text-red-400" },
      { label: "Admin Accounts", value: stats.totalAdmins, color: "text-amber-400" },
      { label: "Safe", value: stats.scanResultSummary?.Safe || 0, color: "text-green-400" },
      { label: "Suspicious", value: stats.statusSummary?.Suspicious || 0, color: "text-yellow-400" },
    ];
  }, [stats]);

  const recentScans = stats?.recentScans || [];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <AdminNav />

      {error && (
        <div className="mb-6 rounded-lg border border-red-600 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
            <h2 className="text-sm uppercase tracking-wider text-gray-400">{card.label}</h2>
            <p className={`text-3xl mt-2 font-bold ${card.color}`}>
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <ScanResultPieChart scanResultSummary={stats?.scanResultSummary} />
      </div>

      <div className="mt-8 rounded-xl border border-gray-800 bg-[#141414] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-cyan-400">Recent Scans</h2>
          <p className="text-xs text-gray-500">Latest 10 records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black text-[11px] uppercase tracking-wide text-gray-400">
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
              {!loading && recentScans.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No scans found yet.
                  </td>
                </tr>
              )}

              {recentScans.map((scan) => (
                <tr key={scan._id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-400">
                    {new Date(scan.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {scan.userId?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-3 text-sm uppercase text-gray-300">{scan.type}</td>
                  <td className="px-6 py-3 text-sm max-w-[320px] truncate" title={scan.value}>
                    {scan.value}
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-cyan-300">{scan.riskScore ?? 0}%</td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`font-semibold ${
                        scan.status === "Malicious"
                          ? "text-red-400"
                          : scan.status === "Suspicious"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {scan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;