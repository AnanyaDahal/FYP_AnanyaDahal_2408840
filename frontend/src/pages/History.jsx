import React from "react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  // Mock scan history (later comes from DB)
  const historyData = [
    {
      id: 1,
      value: "http://secure-login-paypal.com",
      type: "URL",
      status: "Phishing",
      date: "2026-02-01",
    },
    {
      id: 2,
      value: "support@google-secure.net",
      type: "Email",
      status: "Phishing",
      date: "2026-01-30",
    },
    {
      id: 3,
      value: "https://github.com",
      type: "URL",
      status: "Safe",
      date: "2026-01-28",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f2027]">
      <div className="flex-1 p-10">
        <h1 className="text-white text-3xl font-bold mb-8">
          Scan History
        </h1>

        <div className="bg-[#121212] rounded-2xl shadow-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#1e1e1e] text-gray-400">
              <tr>
                <th className="text-left px-6 py-4">Type</th>
                <th className="text-left px-6 py-4">Value</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {historyData.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-800 hover:bg-[#1a1a1a]"
                >
                  <td className="px-6 py-4 text-gray-300">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 text-gray-300 break-all">
                    {item.value}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Phishing"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/report/${item.id}`)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      View Report
                    </button>
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

export default History;
