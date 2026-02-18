// components/Charts/LineChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = { data: { name: string; value: number }[]; title?: string };

export default function SmallLineChart({ data, title }: Props) {
  return (
    <div className="bg-white p-4 rounded shadow">
      {title && <div className="text-sm text-gray-500 mb-2">{title}</div>}
      <div style={{ width: "100%", height: 120 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

