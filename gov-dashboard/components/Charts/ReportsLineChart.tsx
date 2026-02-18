// components/Charts/ReportsLineChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type D = { name: string; value: number };

export default function ReportsLineChart({ data }: { data: D[] }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500 mb-2">Reports (last 14 days)</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" minTickGap={20} tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
