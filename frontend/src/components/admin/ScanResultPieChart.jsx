import React from "react";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const ScanResultPieChart = ({ scanResultSummary }) => {
  const safe = scanResultSummary?.Safe || 0;
  const suspicious = scanResultSummary?.Suspicious || 0;
  const phishing = scanResultSummary?.Phishing || 0;

  const data = {
    labels: ["Safe", "Suspicious", "Phishing"],
    datasets: [
      {
        data: [safe, suspicious, phishing],
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
        borderColor: ["#14532d", "#78350f", "#7f1d1d"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: "#d1d5db",
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#141414] p-6">
      <h2 className="mb-4 text-lg font-semibold text-cyan-400">Scan Result Breakdown</h2>
      <div className="mx-auto max-w-[320px]">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default ScanResultPieChart;