// components/Charts/StatusDonut.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#ef4444", "#f59e0b", "#10b981"]; // red, amber, green

type D = { name: string; value: number };

export default function StatusDonut({ data }: { data: D[] }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500 mb-2">Cases by status</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={4} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
