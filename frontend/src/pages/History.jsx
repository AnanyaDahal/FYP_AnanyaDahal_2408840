import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      fetchHistory(savedUser._id || savedUser.id);
    }
  }, []);

  const fetchHistory = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/scans/history/${userId}`);
      const data = await response.json();
      setScans(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 w-full min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 italic tracking-tighter text-cyan-400">SCAN HISTORY</h2>
      
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#121212]">
        <table className="w-full text-left">
          <thead className="bg-black text-cyan-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Target URL</th>
              <th className="px-6 py-4">Risk</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {scans.map((scan) => (
              <tr key={scan._id} className="hover:bg-[#1a1a1a] transition-all">
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(scan.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm truncate max-w-xs">{scan.value}</td>
                <td className="px-6 py-4 text-cyan-400 font-mono text-sm">{scan.riskScore}%</td>
                <td className="px-6 py-4">
                  <span className={`font-black italic uppercase text-xs ${
                    scan.status === 'Malicious' ? 'text-red-500' : 
                    scan.status === 'Suspicious' ? 'text-yellow-500' : 'text-green-400'
                  }`}>
                    {scan.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => navigate(`/report/${scan._id}`)}
                    className="px-4 py-1 border border-cyan-400 text-cyan-400 text-xs font-bold rounded hover:bg-cyan-400 hover:text-black transition-all"
                  >
                    VIEW REPORT
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;